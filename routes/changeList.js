const mpc = require('../lib/mpc')

module.exports = {
  handler(req, res, next) {
    var cmd =  'mpc clear; mpc load "' + mpc.clean(req.query.v) + '"; mpc playlist'
    mpc.handler(cmd, req, res, next)
  }
}
