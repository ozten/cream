
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    browserid = require('connect-browserid'),
    RedisStore = require('connect-redis')(express);

var profiles = require('./lib/profiles');

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

  app.use(browserid.authUser({ secret: "yabba dabba do",
                               audience: 'http://localhost:3000' }));
  app.use(routes.localVars);
  app.use(app.router);

  app.use(express.compiler({ enable: ['less'],
                             src: './public'}));
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Helpers
app.dynamicHelpers({
  session: function (req, res) {
    return req.session;
  },
});

// Routes
//     Static
app.get('/', routes.index);
app.get('/about', routes.direct('about'));
//     Profile
app.get('/register', routes.register);
app.post('/register', routes.register);

//     Cash
app.get('/recent', routes.recent);

app.get('/ask-for-cash', routes.ask_for_cash);
app.post('/ask-for-cash', routes.ask_for_cash);

app.get('/pay/:email/:pay_req_id', routes.pay);

// Auth
app.post('/auth', browserid.auth({ next: '/register' }));

app.get('/logout', browserid.logout({ next: '/' }));

// Startup
app.listen(3000);

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
