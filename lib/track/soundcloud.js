var url = require('url'),
    http = require('http');

exports.handlesUrl = function (trackUrl) {
  return url.parse(trackUrl).host === 'soundcloud.com';
};

exports.fetchTrackInfo = function (trackUrl, cb) {
  var resolveUrl = url.format({
    protocol: 'http',
    host: 'api.soundcloud.com',
    pathname: '/resolve.json',
    query: {
      url: trackUrl,
      client_id: '98365098cb72a68cf93fda1fcebf48e8'
    }
  });

  http.get(resolveUrl, function (res) {
    http.get(res.headers['location'], function (res) {
      var data = '';
      res.on('data', function (chunk) { data += chunk });
      res.on('end', function () {
        var info = JSON.parse(data);
        cb({
          title: info.title,
          image: {
            url: info.artwork_url || info.user.avatar_url
          },
          url: trackUrl
        });
      });
    });
  });
};
// ayL4pzictu8
