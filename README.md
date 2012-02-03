C.R.E.A.M-ery.co is a set of experiments around giving users 
fiscal agency across the web. Huh?

It's a **very early** stages playground for exploring
The Future Of Money technologies such as mobile wallets,
browser APIs, and TPS reports.

Why is it so hard to give and receive money? What if there were
a simple, open web standard that protects users identities and
makes life easier.

  * GetTheMoney - Simplest way to pay and GET PAYED!
  * Wallet - LIFT API for cross-domain payment
  * Ball of Wax Audio Quarterly - Tablet optimized 
    "digital linear notes" with in-App purchase

Code organization

    www - collection of experiments
    \---nginx.conf - Hosts c.r.e.a.m-ery.co 
    \---get_the_money/ - Node.js app
    \---wallet/ - Node.js app hosting include.js
    \---ball-of-wax/ - git submodule

The navigator.payz API has the following inputs:
amount, accepted_types, merchant_email, and options

All options are optional:

  * **payee** - optional - email address of customer
  * **failure** - callback function
  * **description** - payment description
  * **complete** - callback function. Error will be null if everything was successful or a string if there was a problem. The complete callback will never be invoked if user cancels. See {Reciept} below for reiept format.

Example complete callback:

    function (error, reciept) {

    }

  * cancel_callback - invoked if user cancels when entering payment info

Reciept object: The second input to the callback is a reciept. Example:

    {
      transaction_id: '32lkj432kj42l4j',
      created: 'Tue, 10 Jan 2012 06:30:03 GMT',
      amount: 1000,
      currency: 'USD',
      payment_type: 'VISA',
      payment_id: '3666',
      assertion: 'zsfdslkjfds3j324... really long string ... sdkjf',
    }

It has the following properties:

  * **assertion** - A reciept *should not* be trusted without server side verificaiton that the reciept is valid. Values of the reciept object are available immediately for use client-side in presenting a reciept to the user. Assertion verification will provide additional information, which is useful for your merchant backend system.

  * **amount** is in cents, so 1000 is 10.00.

  * **payment_id** is a user distinguishable portion of their payment routing information, such as the last 4 digits of a credit card.

  * **transaction_id** - Globably unique id for this transaction

Code example:

    var accepted_types = ['VISA', 'MASTERCARD', 'IOU'],
        options = {
          payee: 'alice@example.com',
          description: 'Cheddar',
          complete: function (error, reciept) {
            hideProcessing();
            showReciept(reciept);
            $.ajax('/verify', {reciept: reciept}, confirmReciept);        
          }
    };

    navigator.payz(1000, accepted_types, billing@example.com, options);

We can see that example.com's webapge would invoke this script, to collect
$10 from Alice.

Dependencies:

  * Nginx
  * Redis
  * MySQL
  * node 0.6.6
  * ozten/connect-browserid