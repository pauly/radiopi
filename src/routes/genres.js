const lib = require('../lib')

module.exports = {
  handler: lib.handler.bind(this, 'mpc list genre | sort') // will return results as 'tracks' @todo
}
