var playlist = require('../lib/playlist');
var manager  = require('../lib/clientsManager.js');

exports.index = function (req, res) {
    res.render('admin', { playlist: playlist, manager: manager });
};

exports.next = function (req, res) {
    playlist.next();
    res.redirect('/admin');
};
