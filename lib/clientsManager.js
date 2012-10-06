var clients = {},
    primaryId = null;

exports.addClient = function (client) {
    clients[client.id] = client;
    updatePrimaryClientId();

    return {
        isPrimary: exports.isClientPrimary(client)
    };
};

exports.removeClient = function (client) {
    delete clients[client.id];
};

exports.isClientPrimary = function (client) {
    return client.id === updatePrimaryClientId();
};

exports.getPrimaryClient = function () {
    return clients[updatePrimaryClientId()];
};

exports.forEachClient = function (cb) {
    for (var id in clients) {
        cb(clients[id]);
    }
};

exports.getPrimaryClientState = function () {
    updatePrimaryClientId();
    var prim = exports.getPrimaryClient();
    if (!prim) return null;
    return prim.state;
};

function updatePrimaryClientId () {
    if (primaryId && clients[primaryId]) {
        return primaryId;
    }
    for (var id in clients) {
        return primaryId = id;
    }
    return null;
}

