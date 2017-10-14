const childProcess = require('child_process')

const mpc = module.exports = {
  clean (string, replace) {
    if (!string) return ''
    return ('' + string).replace(/\W/g, replace || '')
  },
  empty (error) {
    return { error, tracks: [] }
  },
  exec(cmd, callback) {
    childProcess.exec(cmd, (error, stdout, stderr) => {
      console.log('exec cmd:', cmd, 'stdout:', JSON.stringify(stdout).substr(0, 100))
      // if (stderr) console.warn(stderr)
      if (stderr) return callback(stderr)
      if (error) console.error(error)
      callback(error, stdout)
    })
  },
  processResults(results) {
    // Soft Cell - Say Hello Wave Goodbye
    // [playing] #1/328   4:55/5:22 (91%)
    // volume:100%   repeat: off   random: off   single: off   consume: off
    return results.reduce((data, line) => {
      if (line === '') return data
      if (/^loading:/.test(line)) { // @todo bad test probably
        data.status = line
        return data
      }
      if (/^\[/.test(line)) { // @todo bad test!
        data.status = line
        return data
      }
      if (/^volume:/.test(line)) {
        data.toggles = line.split(/  +/).map(pair => {
          const parts = ('' + pair).split(/: ?/)
          const obj = {}
          obj[parts[0]] = parts[1]
          return obj
        })
        return data
      }
      if (data.playing === line) return data
      if (!data.playing) data.playing = line
      data.tracks.push(line)
      return data
    }, mpc.empty())
  },
  handler(cmd, req, res, next) {
    mpc.exec(cmd, (error, stdout) => {
      if (error) return res.json(mpc.empty(error))
      var tracks = stdout.split('\n')
      const data = mpc.processResults(tracks)
      res.json(data)
    })
  }
}
