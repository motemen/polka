$(function () {
    var onQueryInput = function () {
        var query = $(this).val();

        if (query.length == 0) return;
        if ($(this).data('lastQuery') === query) return;

        $(this).data('lastQuery', query);

        var makeResultHTML = _.template(
            $('#search-result-template').html().replace(/{{/g, '<%').replace(/}}/g, '%>')
        );

        var firstResultArrived = $.Deferred().done(function () {
            $('#result').empty()
        });

        SC.get('/tracks', { q: query, limit: 12 }, function (tracks) {
            if (tracks.length === 0) return;

            firstResultArrived.resolve();

            for (var i = 0, len = tracks.length; i < len; i++) {
                var track = {
                    url: tracks[i].permalink_url,
                    title: tracks[i].title,
                    image: {
                        url: tracks[i].artwork_url || tracks[i].user.avatar_url
                    }
                };
                $(makeResultHTML({ track: track })).appendTo('#result');
            }
        });

        $.ajax({
            url: 'http://gdata.youtube.com/feeds/api/videos/-/music',
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
            if (json.feed.entry.length === 0) return;

            firstResultArrived.resolve();

            for (var i = 0 , len = json.feed.entry.length ; i < len ; i++) {
                var entry = json.feed.entry[i];
                var track = {
                    url: entry.link[0].href,
                    image: {
                        url: entry['media$group']['media$thumbnail'][1]['url']
                    },
                    title: entry['media$group']['media$title']['$t']
                };
                $(makeResultHTML({ track: track })).appendTo('#result');
            }
        });
    };

    $('#query').on('input', _.debounce(onQueryInput, 500));
});
