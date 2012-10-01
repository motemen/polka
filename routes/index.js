var queue = [], currentTrack;

exports.index = function (req, res) {
  res.redirect('/queue');
};

exports.queue = function (req, res) {
  res.render('queue', { queue: queue, currentTrack: currentTrack });
};

exports.enqueue = function (req, res) {
  queue.push({ url: req.body.url });
  res.redirect('/queue');
};

exports.dequeue = function (req, res) {
  // TODO when empty
  currentTrack = queue.shift();
  res.json(currentTrack);
};

exports.play = function (req, res) {
  res.render('play');
};
