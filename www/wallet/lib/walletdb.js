var conf = require('../etc/config');

var stripe = require('stripe')(conf.stripe_sekrit);

exports.get_stripe_methods = function (customer_id, cb) {
  var err = null,
      cc = null;
  stripe.customers.retrieve(customer_id, cb);
};