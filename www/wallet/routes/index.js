// Secret Key... shhhh
var config = require('../config');

var fs = require('fs'),
    path = require('path'),
    redis = require('redis').createClient(),
    stripe = require('stripe')(config.sekrit_key),
    util = require('util');

var browserid = require('connect-browserid'),
    db = require('../lib/db'),
    userdb = require('../lib/userdb'),
    walletdb = require('../lib/walletdb');

/*
 * GET home page.
 */

exports.lift = function (req, resp) {
  var raw_include = 
        path.resolve(
            path.join(
                __dirname,
                '../public/javascripts/include.js'));
  fs.readFile(raw_include, 
      function (err, data) {
          if (err) {
              console.error(err);
              return resp.send(err, 500);
          }
          return resp.send(data.toString().replace('IP_ADDRESS', config.browserid_audience));
      });
};

exports.index = function(req, res){
  res.render('index', { title: 'Wallet' })
};

var existing_pay_methods = function (email, cb) {
  db.withDb(function (err, conn, db) {
    if (err) { console.error(err); return cb(err, []); }
    userdb.get_user(conn, email, function (err, user) {    
      if (err) { console.error(err); return cb(err, []); }
      if (user.customer_id) {
        walletdb.get_stripe_methods(user.customer_id, function (err, cc) {
          if (err) { console.error(err); return cb(err, []); }
          if (cc) {
            pay_meths.push({
              type: cc.type,
              display: util.format('Ends in %s', cc.last4),
              expires: util.format('%d/%d', cc.exp_month, cc.exp_year)
           });
         }
          pay_meths.push({
            type: 'IOU'
          });
          cb(null, pay_meths);
        });
      } else {
        cb(null, []);
      }
    });
  });//withDb
};

exports.pay = function(req, res){
  // Demo GAWDs
  req.user = 'eozten@yahoo.com';
  res.local('user', req.user);
  if (req.user) {
    pay_meths = existing_pay_methods(req.user, function (err, pay_meths) {
      res.render('pay', {
                 title: 'Wallet',
                 existing_methods: pay_meths});
    });

  } else {
    res.render('pay', {
                 title: 'Wallet',
                 existing_methods: []});
  }
};

exports.existing_payment = function (req, resp) {
  if (browserid.enforceLogIn(req, resp)) return;
  var pay_meths = existing_pay_methods(req.user, function (err, pay_meths){
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
    console.log('payment-type', paymentType);
    console.log('expires', expires);

    // TODO: check if exists... persist to redis, etc
    stripe.customers.create(
       { email: email, card: req.body.stripeToken },
       function(err, customer) {
          if (err) {
             console.log("Couldn't create the customer record");
             return;
          }
          var key = util.format("stripe-customerid-%s", email),
              pay_meth_key;
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