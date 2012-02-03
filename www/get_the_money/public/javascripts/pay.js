$('#make-payment').submit(function(event) {
  event.preventDefault();
  //var amount = parseFloat($('#make-payment #amount').val()) * 100;
  var amount = parseFloat($('#amount', $(this)).val()) * 100;

  navigator.payz(amount, ['VISA'],
                 // Which side has recipient
                 {
                   reciever: 'shout@ozten.com',
                   //TODO How do we know what business this is?
                   // TODO how do we route their pahyment?
                   payee: 'eozten@yahoo.com',
                   description: 'Buy used couch',
                   success: function (reciept) { console.info(reciept); },
                   failure: function (error) { console.error(error); }
                 });
});