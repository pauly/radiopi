const lib = require('../lib')

module.exports = {
  method: 'delete',
  handler(req, res, next) {
    console.log('deleting, got data', req.data, 'params', req.params, 'query', req.query)
    const track = req.query.track
    // we know the playlist must be the current one
    // but we need the name so we can save it again
    const playlist = lib.clean(req.query.playlist)
    if (!track || !playlist) return res.json(lib.empty('require track and playlist'))
    lib.exec('mpc playlist', (err, stdout) => {
      var tracks = stdout.split('\n')
      console.log('is', track, 'in', tracks.length, '?')
      const index = tracks.indexOf(track)
      if (index === -1) {
        console.log('did not find track in playlist')
        return res.json(lib.empty('did not find ' + track + ' in playlist'))
      }
      console.log(track, 'exists, so remove', playlist, 'and save again')
      cmd = [
        'mpc del ' + (index + 1),
        'mpc rm ' + playlist,
        'mpc save ' + playlist
      ]
      console.log(cmd)
      lib.exec(cmd.join(' && '), err => {
        res.json(lib.empty(err))
      })
    })
  }
}
