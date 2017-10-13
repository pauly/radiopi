var express = require('express')
var path = require('path')
// var favicon = require('serve-favicon')
var logger = require('morgan')
// var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')

var app = module.exports = express()

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
// app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'dist')))

const dirname = path.resolve(__dirname, 'routes')
const filter = /(.+)\.js$/
const routes = require('require-all')({ dirname, filter })
for (var key in routes) {
  var route = routes[key]
  app[route.method || 'all'](route.path || ('/' + key), route.handler)
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handler
app.use(function(error, req, res, next) {
  res.status(error.status || 500)
  if (req.app.get('env') === 'development') {
    return res.json({ error })
  }
  res.json({ error: error.message })
})
