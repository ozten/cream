var browserid = require('connect-browserid'),
    conf = require('../etc/config'),
    OAuthM = require('oauth').OAuth,
    twitter = require('ntwitter'),
    util= require('util');
var oauth = new OAuthM(
	"https://api.twitter.com/oauth/request_token",
	"https://api.twitter.com/oauth/access_token",
	conf.twitter_consumer_key,
	conf.twitter_consumer_serkrit,
	"1.0",
	conf.twitter_oath_callback,
	"HMAC-SHA1"
);

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
  console.log('merchant_add_payment');

  var ctx = {
    title: "Add Payment Method",
    method: req.params.method,
    enabled: (!! req.session.oauth),
    pay_info: {},
    layout: 'site_layout'
  };
  console.log('Is ctx enabled?', ctx.enabled);
  if (ctx.enabled) {
  	console.log(req.session);
  	req.session.oauth.auth_access_token = '1127361-N4mXdX55Ey8n45v2AJ4aL0BxUV816lQJmRhmZvUJY';
    req.session.oauth.oauth_access_token_secret = 'b8j9MCILAmbbEcgcFhrZlJ8EdFRRGHrOnF1u7GawY';

    var twit = new twitter({
      consumer_key: conf.twitter_consumer_key,
      consumer_secret: conf.twitter_consumer_serkrit,
      access_token_key: req.session.oauth.oauth_access_token,
      access_token_secret: req.session.oauth.oauth_access_token_secret

 	

    });
    util.puts(twit);
    twit.getMentions({}, function (err, user, a, b) {
      console.error(err);
      console.log(user);
      console.log('a', a, b);
    });
    /*
    twit.search('nodejs OR #node', function(err, data) {
      resp.send(data);
    });
    */

  }
  resp.render("merchant/add_payment", ctx);
};

exports.merchant_twitter_login = function (req, resp) {

  resp.send('hey');
};

exports.merchant_start_oauth = function (req, resp) {




var OAuth= require('oauth').OAuth;

var oa= new OAuth(	"https://api.twitter.com/oauth/request_token",
	"https://api.twitter.com/oauth/access_token",
	conf.twitter_consumer_key,
	conf.twitter_consumer_serkrit,
"1.0",
                  	null,
                  "HMAC-SHA1")

oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
  if(error) util.puts('error :' + error)
  else {
    util.puts('oauth_token :' + oauth_token);

    util.puts('oauth_token_secret :' + oauth_token_secret);
    util.puts('requestoken results :' + util.inspect(results));
    util.puts("Requesting access token");
    req.session.oauth = {};
	req.session.oauth.token = oauth_token;
	req.session.oauth.token_secret = oauth_token_secret;

    resp.redirect('https://api.twitter.com/oauth/authenticate?oauth_token=' + oauth_token);
  }
})

/*






  oauth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
  		if (error) {
			console.log(error);
			resp.send("yeah no. didn't work.")
		}
		else {
			console.log(oauth_token, results);
			req.session.oauth = {};
			req.session.oauth.token = oauth_token;
			console.log('oauth.token: ' + req.session.oauth.token);
			req.session.oauth.token_secret = oauth_token_secret;
			console.log('oauth.token_secret: ' + req.session.oauth.token_secret);

          oauth.getOAuthAccessToken(oauth_token, oauth_token_secret,
                         function(error, oauth_access_token,
                                  oauth_access_token_secret, results2) {
                         	console.error(error);
console.log('oauth_access_token :' + oauth_access_token);
    console.log('oauth_token_secret :' + oauth_access_token_secret);
    console.log('accesstoken results :', results2);
    console.log("Requesting access token");
           });
*/
			/*
			console.log(oauth_token, results);
			req.session.oauth = {};
			req.session.oauth.token = oauth_token;
			console.log('oauth.token: ' + req.session.oauth.token);
			req.session.oauth.token_secret = oauth_token_secret;
			console.log('oauth.token_secret: ' + req.session.oauth.token_secret);
			//resp.redirect('https://twitter.com/oauth/authenticate?oauth_token='+oauth_token)
			resp.redirect('https://twitter.com/oauth/authorize?oauth_token='+oauth_token)
			*/
			/*
	}
	});
*/
};


exports.merchant_oauth = function (req, resp) {

	console.log(req.method, "OAUTH callback!");
	console.log('req.query.oauth_token', req.query.oauth_token);
	console.log(req.query.oauth_verifier)	

var util= require('util');

var OAuth= require('oauth').OAuth;

var oa = new OAuth(	"https://api.twitter.com/oauth/request_token",
	"https://api.twitter.com/oauth/access_token",
	conf.twitter_consumer_key,
	conf.twitter_consumer_serkrit,
"1.0",
                  	null,
                  "HMAC-SHA1");

var oauth_token = req.session.oauth.token,
    oauth_token_secret = req.session.oauth.token_secret;

console.log('PUlled out of session', oauth_token, oauth_token_secret);

 oa.getOAuthAccessToken(oauth_token, oauth_token_secret, function(error, oauth_access_token, oauth_access_token_secret, results2) {
 	
 	req.session.oauth.oauth_access_token = oauth_access_token;
 	req.session.oauth.oauth_access_token_secret = oauth_access_token_secret;
 	
 	console.error('get auth access error=', error);

      util.puts('oauth_access_token :' + oauth_access_token);
      util.puts('oauth_token_secret :' + oauth_access_token_secret);
      util.puts('accesstoken results :' + util.inspect(results2));
      util.puts("Requesting access token");
      console.log(req.session);
      var data= "";

      oa.getProtectedResource("https://api.twitter.com/statuses/mentions.json", "GET", oauth_access_token, 
      	oauth_access_token_secret, function (error, data, response) {
      		console.error('statuses/home_timeline  error', error);
          util.puts(data);


          oa.getProtectedResource("https://api.twitter.com/account/verify_credentials.json", "GET", oauth_access_token, 
      	    oauth_access_token_secret, function (error, data, response) {
      		   console.error('account/verify_credentials  error', error);
                util.puts(data);

          });


          
      });
      resp.send('ok');
    });
};
 