const lib = require('../lib')

module.exports = {
  handler(req, res, next) {
    var track = req.query.track.replace(/"/g, '')
    if (!track) return res.redirect('/next')
    // first try just inserting this as if it were a uri, hopefully it is

    // do not load now playing that effectively doubles the playlist
    // const cmd = 'mpc crossfade 2; mpc load _now_playing; mpc insert "' + track + '"; mpc next; mpc crossfade 1'
    const cmd = 'mpc crossfade 2; mpc insert "' + track + '"; mpc next; mpc crossfade 1'
    lib.exec(cmd, (err, stdout) => {
      if (err) {
        // if we got an error search for it
        track = lib.clean(req.query.track, '.*')
        if (!track) return res.redirect('/next')
        const add = 'mpc listall | grep -iE "' + track + '" | head -1 | mpc add'
        const play = 'mpc play $(mpc playlist | cat -n | grep -iE "' + track + '" | cut -f1 | head -1)'
        const cmd = [add, play].join(' && ')
        return lib.handler(cmd, req, res, next)
      }
      req.io.emit('console', stdout)
      res.json(lib.empty())
    })
  }
}
