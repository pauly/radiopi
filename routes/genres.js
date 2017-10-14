const mpc = require('../lib/mpc')

module.exports = {
  handler: mpc.handler.bind(this, 'mpc list genre | sort') // will return results as 'tracks' @todo
}
