const mpc = require('../lib/mpc')

module.exports = {
  method: 'post',
  handler(req, res, next) {
    mpc.handler('mpc save ' + mpc.clean(req.body.name), req, res, next)
  }
}
