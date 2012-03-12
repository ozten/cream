var express = require('express');
var app = express.createServer();

app.use(express.compiler({ enable: ['less'],
                             src: __dirname}));
app.use(express.static(__dirname));

app.listen(3002);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);