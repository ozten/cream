$('.bid').click(function () {

  window.navigator.id.get(function (assertion) {
    $.post('/auth', {
      assertion: assertion
    }, function (data, status, jqxhr) {
      // TODO: Don't navigate away if your on
      // http://dev.gtm.cream.org:3000/pay/asdfasdfsdafsd%40mailinator.com/8c39d5e0-5c5d-11e1-a827-b5390612953d
      $.mobile.changePage('/recent');      
    });

  });
});
$('a[href="/logout"]').live('click', function (e) {
  e.preventDefault();
  $.post('/logout', function (data, status, jqxhr) {
    $.mobile.changePage('/');
  });
  return false;
});