const mpc = require('../lib/mpc')

module.exports = {
  handler(req, res, next) {
    const v = mpc.wildcard(req.query.v)
    if (!v) return res.redirect('/next')
    const add = 'mpc listall | grep -iE "' + v + '" | head -1 | mpc add'
    const play = 'mpc play $(mpc playlist | cat -n | grep -iE "' + v + '" | cut -f1 | head -1)'
    const cmd = [add, play].join(' && ')
    mpc.handler(cmd, req, res, next)
  }
}
