var players, socket;

$(function () {
    players = {
        youtube:    new Player.YouTube(),
        soundcloud: new Player.SoundCloud(),
        audioTag:   new Player.AudioTag()
    };

    socket = io.connect(location.protocol + '//' + location.host);
    socket.on('init', function (data) {
        console.log(data);
        $('#client-info').text('You are ' + (data.isPrimary ? 'master' : 'echo'));
    });
    socket.on('play', function (track, meta) {
        console.log('play track=' + JSON.stringify(track));
        if (!track) return;
        var player = players[track.type];
        if (player) {
            var pos = meta && meta.time - track.playStartedAt; // may be NaN
            player.prepare(track).done(function () {
                socket.emit('update', { state: 'playing' });
                document.title = '► ' + track.title || track.url;
            });
            player.play(track, { pos: pos }).done(function () {
                socket.emit('update', { state: 'waiting' });
                console.log('done');
                document.title = 'Polka - Play';
            });
        }
    });
    socket.on('chatmessage', function (message) {
        var date = new Date();
        var li = $('<li/>').addClass('message').append(
            $('<span/>').addClass('timestamp').text(date.toLocaleTimeString()),
            $('<span/>').addClass('body').text(message.message)
        );
        if (message.votes) {
            li.append(
                $('<span class="votes"/>').append(
                    $('<span class="vote-up"/>')  .text((message.votes['++'] || 0) + '++'),
                    $('<span class="vote-down"/>').text((message.votes['--'] || 0) + '--')
                )
            )
        }
        $('#chat-messages').prepend(li);
    });

    $('#chat').submit(function () {
        var messageBody = $('#message-body');
        socket.emit('chatmessage', messageBody.val());
        messageBody.val('');

        return false;
    });
});

// Player {{{
function Player () {
    this.deferreds = {};
}

Player.prototype = {
    play: function (track, option) {
        // cancel previous play
        if (this.deferreds['play']) {
            this.deferreds['play'].reject();
        }

        var self = this;
        this.prepare(track).done(function () { self._play(track, option) });

        return this.deferreds['play'] = $.Deferred(function (d) {
            d.fail(function () { self.cleanup() })
        });
    },
    playEnded: function () {
        if (this.deferreds['play']) {
            this.deferreds['play'].resolve();
        }
    },
    prepare: function (track) {
        return this.deferreds['prepare'] = this.deferreds['prepare'] || this._prepare(track);
    },
    _prepare: function () {
        var d = $.Deferred();
        d.resolve();
        return d;
    },
    cleanup: function () {
    }
};
// }}}

// Player.YouTube {{{
// https://developers.google.com/youtube/iframe_api_reference
Player.YouTube = function () {
    this.PLAYER_PLACEHOLDER_ID = 'player-youtube-placeholder';
    Player.call(this);
};

Player.YouTube.prototype = $.extend(
    new Player, {
    _play: function (track, option) {
        this.player.loadVideoById(track.videoId, option && option.pos || 0);
    },
    _prepare: function (track) {
        var d = $.Deferred();

        $.getScript('//www.youtube.com/iframe_api');

        $('<div/>', { id: this.PLAYER_PLACEHOLDER_ID }).appendTo(document.body);

        var youtube = this;
        window.onYouTubeIframeAPIReady = function () {
            youtube.player = new YT.Player(youtube.PLAYER_PLACEHOLDER_ID, {
                videoId: track.videoId,
                playerVars: { autoplay: 1, controls: 0 },
                events: {
                    onReady: function () {
                        d.resolve();
                    },
                    onStateChange: function (e) {
                        if (e.data === YT.PlayerState.ENDED) {
                            youtube.playEnded();
                        }
                    }
                }
            });
        };

        return d;
    }
}
);
// }}}

// Player.SoundCloud {{{
// http://developers.soundcloud.com/docs#playing
// http://developers.soundcloud.com/docs/api/html5-widget
// http://developers.soundcloud.com/docs/api/sdks#javascript
Player.SoundCloud = function () {
    this.PLAYER_PLACEHOLDER_ID = 'player-soundcloud-placeholder';
    this.CLIENT_ID = '98365098cb72a68cf93fda1fcebf48e8';
    Player.call(this);
};

Player.SoundCloud.prototype = $.extend(
    new Player(), {
    _play: function (track, option) {
        var url = track.url;
        var self = this;
        console.log('embed ' + url);
        SC.oEmbed(url, { auto_play: true, buying: false, liking: false, download: false, sharing: false, show_comments: false, show_playcount: false }, function (oEmbed) {
            var placeholder = $(document.getElementById(self.PLAYER_PLACEHOLDER_ID));
            placeholder.children().hide(); // do not remove; SC.Widget keeps reference
            var container = $('<div/>').html(oEmbed.html).appendTo(placeholder);
            var widget = SC.Widget(container.find('iframe').get(0));
            widget.bind(
                SC.Widget.Events.FINISH,
                function () { console.log('finish ' + url); self.playEnded() }
            );
            if (option && option.pos) {
                var posSet;
                widget.bind(
                    SC.Widget.Events.LOAD_PROGRESS,
                    function (e) {
                        if (e.loadedProgress === 1 && !posSet) {
                            widget.seekTo(option.pos * 1000);
                            posSet = true;
                        }
                    }
                );
            }
            self.widget = widget;
        });
    },
    _prepare: function () {
        var self = this;
        return $.when(
            $.getScript('http://connect.soundcloud.com/sdk.js'),
            $.getScript('http://w.soundcloud.com/player/api.js')
        ).pipe(function () {
            $('<div/>', { id: self.PLAYER_PLACEHOLDER_ID }).appendTo(document.body);
        });
    }
});
// }}}

// Player.AudioTag {{{
Player.AudioTag = function () {
    Player.call(this);
};

Player.AudioTag.prototype = $.extend(
    new Player(), {
    _play: function (track) {
        var url = track.url;
        var audioTag = this;
        this.audio = $('<audio controls autoplay/>')
        .attr('src', url)
        .appendTo(document.body)
        .bind('ended', function () {
            console.log('ended');
            audioTag.playEnded();
        });
    },
    cleanup: function () {
        this.audio.remove();
    }
}
);
// }}}
