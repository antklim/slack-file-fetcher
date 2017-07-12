'use strict'

const async = require('async')
const request = require('request')

/**
 * DEBUG (optional)     - allows debug information logging
 * ERROR (optional)     - allows error information logging
 * NODE_ENV             - NodeJS (lambda) environment prod|dev|test
 * ACCESS_TOKEN         - Access token generated by Slack to grant permission to fetch file
 * BUCKET               - AWS S3 bucket to store file and metadata
 * SLACK_INTEGRATOR_SNS - AWS SNS topic name to send Slack message processing information
 */
const {DEBUG, ERROR, NODE_ENV, ACCESS_TOKEN, BUCKET, SLACK_INTEGRATOR_SNS} = process.env

const debug = (...args) => (DEBUG) ? console.log.apply(null, args) : null
const error = (...args) => (ERROR) ? console.error.apply(null, args) : null

// data: {eventId, channel, url, msg}
exports.main = (data, aws, cb) => {
  debug(`Event data:\n${JSON.stringify(data, null, 2)}`)

  const token = exports._getAccessToken(NODE_ENV)
  const options = exports._getFileFetchOptions(data.url, token)

  async.waterfall([
    (cb) => exports._fetchFile(options, cb),
    (res, body, cb) => exports._saveFile(aws, res, body, cb)
  ], (err, file) => {
    if (!err) {
      cb(null, Object.assign({}, data, file))
      return
    }

    error(err)

    const {eventId, channel} = data

    // Sending file fetch error notification to SNS
    exports._callSns(aws.sns, SLACK_INTEGRATOR_SNS, {eventId, channel, err: err.message}, (e) => {
      if (e) {
        error(`Notification publish to ${SLACK_INTEGRATOR_SNS} failed`)
        error(e)
      } else {
        debug(`Notification successfully published to ${SLACK_INTEGRATOR_SNS}`)
      }

      cb(err)
    })
  })
}

exports._getAccessToken = (env) => (env === 'test') ? 'test' : ACCESS_TOKEN

exports._getFileFetchOptions = (url, accessToken) => ({
  url,
  encoding: null, // `null` will return body as a buffer
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})

exports._fetchFile = (options, cb) => {
  debug(`Fetching file with options: ${JSON.stringify(options, null, 2)}`)

  request.get(options, (err, res, body) => {
    if (err) {
      cb(err)
      return
    }

    cb(null, res, body)
  })
}

exports._saveFile = (aws, res, body, cb) => {
  switch (NODE_ENV) {
    case 'dev':
      exports._saveToFs(body, cb)
      break
    default:
      exports._saveToS3(aws.s3, BUCKET, body, cb)
      break
  }
}

exports._saveToFs = (data, cb) => {
  const fs = require('fs')
  const path = require('path')
  const fileName = path.join(__dirname, `${Date.now()}.jpg`)

  fs.writeFile(fileName, data, (err) => {
    if (err) {
      cb(err)
      return
    }

    debug(`Saved to: ${fileName}`)
    cb(null, {file: fileName})
  })
}

exports._saveToS3 = (s3, bucket, data, cb) => {
  const options = {
    Body: data,
    Bucket: bucket,
    Key: `${Date.now()}.jpg`
   }

   debug(`Saving to: ${options.Bucket}/${options.Key}`)

   s3.putObject(options, (err, data) => {
     if (err) {
       cb(err)
       return
     }

     debug(`Saved to: ${options.Bucket}/${options.Key}`)
     cb(null, {file: `${options.Bucket}/${options.Key}`})
   })
}

exports._callSns = (sns, topic, notification, cb) => {
  debug(`Sending ${JSON.stringify(notification, null, 2)} to topic: ${topic}`)

  const params = {
    Message: JSON.stringify(notification),
    TopicArn: topic
  }

  sns.publish(params, cb)
}
