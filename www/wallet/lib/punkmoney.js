var util = require('util');

var db = require('./db'),
    OAuth = require('oauth').OAuth;

var withAccess = function (email, cb) {
  db.withDb(function(err, conn) {
    var sel = "SELECT twitter_access_token, twitter_access_token_secret FROM " +
    " punkmoney_oauth WHERE email = ?";
    conn.query(sel, [email], function (err, rows) {
      if (err) {
          cb(err, null);
      } else if (0 === rows.length) {
        cb("No Twitter User for " + email, null);
      } else {
        var oauth_access_token = rows[0]['twitter_access_token'],
            oauth_access_token_secret = rows[0]['twitter_access_token_secret'],
            oauth = _oauth();

        cb(err, oauth_access_token, oauth_access_token_secret);
        
        } // if else if else
     }); // conn.query(sel)
    }); //db.withDb
};

exports.get_account = function (email, cb) {
  withAccess(email, function (err, oauth_access_token, oauth_access_token_secret) {
    if (err) {
      cb(err, null, null);
    } else {
      var oauth = _oauth();
      oauth.getProtectedResource("https://api.twitter.com/account/verify_credentials.json", "GET", 
        oauth_access_token, 
          oauth_access_token_secret, function (err, data, response) {              
            cb(err, JSON.parse(data));                 
      });  //verify_credentials
    }
  });
}; // get_account

exports.promise = function (email, tweet, cb) {
  var params = {
      status: tweet
  };
  withAccess(email, function (err, oauth_access_token, oauth_access_token_secret) {
    if (err) {
      cb(err, null, null);
    } else {
      var oauth = _oauth();
      oauth.post("https://api.twitter.com/statuses/update.json", 
        oauth_access_token, 
        oauth_access_token_secret, 
        params,
        function (err, data, response) {              
            console.log(data);
            // Send back a JSON object
            cb(err, JSON.parse(data));
      });  //verify_credentials
    }
  });
}; // get_account

/**
 * Requests an Access Token from Twitter
 * Stores next url to redirect too in session
 */
exports.new_token = function (req, resp, next) {
  var oa = _oauth();
  oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
    if(error)
      util.puts('error :' + error)
    else {
      util.puts('oauth_token :' + oauth_token);

    util.puts('oauth_token_secret :' + oauth_token_secret);
    util.puts('requestoken results :' + util.inspect(results));
    util.puts("Requesting access token");

    req.session.oauth = {};
    req.session.oauth.token = oauth_token;
    req.session.oauth.token_secret = oauth_token_secret;
    req.session.oauth.next = next;

      resp.redirect('https://api.twitter.com/oauth/authenticate?oauth_token=' + oauth_token);
    }
  });
};

exports.save_token = function (email, session, resp) {
  var oa = _oauth();

  var oauth_token = session.oauth.token,
      oauth_token_secret = session.oauth.token_secret;


 oa.getOAuthAccessToken(oauth_token, oauth_token_secret, function(err, oauth_token, oauth_token_secret, results2) {
  if (err) {
    console.error(err);
    resp.send("ERROR", 500);
  } else {
        db.withDb(function (err, conn, db) {
          var upd = 'UPDATE punkmoney_oauth SET twitter_access_token = ?, ' + 
                    'twitter_access_token_secret = ? WHERE email = ?';
          
          conn.query(upd, [oauth_token, oauth_token_secret, email], function (err, info) {
            if (err) {
              console.error(err);             
              resp.send("ERROR", 500);
            } else {
              util.puts(info.affectedRows);
              if (0 === info.affectedRows) {
                var ins = "INSERT INTO punkmoney_oauth (twitter_access_token, twitter_access_token_secret, email) " +
                " VALUES (?, ?, ?)";
                conn.query(ins, [oauth_token, oauth_token_secret, email], function (err, info) {
                  console.error(err);
                  console.log('insert db results=', info);
                });
              }
            }
          });//conn.query

        });//db.withDb
        var data= "";
        resp.redirect(session.oauth.next);
    } //else
  });//oa.getOAuthAccessToken
};//save_token

exports.pay_transaction = function (email, details, cb) {
  var reciept = null;

  console.log('punkmoney==================');
  console.log(details);
  var merchant_twitter_username = 'ozten',
      end = "#punkmoney"
  
  if (details.transferable === "false") {
    end = "NT #punkmoney";
  }
  var tweet = util.format("@%s I promise %s %s", 
                merchant_twitter_username, 
                details.promise, 
                end);
  console.log(tweet);
  exports.promise(email, tweet, function (err, reciept) {
      cb(err, reciept);
  });
};

function _oauth() {
  return new OAuth(
  "https://api.twitter.com/oauth/request_token",
  "https://api.twitter.com/oauth/access_token",
  conf.twitter_consumer_key,
  conf.twitter_consumer_serkrit,
  "1.0", null,
  "HMAC-SHA1"
  );
};