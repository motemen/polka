var express = require('express'),
    routes  = require('./routes'),
    http    = require('http'),
    path    = require('path'),
    io      = require('socket.io');

var app = express();

app.configure(function () {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
  app.use(express.errorHandler());
});

app.get ('/',        routes.index);
app.get ('/play',    routes.play);
app.get ('/queue',   routes.queue);
app.post('/queue',   routes.enqueue);
app.post('/dequeue', routes.dequeue);

var server = http.createServer(app);
var socket = io.listen(server);

var manager  = require('./lib/clientsManager.js');
var playlist = require('./lib/playlist.js');

server.listen(app.get('port'), function () {
  console.log("Express server listening on port " + app.get('port'));
});

playlist.events.on('next', function (track) {
  manager.forEachClient(function (client) {
    client.emit('play', track);
  });
});

playlist.events.on('add', function (track) {
  var state = manager.getPrimaryClientState();
  if (state === 'waiting') {
      playlist.next();
  }
});

socket.on('connection', function (client) {
  var clientInfo = manager.addClient(client);
  client.emit('init', clientInfo);

  client.state = 'waiting';

  var prim = manager.getPrimaryClient();
  var state = manager.getPrimaryClientState();
  if (state === 'waiting') {
    playlist.next();
  } else if (state === 'playing') {
    // copy state
    // TODO seek
    if (client !== prim) {
      client.emit('play', playlist.getCurrentTrack());
    }
  } else {
    console.log('cannot handle ' + state);
  }

  client.on('update', function (info) {
    console.log('update -> ', info.state);
    client.state = info.state;
    var prim = manager.getPrimaryClient();
    if (client === prim) {
      playlist.next();
    }
  });

  client.on('disconnect', function () {
    manager.removeClient(client);
  });
});
