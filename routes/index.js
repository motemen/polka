var queue = [], currentTrack;

exports.index = function (req, res) {
  res.redirect('/queue');
};

exports.queue = function (req, res) {
  res.render('queue', { queue: queue, currentTrack: currentTrack });
};

exports.enqueue = function (req, res) {
  if (req.body.url.length) {
    queue.push({ url: req.body.url });
    res.redirect('/queue');
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
          queue.push({ url: '/uploaded/' + filename, type: 'file', mime: file.mime });
        }
        res.redirect('/queue');
      }
    );
  } else {
    res.redirect('/queue');
  }
};

exports.dequeue = function (req, res) {
  currentTrack = queue.shift();
  res.json(currentTrack);
};

exports.play = function (req, res) {
  res.render('play');
};
