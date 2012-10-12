$(function () {
    var onQueryInput = function () {
        var query = $(this).val();

        if (query.length == 0) return;

        if ($(this).data('lastQuery') === query) return;
        $(this).data('lastQuery', query);

        var makeResultHTML = _.template(
            $('#search-result-template').html().replace(/{{/g, '<%').replace(/}}/g, '%>')
        );
        var appendResult = function (track) {
            $(makeResultHTML({ track: track })).appendTo('#result-item-container');
        }

        var firstResultArrived = $.Deferred().done(function () {
            $('#result-item-container').empty()
        });

        SC.get('/tracks', { q: query, limit: 12, order: 'hotness' }, function (tracks) {
            firstResultArrived.resolve();

            for (var i = 0, len = tracks.length; i < len; i++) {
                if (tracks[i].embeddable_by !== 'all') continue;
                var track = {
                    type: 'soundcloud',
                    url: tracks[i].permalink_url,
                    title: tracks[i].title,
                    image: {
                        url: tracks[i].artwork_url || tracks[i].user.avatar_url
                    },
                    duration: Number(tracks[i].duration / 1000),
                    plays: tracks[i].playback_count,
                    favs: tracks[i].favoritings_count
                };
                appendResult(track);
            }
        });

        $.ajax({
            url: '//gdata.youtube.com/feeds/api/videos/-/music',
            type: 'get',
            dataType: 'jsonp',
            data: {
                'q'          : query,
                'v'          : 2,
                'alt'        : 'json',
                'max-results': 12,
                'format'     : 5
            }
        }).done(function(json) {
            firstResultArrived.resolve();

            for (var i = 0 , len = json.feed.entry.length ; i < len ; i++) {
                var entry = json.feed.entry[i];
                var track = {
                    type: 'youtube',
                    url: entry.link[0].href,
                    image: {
                        url: entry['media$group']['media$thumbnail'][0]['url']
                    },
                    title: entry['media$group']['media$title']['$t'],
                    duration: Number(entry['media$group']['yt$duration']['seconds']),
                    plays: Number(entry['yt$statistics']['viewCount']),
                    // favs: Number(entry['yt$statistics']['favoriteCount'])
                    favs: Number(entry['yt$rating'] && entry['yt$rating']['numLikes'])
                };
                appendResult(track);
            }
        });
    };

    $('#query').on('input', _.debounce(onQueryInput, 500));
});
