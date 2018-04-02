const lib = require('../lib')

module.exports = {
  handler(req, res, next) {
    var track = req.query.track.replace(/"/g, '')
    if (!track) return res.redirect('/next')
    // first try just inserting this as if it were a uri, hopefully it is
    const cmd = 'mpc insert "' + track + '"'
    lib.exec(cmd, (err, stdout) => {
      if (err) {
        // if we got an error search for it
        track = lib.clean(req.query.track, '.*')
        if (!track) return res.redirect('/next')
        const cmd = 'mpc listall | grep -iE "' + track + '" | head -1 | mpc add'
        return lib.handler(cmd, req, res, next)
      }
      res.json(lib.empty())
    })
  }
}
