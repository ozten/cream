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
    punkmoney = require('../lib/punkmoney'),
    stripe_pay = require('../lib/stripe_pay'),
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
  var pay_meths = [],
      counter = 2;
  pay_meths.push({
    type: 'IOU'
  });
  punkmoney.get_account(email, function (err, user) {
    
    if (err) {
      console.log('no user is okay, trying anyways', err); 
    } else {
      pay_meths.push({
        type: 'PunkMoney',
        punk: user
      });
    }
    counter--;
    if (counter == 0) {
        cb(null, pay_meths);
    }
    
  });
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
          
          console.log('loaded ', pay_meths);
          counter--;
          if (counter == 0) {
            cb(null, pay_meths);  
          }
          
        });
      } else {
        counter--;
        if (counter == 0) {
          cb(null, pay_meths);
        }
      }
    });
  });//withDb
}; // existing_payment

exports.existing_payment_details = function (req, resp) {
  var payment_type = req.params.method.toLowerCase(),
      ctx = {};
  ctx.payment_type = payment_type;
  // TODO
  ctx.merchant_twitter_username = '@ozten';
  console.log('payment_type', payment_type);
  
  resp.partial('existing_payment_details_' + payment_type, ctx);
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

exports.add_punk_money_method = function (req, resp) {
  if (browserid.enforceLogIn(req, resp)) return;
  console.log('add-punk-money-method');
  punkmoney.new_token(req, resp, '/add-punk-money-finish');
};

exports.add_punk_money_finish = function (req, resp) {
  if (browserid.enforceLogIn(req, resp)) return;
  console.log('finish-add-punk-money-method');
  punkmoney.get_account(req.user, function (err, user) {
    if (err) {
      console.error(err);
      resp.send("ERROR Loading PunkMoney Account", 500);
    } else {
      resp.render('add_punk_money_finish', {
          title: 'PunkMoney Account Confirmed',
          user: user});
    }
  });
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
    
    console.log('============== wallet route stripe_add_payment');
    util.puts(req.user);
    var email = req.user;
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
          } else {
            var key = util.format("stripe-customerid-%s", email),
                pay_meth_key;
            console.log('customer==');
            util.puts(customer);
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
          }
          
       });
};

exports.pay_transaction = function (req, resp) {
  if (browserid.enforceLogIn(req, resp)) return;
  console.log('========== pay_transaction');
  util.puts(req.body.payment_type);
  if (req.body.payment_type.toUpperCase().indexOf('VISA') !== -1) {
    mod = stripe_pay;
  } else if (req.body.payment_type.toUpperCase().indexOf('PUNKMONEY') !== -1) {
    mod = punkmoney;
  } else {
    console.log(details.payment_type);
    throw "TODO: right now this is stripe active card only";
  }
  mod.pay_transaction(req.user, req.body, function (err, reciept) {
      if (err) {
        console.error(err);
        resp.send(err, 500);
      } else {
        resp.send(JSON.stringify(reciept), {'Content-Type': 'application/json'});
      }
    });

};
