const lib = require('../lib')

module.exports = {
  handler(req, res, next) {
    var cmd = 'mpc clear && mpc load "' + lib.clean(req.query.v) + '" && mpc playlist'
    lib.handler(cmd, req, res, next)
  }
}
