$(function () {
  var controller = new Controller();
  var youtube = new YouTube();

  controller.loop(function (track) {
    var videoId = youtube.extractVideoId(track.url);
    return youtube.play(videoId);
  });
});

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
      play(track).always(next);
    });
  };
  next();
};

function YouTube () {
  this.PLAYER_SWF_ID = 'player-youtube-swf';
  this.PLAYER_PLACEHOLDER_ID = 'player-youtube-placeholder';
  this.deferreds = {};
};

YouTube.prototype = {
  prepare: function () {
    if (this.deferreds['prepare']) {
      return this.deferreds['prepare'];
    }

    var youtube = this;
    window.onYouTubePlayerReady = function () {
      YouTube.prototype.onPlayerReady.apply(youtube, arguments);
    };
    window.onYouTubePlayerStateChange = function () {
      YouTube.prototype.onPlayerStateChange.apply(youtube, arguments);
    };

    $('<div/>', { id: this.PLAYER_PLACEHOLDER_ID }).appendTo(document.body);

    swfobject.embedSWF(
      '//www.youtube.com/apiplayer?enablejsapi=1&version=3',
      this.PLAYER_PLACEHOLDER_ID, '425', '356', '8', null, null,
      { allowScriptAccess: 'always' },
      { id: this.PLAYER_SWF_ID }
    );

    return this.deferreds['prepare'] = $.Deferred();
  },
  play: function (videoId) {
    if (this.deferreds['play']) {
      this.deferreds['play'].reject();
    }
    this.prepare().done(function (player) {
      player.loadVideoById(videoId);
    });
    return this.deferreds['play'] = $.Deferred();
  },
  extractVideoId: function (url) {
    return url.match(/\?v=([^&]+)/)[1];
  },
  onPlayerReady: function (playerid) {
    var player = this.getPlayer();
    player.addEventListener('onStateChange', 'onYouTubePlayerStateChange');
    this.deferreds['prepare'].resolve(player);
  },
  onPlayerStateChange: function (newState) {
    var stateName = this.getStateName(newState);
    console.log(stateName);
    if (stateName === 'ended' && this.deferreds['play']) {
      this.deferreds['play'].resolve();
    }
  },
  getPlayer: function () {
    return document.getElementById(this.PLAYER_SWF_ID);
  },
  getStateName: function (state) {
    return [ 'unstarted', 'ended', 'playing', 'paused', 'buffering', undefined, 'cued' ][ state + 1 ];
  }
};
