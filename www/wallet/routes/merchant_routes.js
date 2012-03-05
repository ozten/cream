var browserid = require('connect-browserid'),
    conf = require('../etc/config'),
    db = require('../lib/db'),
    punkmoney = require('../lib/punkmoney'),
    util= require('util');

exports.merchant = function(req, resp){
  if (browserid.enforceLogIn(req, resp)) return;
  resp.render('merchant/index', { 
    title: 'Recieve Money',
    layout: 'site_layout' });  
};

/**
 * PunkMoney, VISA, etc
 */
exports.merchant_add_payment = function (req, resp) {
  if (browserid.enforceLogIn(req, resp)) return;
  console.log('merchant_add_payment');

  var ctx = {
    title: "Add Payment Method",
    method: req.params.method,
    pay_info: {},
    twitter_user: null,
    layout: 'site_layout'
  }; 
  
  punkmoney.get_account(req.user, function (err, user) {
    if (err) {
      console.error(err);
    } else {
      ctx.twitter_user = user;
    }
    resp.render("merchant/add_payment", ctx);
  });
};

exports.merchant_twitter_login = function (req, resp) {

  resp.send('hey');
};

exports.merchant_start_oauth = function (req, resp) {
	punkmoney.new_token(req, resp, '/merchant/add-payment/punkmoney');
};

exports.merchant_oauth = function (req, resp) {
  console.log("MERCH OAUTH saving token");
  punkmoney.save_token(req.user, req.session, resp);
  
};
