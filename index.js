'use strict'

const handler = require('./handler')

exports.handler = (event, context, cb) => {

  handler.main(event, cb)
  return

}
