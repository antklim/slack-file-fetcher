'use strict'

const handler = require('./handler')

exports.handler = (event, context, cb) => {

  handler.main(event, cb)
  return

}

if (process.env.NODE_ENV === 'test') {
  const url = process.argv[2]

  console.log(`Sending request to: ${url}`)

  exports.handler({url}, null, (err, result) => {
    console.error(`Error: ${err}`)
    console.log(`Results: ${result}`)
  })
}
