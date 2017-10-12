const mpc = require('../lib/mpc')

module.exports = {
  handler(req, res, next) {
    mpc.handler('mpc next; mpc', req, res, next)
  }
}
