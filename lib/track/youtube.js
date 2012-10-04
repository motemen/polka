var url = require('url'),
    http = require('http');

exports.handlesUrl = function (trackUrl) {
  return url.parse(trackUrl).host.match(/\.youtube\.com$/);
};

exports.fetchTrackInfo = function (trackUrl, cb) {
  var videoId = url.parse(trackUrl, true).query.v;
  http.get(
    'http://gdata.youtube.com/feeds/api/videos/' + videoId + '?alt=json', function (res) {
      var data = '';
      res.on('data', function (chunk) { data += chunk });
      res.on('end', function () {
        var info = JSON.parse(data);
        cb({
          title: info.entry['media$group']['media$title']['$t'],
          image: {
            url: info.entry['media$group']['media$thumbnail'][1]['url'],
          },
          url: trackUrl,
          videoId: videoId
        });
      });
    }
  );
};
