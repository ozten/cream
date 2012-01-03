var util = require('util'),

    redis = require('redis'),
    client = redis.createClient(),
    uuid = require('node-uuid');

exports.recent = function (email) {

  //client.hgetall(key, function (err, obj) {

  return [{email: 'TODO', fullName: 'TODO', activity: 'PAID', amount: 1000, created: '12/12/2011 3:54 -700'}];
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
        amount: amount
      },
      key = util.format('pay_req-%s', paymentRequest.id);
  // TODO maintain whatever indexes based on email, etc
  client.hmset(key, paymentRequest, function (err, resp) {
    redis.print(err, resp);
    console.log("We're back after saving payment requested. Err=%s", err);
    cb(err, paymentRequest);
  });
};

exports.paymentRequest = function (id, cb) {
  var key = util.format('pay_req-%s', id);
  client.hgetall(key, function (err, pay_req) {
    redis.print(err, pay_req);
    cb(err, pay_req);
  });
};