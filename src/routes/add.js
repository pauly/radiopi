const lib = require('../lib')

module.exports = {
  handler(req, res, next) {
    var track = req.query.track.replace(/"/g, '')
    const playlist = lib.clean(req.query.playlist)
    if (!track) return res.redirect('/next')
    // first try just inserting this as if it were a uri, hopefully it is
    const cmd = 'mpc insert "' + track + '" && mpc rm "' + playlist + '" && mpc save "' + playlist + '" && mpc playlist'
    lib.exec(cmd, (err, stdout) => {
      if (err) {
        // if we got an error search for it
        track = lib.clean(req.query.track, '.*')
        if (!track) return res.redirect('/next')
        const cmd = 'mpc listall | grep -iE "' + track + '" | head -1 | mpc add && mpc rm "' + playlist + '" && mpc save "' + playlist + '" && mpc playlist'
        return lib.handler(cmd, req, res, next)
      }
      // res.json(lib.empty())
      var tracks = stdout.split('\n')
      const data = lib.processResults(tracks)
      res.json(data)
    })
  }
}
