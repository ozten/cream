var crypto = require('crypto'),
    mail = require('mail').Mail({
      host: 'localhost',
      port: 25
    }),
    qs = require('querystring'),
    util = require('util'),

    profiles = require('../lib/profiles'),
    browserid = require('connect-browserid'),
   payments = require('../lib/payments');

// Routes

/*       username: 'me@gmail.com',
      password: '**password**' */
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', {});
};

exports.register = function (req, res) {
  var resp = browserid.enforceLogIn(req, res);
  if (resp) return resp;
  if (req.method === 'POST') {
    profiles.setProfile({
      email: req.user,
      fullName: req.body.fullName
    }, req, res, function (err) {
      if (err) res.render('register', {fullName: req.params.fullName});
      // TODO support a next query string param here...
      res.redirect('/recent');
    });
  } else {
    return res.render('register', { fullName: ''});
  }
};

exports.recent = function(req, res) {
  resp = browserid.enforceLogIn(req, res);
  if (resp) return resp;
  profiles.getProfile(req.user, req, res, function (exists, profile) {
    if (exists) {
      var recentPayments = payments.recent(req.user);
      res.render('recent', {payments: recentPayments, profile: profile});
    } else {
      res.redirect('/register');
    }
  });
}

exports.direct = function (template) {
  return function(req, res){
    res.render(template);
  };
};

exports.ask_for_cash = function(req, res){
  resp = browserid.enforceLogIn(req, res);
  if (resp) return resp;
  profiles.getProfile(req.user, req, res, function (exists, profile) {
    util.debug('getProfile callback %s %s', exists, profile);
    util.debug(exists);
    util.debug(util.inspect(profile));    
    if (exists) {
      if (req.method === 'POST') {
        var email = req.body.email,
            senders_email = req.user,
            amount = req.body.amount;
            
        payments.paymentRequested(senders_email, email, 
                                  amount, function (err, payReq) {
          if (err) throw err;
          var message_body = util.format('%s has asked you for %s.\n' +
                'You can pay them by visiting:\n' + 
                'http://localhost:3000/pay/%s/%s\n', profile['fullName'], amount,
                                         qs.escape(email), qs.escape(payReq.id));
          mail.message({
            from: senders_email,
            to: [email],
            cc: [senders_email],
            subject: util.format('%s has asked you for some cream', profile['fullName'])
          })
          .body(message_body)
          .send(function(err) {
           if (err) throw err;
            console.log(message_body);
          });
          res.redirect('/ask-for-cash');
        }); // payments.paymentRequested

      // Not POST
      } else {
        res.render('ask_for_cash', {email: 'hobo', _:function (msgid) { return msgid.toUpperCase(); }});
      }
    } else {
      res.redirect('/register');
    }
  });
};

exports.pay = function(req, res){
  console.info(req.params.email);
  var email = req.params.email,
      pay_req_id = req.params.pay_req_id;
  console.log('email=%s id=%s', email, pay_req_id);
  payments.paymentRequest(pay_req_id, function (err, pay_req) {
    console.log(pay_req);
    if (req.method === 'POST') {
      console.info(req.body.email);
    }
    //requesteeEmail: requesteeEmail,
    res.render('pay', { requestorEmail: pay_req['requestorEmail'], amount: pay_req.amount });
  });
};

// Middleware
exports.localVars = function (req, res, next) {
  var vars = {
    title: 'C.R.E.A.M., Get the Money',
    authenticated: false
  };
  if (req.user) {
    vars.authenticated = true;
    vars.gravatar = 'http://www.gravatar.com/avatar/' +
          crypto.createHash('md5').update(req.user.toLowerCase()).digest('hex');
  }
  for (var k in vars) {
    res.local(k, vars[k]);
  }
  next();
};