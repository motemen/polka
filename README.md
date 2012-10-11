Polka - Web DJ
==============

Polka is a standalone web app that enables sharing one video/music queue with your friends.

Polka synchronizes track play to make people listening to the same media (on YouTube/SoundCloud) at the same time.

Everyone can queue a new music to the shared playlist.

How to use
----------

	git clone git://github.com/motemen/polka.git
	npm install
	PORT=3000 node app

And open

 * Queue page: http://<var>your address</var>:3000/queue
 * Player page: http://<var>your address</var>:3000/play

Tell these URLs above to your friends and start enjoying music.

How this works
--------------

On playing page (`/play`), polka **just embeds** video/music that hosting webservice provides. On ending, playing automatically proceeds to the next track.

The timing of the "play end" is detected by one client, called "master" (usually the first one opened `/play`). The other clients (called "echo") follows what master plays.

If something is wrong with the master client and cannot continue to next track, open `/admin` page and click "next" button to force to play the next track.

Supported media
---------------

Polka currently supports these webservices' media:

 * [YouTube](http://www.youtube.com/)
 * [SoundCloud](http://soundcloud.com/)

Screenshot
----------

![The queue](https://lh6.googleusercontent.com/-lbEHSKb7XaU/UHa86kvmV3I/AAAAAAAAF1o/Zw_J73tlcLk/s880/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88%EF%BC%882012-10-11+21.33.15%EF%BC%89.png)
