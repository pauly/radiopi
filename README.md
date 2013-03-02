# radiopi

Builds and plays a queue of mp3s, interspersed with jingles. For an in car pi based radio station.

A work very much in progress!

Requires mpg321

## the plan

  * Queue builder
    * Queue builder runs every minute, checking for requests and building a queue.
    * If a request has come in, add it to the queue.
    * If a priority request has come in, add it to the front of the queue.
    * If a jingle is due, add it to the front of the queue.
    * If a priority jingle is due, stop the current song and play it now.
    * If less than n songs in the queue, add a song to the queue.
    * Check the GPS, if a location based song is appropriate add it to the front of the queue.

  * Player
    * Runs in an endless loop
    * Pick the track from the front of the queue, play it, remove it from the queue

## history

  * v 0.0.1 first build

## things to remember

  Force the analog output of the pi; amixer cset numid=3 1
  Mount a drive on the network; sudo mount -t cifs //LINKSTATION/share /mnt -o ip=192.168.1.65

## links
  http://jeffskinnerbox.wordpress.com/2012/11/15/getting-audio-out-working-on-the-raspberry-pi/
  http://www.mike-worth.com/2012/02/23/playing-youtube-music-from-the-command-line/
