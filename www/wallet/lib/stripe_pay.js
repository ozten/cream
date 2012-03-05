var config = require('../etc/config'),
    db = require('./db'),
    /* TODO: merchant's stripe account, not a shared account */
    stripe = require('stripe')(config.stripe_sekrit),
    util = require('util');

exports.pay_transaction = function (email, details, cb) {
  db.withDb(function (err, conn, _db) {
    userdb.get_user(conn, email, function (err, user) {
    if (! user.customer_id) throw "Error, no stripe customer info";
    console.log('================= stripe_pay pay_transaction');
    util.puts(details.merchant_email);
    var paydata = {
      amount: details.amount,
      currency: 'usd',
      customer: user.customer_id, 
      description: details.description
    };
  stripe.charges.create(paydata,
      function (err, charge) {
        if (err) {
          cb(err);
        } else {
          var pay_info = util.format("%s %d", charge.card.type, charge.card.last4);
          var data = {
            date: new Date(charge.created),
            amount: charge.amount,
            description: charge.description,
            currency: charge.currency,
            payment_type: pay_info,
            merchant_email: 'shout@ozten.com', // TODO like stripe require, should be merchant
            transaction: charge.id
          };
          cb(null, data);
        }
    });//charges.create

    });//get_user
  });//withDb	
};