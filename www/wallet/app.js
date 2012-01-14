
/**
 * Module dependencies.
 */

var express = require('express'),
    RedisStore = require('connect-redis')(express),
    routes = require('./routes');


var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.bodyParser());
  app.use(express.logger());
  app.use(express.responseTime());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'TODO move to config',
                            store: new RedisStore }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', routes.index);

app.get('/pay', routes.pay);

// AJAX partial
app.get('/add-payment-method', routes.add_payment_method);

app.post('/stripe-add-payment', routes.stripe_add_payment);

app.listen(3001);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
