var redis = require('redis'),
    util = require('util');
var client = redis.createClient();
client.on('error', function (err) {
  console.error("Redis didn't like %s", err);
});

/**
 * Function checks if user existing using email and
 * calls a callback function with true, accountDetails
 * or false, {} if the user doesn't exist.
 */
exports.getProfile = function (email, req, res, cb) {
    profile_key = util.format('profile-%s', email.toLowerCase());
    client.hmget(profile_key, ['email', 'Full Name'], function (err, resp) {
      if (err || 
          (resp[0] === null && resp[1] === null)) {
          //res.redirect('/register');
          return cb(false, {});
      } else {
          // Usual case, existing user...
          return cb(true, {
                 email: resp[0],
                 fullName: resp[1]
             });
      }
    });
};

/**
 * Function saves user's profile. Expects an object with the 
 * following properties
 * * email
 * * fullName
 * 
 * Calls a callback function if successful.
 */
exports.setProfile = function (profile, req, res, cb) {
    console.info("Saving %s", profile.email);
    profile_key = util.format('profile-%s', profile.email.toLowerCase());
    client.hset(profile_key, 'email', profile.email, function (err, resp) {
      if (err) {
        console.error('Trouble saving email to %s', profile_key);
        cb(err);
      } else {
          console.info("Saving full name= %s", profile['fullName']);
        client.hset(profile_key, 'Full Name', profile['fullName'], function (err, resp) {
          if (err) {
            console.error('Trouble saving full name to %s', profile_key);
            cb(err);
          } else {
            console.log('Saved profile data to %s', profile_key);
            cb(null);
          }
        });
      }
    });    
};

