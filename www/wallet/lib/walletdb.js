var conf = require('../config');

var stripe = require('stripe')(conf.stripe_sekrit);

exports.get_stripe_methods = function (customer_id, cb) {
  var err = null,
      cc = null;
  
  cb(err, cc);
};