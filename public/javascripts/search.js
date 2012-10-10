$(function () {
    var timerId;
    $('#query').on('keyup',function() {
        var word = this.value;
        clearTimeout(timerId);
        timerId = setTimeout( function () {
            $('#result').html('');
            if (word.length == 0) return;
            $.ajax({
                url: 'http://gdata.youtube.com/feeds/api/videos/-/music',
                type: 'get',
                dataType: 'jsonp',
                data: {
                    'q'          : word,
                    'v'          : 2,
                    'alt'        : 'json',
                    'max-results': 12
                }
            }).done(function(json) {
                if (json.feed.entry.length > 0) {
                    var result = $('#result');
                    result.html('');
                    for (var i = 0 , len = json.feed.entry.length ; i < len ; i++) {
                        var entry = json.feed.entry[i];
                        var span = $('<span />').addClass('span3');
                        var form = $('<form />').attr({
                            action : '/queue',
                            method : 'POST',
                            enctype : 'multipart/form-data'
                        });
                        var hidden = $('<input />').attr({
                            type : 'hidden',
                            name : 'url',
                            value : entry.link[0].href
                        });
                        var link = $('<a />').attr({
                            href: entry.link[0].href,
                            target: '_blank'
                        });
                        var thumbnail = $('<img />').attr({
                            src: entry['media$group']['media$thumbnail'][1]['url'],
                            title: entry['media$group']['media$title']['$t']
                        }).css({
                            width: '200px'
                        });
                        var button = $('<button />').attr('type','submit').addClass('default').text('enqueue');
                        form.append(hidden);
                        form.append(link.append(thumbnail));
                        form.append(button);
                        span.append(form);
                        result.append(span);
                    }
                }
            });
        }, 500);
    });
});
