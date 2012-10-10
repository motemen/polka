var clients = {}, // id: { socket: , state: }
    primaryId = null,
    events = new (require('events').EventEmitter)();

exports.addClient = function (socket) {
    clients[socket.id] = {
        socket: socket,
        state: null
    };
};

exports.removeClient = function (socket) {
    delete clients[socket.id];
};

exports.getPrimaryClientState = function () {
    var id = updatePrimaryClientId();
    if (!id || !clients[id]) return null;

    return clients[id].state;
};

exports.forEachClientSocket = function (cb) {
    for (var id in clients) {
        cb(clients[id].socket);
    }
};

exports.setClientState = function (socket, state) {
    clients[socket.id].state = state;
    if (exports.isClientPrimary(socket)) {
        events.emit('primaryStateChange', state);
    }
};

exports.isClientPrimary = function (socket) {
    return socket.id === updatePrimaryClientId();
};

exports.events  = events;
exports.clients = clients;

function updatePrimaryClientId () {
    if (primaryId && clients[primaryId]) {
        return primaryId;
    }
    for (var id in clients) {
        return primaryId = id;
    }
    return null;
}

