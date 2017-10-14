const mpc = require('../lib/mpc')

module.exports = {
  method: 'delete',
  handler(req, res, next) {
    console.log('deeting, got data', req.data, 'params', req.params, 'query', req.query)
    const track = req.query.track
    // we know the playlist must be the current one
    // but we need the name so we can save it again
    const playlist = mpc.clean(req.query.playlist)
    if (!track || !playlist) return res.json(mpc.empty('require track and playlist'))
    mpc.exec('mpc playlist', (err, stdout) => {
      var tracks = stdout.split('\n')
      console.log('is', track, 'in', tracks, '?')
      const index = tracks.indexOf(track)
      if (index === -1) {
        console.log('did not find track in playlist')
        return res.json(mpc.empty('did not find ' + track + ' in playlist'))
      }
      console.log(track, 'exists, so remove', playlist, 'and save again')
      cmd = [
        'mpc del ' + (index + 1),
        'mpc rm ' + playlist,
        'mpc save ' + playlist
      ]
      mpc.exec(cmd.join('; '), err => {
        if (err) return res.json(mpc.empty(err))
        res.json(mpc.empty())
      })
    })
  }
}
