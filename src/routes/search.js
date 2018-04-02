const lib = require('../lib')

module.exports = {
  handler(req, res, next) {
    var cmd = 'mpc search '
    const artist = lib.clean(req.query.artist, ' ')
    const title = lib.clean(req.query.title, ' ')
    const album = lib.clean(req.query.album, ' ')
    const genre = lib.clean(req.query.genre, ' ')
    if (!artist && !title && !artist && !genre) return res.redirect('/next')
    if (genre) cmd += ' genre "' + genre + '"'
    if (artist) cmd += ' artist "' + artist + '"'
    if (album) cmd += ' album "' + album + '"'
    if (title) cmd += ' title "' + title + '"'
    // arbitrary limit of 50 for searching
    // _incoming maybe duplicates @todo sort this
    cmd += ' | grep -v _incoming | head -50'
    lib.handler(cmd, req, res, next)
  }
}
