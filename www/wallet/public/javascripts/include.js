$(document).ready(function () {

console.log('definging payz');
console.log(window.WinChan);
// TODO include winchan, package with almond.js?
// Right now get the money includes winchan
if ( ! navigator.payz ) {
console.log('going for it');

  navigator.payz = function (amount, accepted_types, success, failure) {
    if (window.WinChan)
    window.WinChan.open({
      url: "http://localhost:3001/pay",
      relay_url: "http://localhost:3001/javascripts/lib/relay.html",
      window_features: "menubar=0,location=0,resizable=0,scrollbars=0,status=0,dialog=1,width=700,height=375",
      params: {
        amount: amount,
        accepted_types: accepted_types
      }
    }, function(err, r) {
      // err is a string on failure, otherwise r is the response object
      if (err) { 
        failure(err); 
      } else {
        console.info("Calling success function");
        success(r);
        console.info("Done calling success");
      }
    });
  };
} else {
  console.info(navigator.payz);
  console.info("Skipping");
}

});