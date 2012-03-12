$(document).ready(function () {
    var pay_meth_chooser;
    var user_email;
    var state = { args: {} };
    WinChan.onOpen(function(origin, args, cb) {
      console.info('onOpen just got real', args);
      // origin is the scheme+host+port that cause window invocation,
      // it can be trusted

      // args are the untrusted arguments provided by the calling site
      for (var key in args) {
        if ('accepted_tyes' === key) {
          state.args[key] = args[key].slice();
        } else {
          state.args[key] = args[key];
        }
      }
      // and cb you can call within the function, or synchronously later.
      // calling it indicated the window is done and can be closed.

      populatePay(args);

      user_email = args.payee; // TODO state.user_email?
      pay_meth_chooser = function () {
        var pt = $('[name=payment]:checked').val();
        console.log('posting with pt=', pt);
        console.log('args=', args);

        if (pt.toUpperCase().indexOf('VISA') !== -1) {
          var data = {
            amount: args.amount,
            description: args.description,
            payment_type: pt,
            merchant_email: args.payee
          };
          doPayTransaction(pt, data, cb);  
        } else if (pt.indexOf('PunkMoney') !== -1) {
          showPunkMoneyPay(pt, args, cb);
        }
      };
    }); // WinChan.open

    $('#pay').live('click', function () {
      pay_meth_chooser();
    });

  var doPayTransaction = function (paymentType, data, cb) {
    $.ajax('/pay-transaction', {
          type: 'POST',
          dataType: 'json',
          data: data,
          error: function (data, status, jqXhr) {
            // TODO
            alert(data.error);
          },
          success: function (data, status, jqXhr) {
            cb(data);
          }
        });
  }; // doPayTransaction


  var showPunkMoneyPay = function (paymentType, args, cb) {
    $('#existing-payment-details').load('/existing-payment-details/punkmoney', function () {
      $('#existing-payment-details').show();
      $('#existing-payment').hide();
      $('#pay').parent().hide();
      $('#pay-punkmoney').click(function (e) {
        e.preventDefault();
        
        var data = {
            amount: args.amount,
            description: args.description,
            payment_type: paymentType,
            merchant_email: args.payee
          };
        data.promise = $('#punkmoney-tweet').val();
        data.transferable = $('[name=transferable]:checked').val();
        console.log('doctoring up args', data);
        doPayTransaction(paymentType, data, cb);
        return false;
      });
      $('#existing-payment-details .cancel').click(function (e) {
        e.preventDefault();
        cancelPunkMoneyPay();
        return false;
      });
    });
    
  };
  var cancelPunkMoneyPay = function () {
    $('#existing-payment-details').hide();
    $('#existing-payment').show();
    $('#pay').parent().show();
  };

/************************ Add Payment Method ****************************/

    $('[data-role=button]').live('click',  function (event) {
      event.preventDefault();
      $('#content').load($(this).attr('href'), function () {
        $('.wizard2 > div').hide();
        $('#chooser ul li a').live('click', function (event) {
          event.preventDefault();
          var type = $(this).attr('href');
          window.payMethod = type;
          $('#chooser').hide();
          $('#chooser-' + type).show();
          $('#chooser-nav').show();
        });
        console.log('outisde', state);
        $('#chooser .cancel').live('click', function (event) {
          event.preventDefault();
          $('#add-payment').remove();
        console.log('inside', state);     
          $('#content').load('/pay', function () {
             console.log('callback', state);     
             populatePay(state.args);
          });
        });

        $('#chooser-nav .cancel').live('click', function (event) {
          event.preventDefault();
          window.payMethod = null;
          $('.wizard2 > div').hide();
          $('#chooser').show();
        });

        $('#chooser-nav .continue').live('click', function (event) {
          event.preventDefault();

          if (window.payMethod == 'VISA') {
            doStripe();
          } else {
            alert('Unknown payment type: ' + window.payMethod);
          }
        });
      });
    });
    

  /**
   * Vendors accept X, Y Payments Methods
   * Customers have Y, Z 
   * Update Existing Payment Area to help user choose
   */
  var sortPayments = function () {

  };

  $('.browserid').live('click', function (event) {
    event.preventDefault();
    var opts = {};
    if (user_email) opts.requiredEmail = user_email;
    $('button.browserid').attr('disabled', true);
    navigator.id.get(function (assertion) {
      if (assertion) {
        $.post("/auth", {assertion: assertion}, function(res) {
          if (res.status && res.status == "okay") {
            window.email = res.email;
            $('.email-address').text(window.email);
            $('#existing-payment').load('/existing-payment', 
                                        function () {
              //TODO We need to know list of vendor supported
              sortPayments();
              $('#login-form').hide('slow');
              $('#wallet, #auth-feedback').show('slow');

            });
          }
        });
      }
      $('button.browserid').attr('disabled', null);
    }, opts);
  });

/***************** Add payment methods **********************/

  var populatePay = function (args) {
      console.log('populatePay args=', args);
      // If user is already logged into wallet, then HTML will show their
      // Payment methods
      // If not, then a requiredEmail will be used which is the same as their
      // args.payee
      // After login, payment methods would be displayed
      $('#amount').text('$' + args.amount / 100);
      $('#reciever').text(args.reciever);
      // accepted-types, payee, 
      for (var i=0; i < args.accepted_types.length; i++){
        var t = args.accepted_types[i];
        var li = '<li class="pay-type-' + t.toLowerCase() + '" title="' + t + '"></li>';
        $('#accepted-payment').append(li);
      }
      $('#description').text(args.description);
      window.a = args;
      console.log(args);
  };
});

function doStripe() {
  // disable the submit button to prevent repeated clicks
    $('#chooser-nav .cancel, #chooser-nav .continue').attr("disabled", "disabled");

    var amount = 1000; //amount you want to charge in cents
    Stripe.createToken({
        number: $('#visa-cc').val(),
        cvc: $('#visa-cvv2').val(),
        exp_month: $('#visa-expiration-month').val(),
        exp_year: $('#visa-expiration-year').val()
    }, amount, stripeResponseHandler);
}

function stripeResponseHandler(status, response) {
    if (console) console.info(response);
    if (response.error) {
        $(".payment-errors").html(response.error.message);
    } else {
        var form$ = $("#stripe-payment");
        // token contains id, last4, and card type
        var token = response.id;
        // insert the token into the form so it gets submitted to the server
        form$.append("<input type='hidden' name='stripeToken' value='" + token + "'/>");
        // and submit
        $('#visa-cc').val($('#visa-cc').val().slice(-4));
        $('#visa-cvv2').attr('name', null);
        form$.get(0).submit();
    }
}