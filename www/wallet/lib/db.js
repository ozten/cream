var conf = require('../etc/config'),
    mysql = require('mysql');

exports.withDb = function (cb) {
  var conn = mysql.createClient({
      user: conf.db_user,
      password: conf.db_password
    });

    conn.useDatabase(conf.db_name, function (err, db_info) {
      cb(err, conn, db_info);
    });
};