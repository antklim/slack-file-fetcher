'use strict'

const aws = require('aws-sdk')
const handler = require('./handler')

const s3 = new aws.S3({apiVersion: 'latest'})
const sns = new aws.SNS()

exports.handler = (event, context, cb) => {

  handler.main(event, {s3, sns} cb)
  return

}

if (process.env.NODE_ENV === 'dev') {
  const url = process.argv[2]

  console.log(`Sending request to: ${url}`)

  exports.handler({url}, null, (err, result) => {
    console.error(`Error: ${err}`)
    console.log(`Results: ${result}`)
  })
}
