const mpd = require('mpd')
const config = {
  port: 6600,
  host: 'localhost',
}
const debug = require('debug')('radiopi:server')
const chalk = require('chalk')
const childProcess = require('child_process')
const jsmediatags = require('jsmediatags')

const lib = module.exports = {
  _mpc: null,
  _io: null,
  io () {
    if (!this._io) throw new Error('io not set did you mpc(io)?')
    return this._io
  },
  mpc (io) {
    if (this._mpc) return this._mpc
    if (io) this._io = io
    const mpc = mpd.connect(config)
    mpc.on('system', name => {
      debug('mpc update', name)
      // io.emit('status', name)
    })
    mpc.on('system-player', () => {
      mpc.sendCommand(mpd.cmd('status', []), (err, msg) => {
        if (err || !msg) return console.error(err || 'no msg')
        // if (msg.state !== 'play') return debug(msg)
        this.currentsong()
      })
    })
    io.on('connect', socket => {
      socket.on('next', () => {
        this.next()
      })
      socket.on('rate', id => {
        this.rate(id)
      })
      socket.on('hate', id => {
        this.hate(id)
      })
      /* socket.on('search', (album, artist) => {
        debug('socket got search', album, artist)
        this.search(album, artist)
      }), */
      io.on('connection', socket => {
        debug('a user connected so show the current track?')
        try {
          this.currentsong()
        } catch (e) {
          debug('maybe not', e)
        }
      })
      // socket.on('play', track => this.play(track))
    })
    this._mpc = mpc
    return mpc
  },
  currentsong () {
    this.mpc().sendCommand(mpd.cmd('currentsong', []), (err, msg) => {
      if (err) return console.error('err:', err)
      msg.split('\n').forEach(line => {
        var match = /([\w\-]+): (.*)/.exec(line)
        if (!match) return
        this.io().emit(match[1].toLowerCase(), match[2])
        if (/file/i.test(match[1])) {
          lib.tags('/mnt/share/' + match[2], (err, tags) => {
            if (err || !tags || !tags.tags) {
              return console.error('no tags')
            }
            debug('')
            Object.keys(tags.tags).forEach(tag => {
              var data = tags.tags[tag].data
              if (!data) return
              if (typeof data !== 'string') return
              if (tags.tags[tag].description) data += ' ' + chalk.gray('(' + tags.tags[tag].description + ')')
              debug(chalk.gray(tag), data)
            })
          })
        }
      })
    })
  },
  /* search (artist, title) {
    var params = []
    if (artist) params.push('artist', artist)
    if (title) params.push('title', title)
    this.mpc().sendCommand(mpd.cmd('search', params), (err, result) => {
      if (err) return console.error('err:', err)
      debug('search got', result)
      this.io().emit('tracks', result)
    })
  }, */
  /* play (track) {
    console.log('play(' + track + ')')
    this.mpc().sendCommand(mpd.cmd('play', [track]), err => {
      if (err) return console.error('err:', err)
      this.currentsong()
    })
  }, */
  next () {
    this.mpc().sendCommand(mpd.cmd('next', []), err => {
      if (err) return console.error('err:', err)
      this.currentsong()
    })
  },
  rate (id) {
    debug('👍', id)
  },
  hate (id) {
    debug('👎', id)
  },
  tags (file, callback) {
    jsmediatags.read(file, {
      onSuccess (tag) {
        callback(null, tag)
      },
      onError (error) {
        callback(error)
      }
    })
  },
  clean (string, replace) {
    if (!string) return ''
    return ('' + string).replace(/\W/g, replace || '')
  },
  empty (error) {
    return { error, tracks: [] }
  },
  exec(cmd, callback) {
    this.io().emit('console', cmd)
    childProcess.exec(cmd, (error, stdout, stderr) => {
      debug('exec cmd:', cmd, 'stdout:', JSON.stringify(stdout).substr(0, 100))
      if (error) this.io().emit('error', error)
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
    }, lib.empty())
  },
  handler(cmd, req, res, next) {
    console.log('handler', cmd)
    lib.exec(cmd, (error, stdout) => {
      if (error) return res.json(lib.empty(error))
      var tracks = stdout.split('\n')
      const data = lib.processResults(tracks)
      res.json(data)
    })
  }
}
