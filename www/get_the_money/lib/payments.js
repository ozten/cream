var util = require('util'),

    redis = require('redis'),
    client = redis.createClient(),
    Step = require('step'),
    uuid = require('node-uuid');

exports.recent = function (email, cb) {
/*
  var res = [];
  Step(
    function () {
    client.llen('account-' + email, this);
    }, 
    function (err, len) {
      redis.print(err, len);
      for (var i=0; i<len; i++) {
        (function (index) {
          client.lindex('account-' + email, index, function (err, key) {
            if (index == len - 1) {

            }
          });
        })(i);
      }
    },
    function () {
*/
      cb([{email: 'TODO', fullName: 'TODO', activity: 'PAID', amount: 1000, created: '12/12/2011 3:54 -700'}]);
/*
    });
  //);
  //client.hgetall(key, function (err, obj) {
*/

};

/*

Payment - 
Jane paid Bob $50 for 'dinner' paid at 12/12 5:12pm
 \------ breaks down in Payments and Income

Requests
Jane asked Bob for $50 because 'you owe me for dinner' requested at 12/12 1:03pm
 \------ breaks down in Asked and Was Asked

 */

exports.paymentRequested = function (requestorEmail, requesteeEmail, amount, cb) {
  var paymentRequest = {
        id: uuid.v1(),
        requestorEmail: requestorEmail,
        requesteeEmail: requesteeEmail,
        amount: String(amount)
      },
      key = util.format('pay_req-%s', paymentRequest.id);
  console.log('xpaymentRequested', paymentRequest);
  // TODO maintain whatever indexes based on email, etc
  client.hmset(key, paymentRequest, function (err, resp) {
    redis.print(err, resp);
    console.log("We're back after saving payment requested. Err=%s", err);
    client.rpush('account-' + requestorEmail, key, redis.print);
    client.rpush('account-' + requesteeEmail, key, redis.print);
    cb(err, paymentRequest);
  });
};

exports.paymentRequest = function (id, cb) {
  var key = util.format('pay_req-%s', id);
  client.hgetall(key, function (err, pay_req) {
    redis.print(err, pay_req);
    console.log('pay_req', pay_req);
    cb(err, pay_req);
  });
};

exports.recordReciept = function (reciept, cb) {
  var key = util.format('reciept-%s', reciept.transaction_id);
  console.log('Creating ', key);
  var next = function (err, resp) {
   redis.print(err, resp);
    console.log("We're back after saving payment requested. Err=%s", err);
    client.rpush('account-' + reciept.merchant_email, key, redis.print);
    client.rpush('account-' + reciept.customer_email, key, redis.print);
    cb(err, reciept);
  };
  client.hmset(key, reciept, next);
};

exports.reciept = function (id, cb) {
  var key = util.format('reciept-%s', id);
  console.log('retrieving', key);
  client.hgetall(key, function (err, reciept) {
    redis.print(err, reciept);
    console.log('reciept', reciept);
    cb(err, reciept);
  });
};
