$('.bid').click(function () {
  window.navigator.id.get(function (assertion) {
    $.post('/auth', {
      assertion: assertion
    }, function (data, status, jqxhr) {
      window.location.reload();
    });

  });
});