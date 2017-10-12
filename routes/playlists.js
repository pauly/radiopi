const mpc = require('../lib/mpc')

module.exports = {
  /* handler(req, res, next) {
    mpc.handler('mpc lsplaylists | sort', req, res, next)
  } */
  handler: mpc.handler.bind(this, 'mpc lsplaylists | sort')
}
