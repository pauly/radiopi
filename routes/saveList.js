const mpc = require('../lib/mpc')

module.exports = {
  method: 'post',
  handler(req, res, next) {
    const name = mpc.clean(req.body.name)
    mpc.exec('mpc lsplaylists', (err, response) => {
      // console.log('is', name, 'in', response, '?')
      var cmd = req.body.tracks.map(track => 'mpc add "' + track + '"') // @todo well insecure
      cmd.unshift('mpc save ' + name)
      if (response.indexOf(name) === -1) {
        console.log(name, 'is a new playlist so we are ok... save', req.body.tracks)
      } else {
        console.log(name, 'already exists, so load it, remove it, and add', req.body.tracks)
        // in reverse order
        cmd.unshift('mpc rm ' + name)
        // cmd.unshift('mpc load ' + name)
      }
      mpc.exec(cmd.join('; '), (err, response) => {
        if (err) return res.json(mpc.empty(err))
        res.json(req.body.tracks)
      })
    })
  }
}
