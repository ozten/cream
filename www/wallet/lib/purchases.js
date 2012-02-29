exports.create_stripe_customer = function (conn, email, customer_id, cb) {
  var ins_customer = "INSERT INTO stripe_customers (user_id, customer_id) " +
                     "VALUES ((SELECT id FROM users WHERE email = ?), ?)";
  conn.query(ins_customer, [email, customer_id], function (err, rows) {
    if (cb) {
        cb(err, rows);
    } else if (err) {
      console.log('create_stripe_customer error', err);
    }
  });
};

exports.create_purchase = function (conn, email, volume_number, cb) {
  var ins_vol = "INSERT INTO purchased_volumes (user_id, volume_id) " +
                "VALUES ((SELECT id FROM users WHERE email = ?), ?)";
  conn.query(ins_vol, [email, volume_number], function (err, rows) {
    if (cb) {
        cb(err, rows);
    } else if (err) {
      console.log('create_purchase', err);
    }
  });             
};

exports.my_volumes = function (conn, email, cb) {
  conn.query("SELECT volume_id FROM purchased_volumes " +
             "JOIN users ON users.id = purchased_volumes.user_id " +
             "WHERE email = ?", 
             [email], function (err, rows) {
    if (cb) {
      if (err) return cb(err, rows);
      console.log(rows);
        cb(err, rows);
    }
  });
};

exports.can_play = function (conn, email, volume, cb) {
  conn.query("SELECT volume_id FROM purchased_volumes " +
             "JOIN users ON users.id = purchased_volumes.user_id " +
             "WHERE email = ? AND volume_id = ?", 
             [email, volume], function (err, rows) {
    if (cb) {
      if (err) return cb(err, rows);
      console.log(rows);
      if (! rows.length || rows.length != 1)
        cb(err, false);
      else
        cb(err, true);
    }
  });
};