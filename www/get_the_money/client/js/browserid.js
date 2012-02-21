$('.bid').click(function () {

  window.navigator.id.get(function (assertion) {
    $.post('/auth', {
      assertion: assertion
    }, function (data, status, jqxhr) {
      setTimeout(function () {
        window.location.pathname = '/recent';
      }, 1000);
    });

  });
});