const lib = require('../lib')

module.exports = {
  handler: lib.handler.bind(this, 'mpc lsplaylists | sort')
}
