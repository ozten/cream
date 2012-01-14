//TODO ... version api and site so you can have multiple demos
//with different semantics...

$(document).ready(function () {

var site = 'http://10.0.1.13:3001';
console.log('definging payz');
console.log(window.WinChan);
// TODO include winchan, package with almond.js?
// Right now get the money includes winchan
if ( ! navigator.payz ) {
console.log('going for it');

  navigator.payz = function (amount, accepted_types, options) {
    var defaults = {
      success: function (recipet) {},
      failure: function (err) {},
      reason: ""
    };
    var opt = $.extend(true, {}, defaults, options);
    if (window.WinChan)
    window.WinChan.open({
      url: site + "/pay",
      relay_url: site + "/javascripts/lib/relay.html",
      window_features: "menubar=0,location=0,resizable=0,scrollbars=0,status=0,dialog=1,width=700,height=375",
      params: {
        amount: amount,
        accepted_types: accepted_types,
        payee: opt.payee,
        reciever: opt.reciever
      }
    }, function(err, r) {
      // err is a string on failure, otherwise r is the response object
      if (err) { 
        opt.failure(err); 
      } else {
        console.info("Calling success function");
        opt.success(r);
        console.info("Done calling success");
      }
    });
  };
} else {
  console.info(navigator.payz);
  console.info("Skipping");
}

});
