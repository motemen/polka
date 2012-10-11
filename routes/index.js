var playlist   = require('../lib/playlist');
var youtube    = require('../lib/track/youtube');
var soundcloud = require('../lib/track/soundcloud');

exports.index = function (req, res) {
    res.redirect('/queue');
};

exports.queue = function (req, res) {
    res.render('queue', { playlist: playlist });
};

exports.enqueue = function (req, res) {
    if (req.body.url) {
        var url = req.body.url;
        var handled = [ youtube, soundcloud ].some(function (service) {
            if (service.handlesUrl(url)) {
                service.fetchTrackInfo(url, function (track) {
                    console.log(track);
                    if (track) {
                        playlist.add(track);
                    }
                    res.redirect('/queue');
                });
                return true;
            }
        });
        if (!handled) {
            playlist.add({ url: url });
            res.redirect('/queue');
        }
    } else if (req.files.file) {
        var file = req.files.file;
        var fs   = require('fs'),
        path = require('path'),
        util = require('util');

        var filename = new Date().getTime() + '-' + file.name;
        util.pump(
            fs.createReadStream(file.path),
            fs.createWriteStream(path.join(__dirname, '..', 'public', 'uploaded', filename)),
            function (error) {
                if (!error) {
                    playlist.add({ url: '/uploaded/' + filename, type: 'audioTag', mime: file.mime });
                }
                res.redirect('/queue');
            }
        );
    } else {
        res.redirect('/queue');
    }
};

exports.play = function (req, res) {
    res.render('play');
};

exports.dump = function (req, res) {
    res.send({
        playlist: {
            tracks: playlist.tracks,
            index: playlist.index
        }
    });
};
