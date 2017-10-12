const mpc = require('../lib/mpc')

module.exports = {
  handler(req, res, next) {
    var cmd = 'mpc search '
    const artist = mpc.clean(req.query.artist)
    const title = mpc.clean(req.query.title)
    const album = mpc.clean(req.query.album)
    if (!artist && !title && !artist) return res.redirect('/next')
    if (artist) cmd += ' artist "' + artist + '"'
    if (album) cmd += ' album "' + album + '"'
    if (title) cmd += ' title "' + title + '"'
    // arbitrary limit of 20 for searching
    // _incoming maybe duplicates @todo sort this
    cmd += ' | grep -v _incoming | head -20'
    mpc.handler(cmd, req, res, next)
  }
}
