const mpc = require('../lib/mpc')

module.exports = {
  handler(req, res, next) {
    mpc.handler('mpc rm ' + mpc.clean(req.query.v), req, res, next)
  }
}
