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

exports.voteCurrentTrack = function (id, vote) {
    if (!currentTrack) return null;

    if (!currentTrack.votes) {
        currentTrack.votes = {};
    }

    currentTrack.votes[id] = vote;
};

exports.getTrackVotes = function (track) {
    if (!track.votes) {
        return {};
    }

    var reps = {};
    for (var id in track.votes) {
        var rep = track.votes[id];
        reps[rep] = (reps[rep] || 0) + 1;
    }
    return reps;
};

exports.events = events;
exports.tracks = tracks;

exports.__defineGetter__('currentTrack', function () {
    return currentTrack;
});

exports.__defineGetter__('index', function () {
    return nextIndex - 1;
});

exports.__defineGetter__('tracks', function () {
    return tracks
});
