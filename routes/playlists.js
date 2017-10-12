const mpc = require('../lib/mpc')

module.exports = {
  handler: mpc.handler.bind(this, 'mpc lsplaylists | sort')
}
