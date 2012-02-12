$(document).ready(function () {
    var doit;
    var user_email;
    console.info('Setting up WinChan onOpen');
    WinChan.onOpen(function(origin, args, cb) {
      console.info('onOpen just got real', args);
      // origin is the scheme+host+port that cause window invocation,
      // it can be trusted

      // args are the untrusted arguments provided by the calling site

      // and cb you can call within the function, or synchronously later.
      // calling it indicated the window is done and can be closed.
      console.info('origin=' + origin);
      console.info(args);
      // TODO /pay should load a shell of a page... 
      // If user is already logged into wallet, then HTML will show their
      // Payment methods
      // If not, then a requiredEmail will be used which is the same as their
      // args.payee
      // After login, payment methods would be displayed
      $('#amount').text('$' + args.amount / 100);
      $('#reciever').text(args.reciever);
      // accepted-types, payee, 
      console.log(args);
      $('#description').text(args.description);
      window.a = args;
      console.log(args);
      user_email = args.payee;
      doit = function () {
        var pt = $('[name=payment]:checked').val();
        $.ajax('/pay-transaction', {
          type: 'POST',
          dataType: 'json',
          data: {
            amount: args.amount,
            description: args.description,
            payment_type: pt
            /* TODO merchant email */            
          },
          error: function (data, status, jqXhr) {
            // TODO
            alert(data.error);
          },
          success: function (data, status, jqXhr) {
            cb(data);
          }
        });
      };
    });

    $('#pay').click(function () {
      doit();
    });

    $('[data-role=button]').click( function (event) {
      event.preventDefault();
      $('#content').load($(this).attr('href'), function () {
        $('.wizard2 > div').hide();
        $('#chooser ul li a').click(function (event) {
          event.preventDefault();
          var type = $(this).attr('href');
          window.payMethod = type;
          $('#chooser').hide();
          $('#chooser-' + type).show();
          $('#chooser-nav').show();
        });

        $('#chooser-nav .cancel').click(function (event) {
          event.preventDefault();
          window.payMethod = null;
          $('.wizard2 > div').hide();
          $('#chooser').show();
        });

        $('#chooser-nav .continue').click(function (event) {
          event.preventDefault();

          if (window.payMethod == 'VISA') {
            doStripe();
          }
        });
      });
    });

  $('.browserid').click(function (event) {
    event.preventDefault();
    var opts = {
      requiredEmail: user_email
    };
    navigator.id.get(function (assertion) {
      if (assertion) {
        $.post("/auth", {assertion: assertion}, function(res) {
          if (res.status && res.status == "okay") {
            $('.email-address').text(window.email);
            $('#existing-payment').load('/existing-payment');
          }
        });
           
      }
    }, opts);
  });

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

};

function stripeResponseHandler(status, response) {
    if (console) console.info(response);
    if (response.error) {
        $(".payment-errors").html(response.error.message);
    } else {
        var form$ = $("#stripe-payment");
        // token contains id, last4, and card type
        var token = response['id'];
        // insert the token into the form so it gets submitted to the server
        form$.append("<input type='hidden' name='stripeToken' value='" + token + "'/>");
        // and submit
        $('#visa-cc').val($('#visa-cc').val().slice(-4));
        $('#visa-cvv2').attr('name', null);
        form$.get(0).submit();
    }
};