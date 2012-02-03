var fs = require('fs'),
    path = require('path'),
    util = require('util'),

    browserid = require('connect-browserid'),
    conf = require('../config'),
    stripe = require('stripe')(conf.stripe_sekrit);

var userdb = require('./userdb');

exports.home = function (req, resp) {
  console.log('home route');
  // TODO Read all volume.json files on start to populate the
  // home page volume cover thumbnails
  if (req.isXMLHttpRequest) {
    send = resp.partial.bind(resp);
  } else {
    send = resp.render.bind(resp);
  }
  send('home', {
    title: 'Ball of Wax Audio Quarterly',
    play_btn_label: 'Play Volume 25'
  });
};

exports.volume = function (req, resp) {
  console.log('volume route');
  var vol_num = req.params[0];
  var volume_dir = util.format('volume-%d', vol_num);
  var json_path = path.join(__dirname, '..',
                            volume_dir,
                            util.format('%s.json', volume_dir));
  fs.readFile(json_path, function (err, data) {
    var vol_data = JSON.parse(data);
    if (req.isXMLHttpRequest) {
      send = resp.partial.bind(resp);
    } else {
      send = resp.render.bind(resp);
    }
    send('volume', {
      title: util.format(vol_data.title),
      vol_num: vol_num,
      play_btn_label: 'Play Album',
      vol_data: vol_data
    });

  });
};

exports.tracks = function (req, resp) {
  console.log('tracks route');
  var vol_num = req.params[0];
  var volume_dir = util.format('volume-%d', vol_num);
  var json_path = path.join(__dirname, '..',
                            volume_dir,
                            util.format('%s.json', volume_dir));
  fs.readFile(json_path, function (err, data) {
    console.log(json_path, data);
    var vol_data = JSON.parse(data);
if (req.isXMLHttpRequest) {
      send = resp.partial.bind(resp);
    } else {
      send = resp.render.bind(resp);
    }
    send('tracks', {
      title: util.format(vol_data.title),
      vol_num: vol_num,
      play_btn_label: 'Play Album',
      vol_data: vol_data
    });
  });
};

exports.overview = function (req, resp) {
  console.log('overview route');
  var vol_num = req.params[0];
  var volume_dir = util.format('volume-%d', vol_num);
  var json_path = path.join(__dirname, '..',
                            volume_dir,
                            util.format('%s.json', volume_dir));
  fs.readFile(json_path, function (err, data) {
    var vol_data = JSON.parse(data);
    // Optional in JSON file
    if (! vol_data.edited) vol_data.edited = "Edited/compiled by Levi Fuller";
    if (! vol_data.edited) vol_data.edited = "Mastered by Levi Fuller";

    console.log("req.isXMLHttpRequest", req.isXMLHttpRequest);
    var send;
    if (req.isXMLHttpRequest) {
      send = resp.partial.bind(resp);
    } else {
      send = resp.render.bind(resp);
    }

    send('overview', {
      title: vol_data.title,
      vol_num: vol_num,
      play_btn_label: 'Play Album',
      vol_data: vol_data
    });
  });
};

exports.can_play_volume = function (req, resp) {
  console.log('can_play route', req.params.vol);
  var data = {can_play: false, email: null},
      vol = req.params.vol;
  if (req.user) {
    data.email = req.user;
    db.withDb(function (err, conn, db) {
      if (err) {
        console.error(err);
        return resp.send(err, 500);
      }
      purchasedb.my_volumes(conn, req.user, function (err, volumes) {
        if (err) {
            console.error(err);
            return resp.send(err, 500);
        } else {
          // stream vol track
          console.log('Volumes', volumes);
          var canPlay = false;
          data.volumes = {};
          volumes.forEach(function (row, i) {
            if (row.volume_id == vol) data.can_play = true;
            data.volumes[util.format('%d', row.volume_id)] = true;
          });
            console.log(data);
          return resp.send(JSON.stringify(data), {
            'Content-Type': 'application/json'
          });
        }
      }); // purchasedb.can_play
    }); // withDb
  } else {

    resp.send(JSON.stringify(data), {
      'Content-Type': 'application/json'
    });
  }
};

exports.pay = function (req, resp) {
  if (browserid.enforceLogIn(req, resp)) {
    return;
  }

  var data = {
      title: 'Buy Ball of Wax',
      payment: null,
      vol_num: req.params.volnum
  };
  db.withDb(function (err, conn, db) {
    if (err) return resp.send("Unknown Database Error", 500);
    userdb.get_user(conn, req.user, function (err, user) {
      if (err) return resp.send("Unknown Database Error loading user", 500);
      if (user.customer_id) {
        stripe.customers.retrieve(user.customer_id, function (err, customer) {
          data.payment = customer.active_card;
          resp.render('pay', data);
        });
      } else {
          console.log("user has a customer_id", user.customer_id);
          resp.render('pay', data);
      }
    });
  });
};