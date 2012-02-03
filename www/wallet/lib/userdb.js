exports.create_user = function (conn, email, cb) {
  var ins = "INSERT INTO users (email) VALUES (?)";
  conn.query(ins, [email], function (err, db_res) {
    if (cb) cb(err, db_res);
  });
};

exports.create_stripe_customer = function (conn, email, customer_id, cb) {
  var ins_customer = "INSERT INTO stripe_customers (user_id, customer_id) "
                     + "VALUES ((SELECT id FROM users WHERE email = ?), ?)";
  conn.query(ins_customer, [email, customer_id], function (err, rows) {
    if (cb) {
        cb(err, rows);
    } else if (err) {
      console.log('create_stripe_customer error', err);
    }
  });
};

exports.get_user = function (conn, email, cb) {
  var sel = 
    "SELECT * FROM users "
    + "LEFT JOIN stripe_customers ON users.id = stripe_customers.user_id "
    + "WHERE email = ?";
  conn.query(sel, [email], function (err, db_res) {
    if (cb) {
      if (err) return cb(err, db_res);
      if (! db_res.length || db_res.length != 1) 
          cb("Expected exactly one result", db_res);
      else
          cb(err, db_res[0]);
    }
  });
};
