// Secret Key... shhhh
var config = require('./config');

var redis = require('redis').createClient(),
    stripe = require('stripe')(config.sekrit_key),
    util = require('util');

/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Wallet' })
};

exports.pay = function(req, res){
  //TODO ... hmm I think get this data back in winChan...
  res.render('pay', { 
                 title: 'Wallet',
                 existing_methods: [
                   {
                       type: 'VISA',
                       display: 'Ends in 9935',
                       expires: '04/12'
                   },
                   {
                       type: 'IOU'
                   }
                 ]});
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