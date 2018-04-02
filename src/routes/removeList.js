const lib = require('../lib')

module.exports = {
  handler(req, res, next) {
    lib.handler('mpc rm ' + lib.clean(req.query.v), req, res, next)
  }
}
