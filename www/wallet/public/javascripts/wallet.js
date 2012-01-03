    console.info('wallet.js');
$(document).ready(function () {
    var doit;
    console.info('Setting up WinChan onOpen');
    WinChan.onOpen(function(origin, args, cb) {
      console.info('onOpen just got real');
      // origin is the scheme+host+port that cause window invocation,
      // it can be trusted

      // args are the untrusted arguments provided by the calling site

      // and cb you can call within the function, or synchronously later.
      // calling it indicated the window is done and can be closed.
      console.info('origin=' + origin);
      console.info(args);
      doit = function () { cb({
          date: new Date(),
          amount: args.amount,
          payment_type: args.accepted_types[0],
          transaction: "x3423"
        });
      };
    });

    $('#pay').click(function () {
      alert('click');
      doit();
    });
});