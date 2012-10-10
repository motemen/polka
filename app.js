var express = require('express'),
    routes  = require('./routes'),
    admin   = require('./routes/admin.js'),
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

app.get ('/admin',              admin.index);
app.post('/admin/control/next', admin.next);

var server = http.createServer(app);
var socket = io.listen(server);

var manager  = require('./lib/clientsManager.js');
var playlist = require('./lib/playlist.js');

server.listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});

playlist.events.on('next', function (track) {
    manager.forEachClientSocket(function (client) {
        client.emit('play', track);
    });
});

playlist.events.on('add', function (track) {
    if (manager.getPrimaryClientState() === 'waiting') {
        playlist.next();
    }
});

manager.events.on('primaryStateChange', function (state) {
    if (state === 'waiting') {
        playlist.next(true);
    }
});

socket.on('connection', function (client) {
    manager.addClient(client);
    manager.setClientState(client, 'waiting');

    var isPrimary = manager.isClientPrimary(client);
    client.emit('init', { isPrimary: isPrimary });

    if (!isPrimary) {
        // echo
        client.emit('play', playlist.getCurrentTrack());
    }

    client.on('update', function (info) {
        console.log('[' + client.id + '] state -> ', info.state);
        manager.setClientState(client, info.state);
    });

    client.on('disconnect', function () {
        manager.removeClient(client);
    });
});
