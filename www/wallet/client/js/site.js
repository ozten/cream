$(document).ready(function () {
  $('.browserid').live('click', function (event) {
    event.preventDefault();
    var opts = {};
    $('button.browserid').attr('disabled', true);
    navigator.id.get(function (assertion) {
      if (assertion) {
        $.post("/auth", {assertion: assertion}, function(res) {
          if (res.status && res.status == "okay") {
            window.email = res.email;
            $('.email-address').text(window.email);
            $('#login-form').hide('slow');
            
          }
        });
      }
      $('button.browserid').attr('disabled', null);
    }, opts);
  });
});