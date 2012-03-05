

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