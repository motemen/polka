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
function SoundCloud () {
  this.PLAYER_IFRAME_ID = 'player-soundcloud-iframe';
  this.deferreds = {};
}

SoundCloud.prototype = {
  handlesUrl: function (url) {
    return url.match(/^http:\/\/api\.soundcloud\.com\//);
  },
  play: function (url) {
    if (this.deferreds['play']) {
      this.deferreds['play'].reject();
    }
    this.prepare(url).done(function (player) {
      console.log('player.load');
      player.load(url, { auto_play: true });
    });
    return this.deferreds['play'] = $.Deferred();
  },
  prepare: function (initUrl) {
    if (this.deferreds['prepare']) {
      return this.deferreds['prepare'];
    }

    var soundcloud = this;
    return this.deferreds['prepare'] = $.getScript(
      'http://w.soundcloud.com/player/api.js'
    ).pipe(function () {
      var widget = SC.Widget(
        $('<iframe/>', {
          id: soundcloud.PLAYER_IFRAME_ID,
          src: 'http://w.soundcloud.com/player/?url=',
          scrolling: 'no',
          frameborder: 0,
          width: '100%',
          height: 166
        }).appendTo(document.body).get(0)
      );
      widget.bind(
        SC.Widget.Events.READY, function () {
          widget.bind(
            SC.Widget.Events.FINISH,
            function () { soundcloud.onPlayerFinished() }
          );
        }
      );
      return widget;
    });
  },
  onPlayerFinished: function () {
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
