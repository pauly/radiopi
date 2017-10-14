const mpc = require('../lib/mpc')

module.exports = {
  handler(req, res, next) {
    var v = req.query.v.replace(/"/g, '')
    if (!v) return res.redirect('/next')
    const cmd = 'mpc crossfade 2; mpc load _now_playing; mpc insert "' + v + '"; mpc next; mpc crossfade 1'
    mpc.exec(cmd, (err, stdout) => {
      if (err) {
        console.log(cmd, 'got', err, stdout)
        v = mpc.clean(req.query.v, '.*')
        if (!v) return res.redirect('/next')
        const add = 'mpc listall | grep -iE "' + v + '" | head -1 | mpc add'
        const play = 'mpc play $(mpc playlist | cat -n | grep -iE "' + v + '" | cut -f1 | head -1)'
        const cmd = [add, play].join(' && ')
        return mpc.handler(cmd, req, res, next)
      }
      res.redirect('/mpc')
    })
  }
}
