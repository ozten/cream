
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Wallet' })
};

exports.pay = function(req, res){
  res.render('pay', { title: 'Pay' })
};