const mcp = require('../lib/mpc')

module.exports = {
  method: 'post',
  handler(req, res, next) {
    console.log('saveList', req.body)
    const name = mcp.clean(req.body.name)
    mpc.exec('mpc playlist', (error, response) => {
      console.log('current playlist is', response.split('\n'), 'should be the same')
      // mpc.exec('mpc save ' + name, (error, response) => {
        req.json(mpc.empty(error))
      // })
    })
  }
}
