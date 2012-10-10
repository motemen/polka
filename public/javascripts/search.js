$(function () {
    var timerId;
    $('#query').on('keyup',function() {
        var word = this.value;
        clearTimeout(timerId);
        timerId = setTimeout( function () {
            $('#result').html('');
            if (word.length == 0) return;
            var url = "http://gdata.youtube.com/feeds/api/videos/-/music?q="
                        + encodeURIComponent(word)
                        + "&max-results=12&v=2&alt=json&callback=?";
            $.getJSON(url,function(json) {
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
                        var iframe = $('<iframe />').attr({
                            width  : 201,
                            height : 131,
                            src    : 'http://www.youtube.com/embed/' + entry.media$group.yt$videoid.$t ,
                            frameborder : 0
                        });
                        var button = $('<button />').attr('type','submit').addClass('default').text('enqueue');
                        form.append(hidden);
                        form.append(iframe);
                        form.append(button);
                        span.append(form);
                        result.append(span);
                    }
                }
            });
        }, 500);
    });
});
