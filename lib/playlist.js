var tracks = [],
    nextIndex = 0,
    currentTrack = null,
    events = new (require('events').EventEmitter)();

exports.add = function (track) {
    tracks.push(track);
    events.emit('add', track);
};

exports.next = function (force) {
    if (force) {
        currentTrack = tracks[nextIndex];
    }
    if (tracks[nextIndex]) {
        currentTrack = tracks[nextIndex];
        ++nextIndex;
        events.emit('next', currentTrack);
    }
    return currentTrack;
};

exports.events = events;
exports.tracks = tracks;

exports.getTracks = function () { return tracks };
exports.getIndex  = function () { return nextIndex - 1 };
exports.getCurrentTrack = function () { return currentTrack };

exports.__defineGetter__('currentTrack', function () {
    return currentTrack;
});

exports.__defineGetter__('index', function () {
    return nextIndex - 1;
});

exports.__defineGetter__('tracks', function () {
    return tracks
});
