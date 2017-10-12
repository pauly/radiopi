const mpc = require('../lib/mpc')

module.exports = {
  handler(req, res, next) {
    console.log('@todo instead of clearing, only list playist contents, only clear when playing!')
    // var cmd = 'mpc clear; mpc load "' + mpc.clean(req.query.v) + '"; mpc playlist'
    var cmd = 'mpc playlist "' + mpc.clean(req.query.v) + '"'
    mpc.handler(cmd, req, res, next)
  }
}
