# radiopi

> A Vue.js project

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report

# run unit tests
npm run unit

# run e2e tests
npm run e2e

# run all tests
npm test
```

For a detailed explanation on how things work, check out the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).

## things to remember

  * Force the analog output of the pi; amixer cset numid=3 1
  * Mount a drive on the network; sudo mount -t cifs //LINKSTATION/share /mnt -o ip=192.168.1.65

## links
  * http://jeffskinnerbox.wordpress.com/2012/11/15/getting-audio-out-working-on-the-raspberry-pi/
  * http://www.mike-worth.com/2012/02/23/playing-youtube-music-from-the-command-line/
  * https://github.com/kenchy/keene-usb-audio
  * http://www.raspberrypi.org/phpBB3/viewtopic.php?f=45&t=26388&p=238791&hilit=keene#p238791
  * http://www.include.gr/debian/mpg321/

