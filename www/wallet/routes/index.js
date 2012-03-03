var config = require('../etc/config');

var fs = require('fs'),
    path = require('path'),
    redis = require('redis').createClient(),
    stripe = require('stripe')(config.stripe_sekrit), // Currently tied to one merchant...
    _ = require('underscore'),
    util = require('util');

var browserid = require('connect-browserid'),
    db = require('../lib/db'),
    merchant = require('./merchant_routes'),
    userdb = require('../lib/userdb'),
    walletdb = require('../lib/walletdb');

redis.on('error', function (err) {
  // We handle redis errors at the top level
});

console.log(merchant);
for (var k in merchant) {
  exports[k] = merchant[k];
}
console.log(exports);
/*
 * GET home page.
 */

exports.lift = function (req, resp) {
  var raw_include = 
        path.resolve(
            path.join(
                __dirname,
                '../client/js/include.js'));
  fs.readFile(raw_include, 
      function (err, data) {
          if (err) {
              console.error(err);
              return resp.send(err, 500);
          }
          return resp.send(data.toString().replace('IP_ADDRESS', config.browserid_audience));
      });
};

exports.index = function(req, resp){
  resp.render('index', { 
    title: 'Wallet',
    layout: 'site_layout' });  
};


var existing_pay_methods = function (email, cb) {
  var pay_meths = [];
  db.withDb(function (err, conn, db) {
    if (err) { console.error(err); return cb(err, []); }
    userdb.get_user(conn, email, function (err, user) {    
      if (err) { console.error(err); return cb(err, []); }
      if (user.customer_id) {
        console.log('going to stripe for method ', user.customer_id);
        walletdb.get_stripe_methods(user.customer_id, function (err, customer) {
          if (err) { console.error(err); return cb(err, []); }
          var cc = customer.active_card;
          console.log(cc);
          if (cc) {
              console.log('pushing', cc);
            pay_meths.push({
              type: cc.type,
              display: util.format('Ends in %s expires %d/%d', 
                                   cc.last4, cc.exp_month, cc.exp_year),
              expires: util.format('%d/%d', cc.exp_month, cc.exp_year)
           });
         }
          pay_meths.push({
            type: 'IOU'
          });
          console.log('loaded ', pay_meths);
          cb(null, pay_meths);
        });
      } else {
        cb(null, []);
      }
    });
  });//withDb
};

/**
 * Support to main use cases:
 * 1) Anonymous user, login to unlock wallet
 * 2) Authenticated user, wallet is already unlocked
 */
exports.pay = function(req, res){
  var render = req.xhr ? _.bind(res.partial, res) : _.bind(res.render, res);
  console.log(req.xhr, ' ', render);
  if (req.user) {
    existing_pay_methods(req.user, function (err, pay_meths) {
      render('pay', {
                 title: 'Wallet',
                 util: util,
                 existing_methods: pay_meths});
    });

  } else {
      render('pay', {
                 title: 'Wallet',
                 existing_methods: []});
  }
};

exports.existing_payment = function (req, resp) {
  if (browserid.enforceLogIn(req, resp)) return;
  existing_pay_methods(req.user, function (err, pay_meths){
    if (err) return resp.send(err, 500);
    return resp.partial('existing_payment_methods', 
                     {existing_methods: pay_meths});
  });  
};

exports.add_payment_method = function(req, res){
  res.partial('add-payment-method', {
                 title: 'Add a Payment Method to Your Wallet',
                 existing_methods: [
                   {
                       type: 'VISA',
                       display: 'Ends in 9935',
                       expires: '04/12'
                   },
                   {
                       type: 'IOU'
                   }
                 ]
             });
};

exports.stripe_add_payment = function (req, resp) {
    // TODO: push email into API? It is implicit, but we don't
    // want to run a second copy of BrowserID
    var email = 'eozten@yahoo.com';
    var paymentType = req.body['payment-type'];
    var expires = util.format('%s/%s', req.body['visa-expiration-month'],
                                       req.body['visa-expiration-year'].slice(-2));
    console.log('creatring with stripe', email);
    console.log('payment-type', paymentType);
    console.log('expires', expires);

    // TODO: check if exists... persist to redis, etc
    stripe.customers.create(
       { email: email, card: req.body.stripeToken },
       function(err, customer) {
          if (err) {
             console.log(err, customer);
             console.log("Couldn't create the customer record", err);
             return resp.send(err, 500);
          }
          var key = util.format("stripe-customerid-%s", email),
              pay_meth_key;

          // mysql and redis TODO pick a horse
          db.withDb(function (err, conn, _db) {
            userdb.create_stripe_customer(conn, email, customer.id);
          });

          redis.set(key, customer.id);

          // List of all stripe customer ids
          redis.rpush('stripe-customers', customer.id);

          pay_meth_key = util.format("pay-methods-%s-%s", email, paymentType);
          redis.hmset(pay_meth_key, {
            type: paymentType,
            cc: req.body['visa-cc'],
            expires: expires
          });

          // List of all payment methods by email
          key = util.format("pay-methods-%s", email);
          redis.rpush(key, pay_meth_key);

          console.log("customer id", customer.id);
          resp.redirect('/pay');
       });
};

exports.pay_transaction = function (req, resp) {
  if (browserid.enforceLogIn(req, resp)) return;
  db.withDb(function (err, conn, _db) {
    userdb.get_user(conn, req.user, function (err, user) {
    if (! user.customer_id) throw "Error, no stripe customer info";

    var paydata = {
      amount: req.body.amount,
      currency: 'usd',
      customer: user.customer_id,
      description: req.body.description
    };
  console.log(req.body.payment_type);
  if (req.body.payment_type.toUpperCase() != 'VISA_1') {
    throw "TODO: right now this is stripe active card only";
  }
  console.log(req.user);
  console.log(req.body.amount);

  console.log(req.body.description);
  // Payee - Currently shout@ozten.com  stripe account...
/* TODO merchant email -> stripe account */
  stripe.charges.create(paydata,
      function (err, charge) {
        if (err) {
          console.error(err);
          resp.send(err, 500);
        } else {
          var pay_info = util.format("%s %d", charge.card.type, charge.card.last4);
          console.log('charge info', charge);
          var data = {
            date: new Date(charge.created),
            amount: charge.amount,
            description: charge.description,
            currency: charge.currency,
            payment_type: pay_info,
            merchant_email: 'shout@ozten.com', /* TODO */
            transaction: charge.id
          };
          resp.send(JSON.stringify(data), {'Content-Type': 'application/json'});
        }
    });//charges.create

    });//get_user
  });//withDb

};
