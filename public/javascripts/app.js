$(function () {
  var controller = new Controller();

  var players = [
    new YouTube(),
    new SoundCloud(),
    new UploadedFile()
  ];

  controller.loop(function (track) {
    console.log(track);
    for (var i = 0; i < players.length; i++) {
      if (players[i].handlesUrl(track.url)) {
        return players[i].play(track.url);
      }
    }
  });
});

// Controller {{{
function Controller () {
}

Controller.prototype.dequeue = function () {
  return $.ajax(
    '/dequeue', {
      type: 'POST',
      dataType: 'json'
    }
  );
};

Controller.prototype.loop = function (play) {
  var controller = this;
  var next = function () {
    controller.dequeue().done(function (track) {
      if (!track) {
        setTimeout(next, 2000);
        return;
      }
      var d = play(track);
      if (d) {
        d.always(next);
      } else {
        console.log('Could not play: ' + track.url);
        next();
      }
    });
  };
  next();
};
// }}}

// YouTube {{{
// https://developers.google.com/youtube/iframe_api_reference
function YouTube () {
  this.PLAYER_PLACEHOLDER_ID = 'player-youtube-placeholder';
  this.deferreds = {};
};

YouTube.prototype = {
  handlesUrl: function (url) {
    return url.match(/^https?:\/\/\w+\.youtube\.com\//);
  },
  play: function (url) {
    var videoId = this.extractVideoId(url);
    if (this.deferreds['play']) {
      this.deferreds['play'].reject();
    }
    this.prepare(url).done(function (player) {
      player.loadVideoById(videoId);
    });
    return this.deferreds['play'] = $.Deferred();
  },
  prepare: function (initUrl) {
    if (this.deferreds['prepare']) {
      return this.deferreds['prepare'];
    }

    var videoId = this.extractVideoId(initUrl);
    var d = this.deferreds['prepare'] = $.Deferred();

    $.getScript('//www.youtube.com/iframe_api');

    $('<div/>', { id: this.PLAYER_PLACEHOLDER_ID }).appendTo(document.body);

    var youtube = this;
    window.onYouTubeIframeAPIReady = function () {
      youtube.player = new YT.Player(youtube.PLAYER_PLACEHOLDER_ID, {
        videoId: videoId,
        events: {
          onReady: function () { d.resolve(youtube.player) },
          onStateChange: function (e) {
            youtube.onPlayerStateChange(e);
          }
        }
      });
    };

    return d;
  },
  onPlayerStateChange: function (e) {
    if (e.data === YT.PlayerState.ENDED) {
      if (this.deferreds['play']) {
        this.deferreds['play'].resolve();
      }
    }
  },
  extractVideoId: function (url) {
    return url.match(/[\?&]v=([^&]+)/)[1];
  }
};
// }}}

// SoundCloud {{{
// XXX Currently supports only widget URL
// http://developers.soundcloud.com/docs#playing
// http://developers.soundcloud.com/docs/api/html5-widget
function SoundCloud () {
  this.PLAYER_IFRAME_ID = 'player-soundcloud-iframe';
  this.CLIENT_ID = '98365098cb72a68cf93fda1fcebf48e8';
  this.deferreds = {};
}

SoundCloud.prototype = {
  handlesUrl: function (url) {
    return url.match(/^http:\/\/soundcloud\.com\//);
  },
  play: function (url) {
    if (this.deferreds['play']) {
      this.deferreds['play'].reject();
    }
    var soundcloud = this;
    this.prepare(url).done(function () {
      console.log('embed ' + url);
      SC.oEmbed(url, { auto_play: true }, function (oEmbed) {
        var iframe = $(oEmbed.html).appendTo(document.body);
        if (!iframe.is('iframe')) {
          console.log('got no iframe', iframe);
        }
        var widget = SC.Widget(iframe.get(0));
        widget.bind(
          SC.Widget.Events.READY, function () {
            widget.bind(
              SC.Widget.Events.FINISH,
              function () { soundcloud.onPlayerFinished() }
            );
          }
        );
      });
    });
    return this.deferreds['play'] = $.Deferred();
  },
  prepare: function (initUrl) {
    if (this.deferreds['prepare']) {
      return this.deferreds['prepare'];
    }

    return this.deferreds['prepare'] = $.when(
      $.getScript('http://connect.soundcloud.com/sdk.js'),
      $.getScript('http://w.soundcloud.com/player/api.js')
    );
  },
  onPlayerFinished: function () {
    console.log('onPlayerFinished');
    this.deferreds['play'].resolve();
  }
};
// }}}

// UploadedFile {{{
function UploadedFile () {
}

UploadedFile.prototype = {
  handlesUrl: function (url) {
    return url.indexOf('/') === 0;
  },
  play: function (url) {
    var d = $.Deferred();
    var audio = $('<audio controls autoplay/>')
      .attr('src', url)
      .appendTo(document.body)
      .bind('ended', function () {
        console.log('ended');
        d.resolve();
      });
    return d;
  }
};
// }}}
