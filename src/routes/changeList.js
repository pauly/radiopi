const lib = require('../lib')

module.exports = {
  handler(req, res, next) {
    var cmd = 'mpc playlist "' + lib.clean(req.query.v) + '"'
    console.log(cmd)
    lib.handler(cmd, req, res, next)
  }
}
