var express = require('express')
var path = require('path')
var favicon = require('serve-favicon')
var logger = require('morgan')
// var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var debug = require('debug')('radiopi:server');
var http = require('http');
var app = express()
var port = process.env.PORT || 8080
app.set('port', port)
var server = http.createServer(app);
server.listen(port);
var lib = require('./lib')

server.on('error', onError);
server.on('listening', onListening);

app.use(favicon(path.join(__dirname, 'assets', 'favicon.ico')))
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
// app.use(cookieParser())
app.use(express.static(path.join(__dirname, '../dist')))

var io = require('socket.io')(server)

var mpc = lib.mpc(io)

app.use(function(req, res, next) {
  req.mpc = mpc
  next()
})

// put socket.io on each route
app.use(function(req, res, next) {
  req.io = io
  next()
})

const dirname = path.resolve(__dirname, 'routes')
const filter = /(.+)\.js$/
const routes = require('require-all')({ dirname, filter })
for (var key in routes) {
  var route = routes[key]
  app[route.method || 'all'](route.path || ('/' + key), route.handler)
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var error = new Error('Not Found')
  error.status = 404
  next(error)
})

// error handler
app.use(function(error, req, res, next) {
  console.error(error)
  res.status(error.status || 500)
  if (req.app.get('env') !== 'production') {
    return res.json({ error })
  }
  res.json({ error: error.message })
})

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}
