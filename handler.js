const async = require('async')
const request = require('request')

const debug = (...args) => (process.env.DEBUG) ? console.log.apply(null, args) : null
const error = (...args) => (process.env.ERROR) ? console.error.apply(null, args) : null

exports.main = (data, cb) => {
  debug(`Event data:\n${JSON.stringify(data, null, 2)}`)

  const token = exports._getAccessToken(process.env.NODE_ENV)
  const options = exports._getFileFetchOptions(data.url, token)

  async.waterfall([
    async.constant(options),
    exports._fetchFile,
    exports._saveFile
  ], cb)
}

exports._getAccessToken = (env) => (env === 'test') ? 'test' : process.env.ACCESS_TOKEN

exports._getFileFetchOptions = (url, accessToken) => ({
  url,
  encoding: 'binary',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})

exports._fetchFile = (options, cb) => {
  debug(`Fetching file with options: ${JSON.stringify(options, null, 2)}`)

  request.get(options, (err, res, body) => {
    if (err) {
      error(err)
      cb(err.message)
      return
    }

    cb(null, res, body)
  })
}

exports._saveFile = (res, body, cb) => {
  switch (process.env.NODE_ENV) {
    case 'dev':
      exports._saveToFs(body, cb)
      break
    default:
      exports._saveToS3(body, cb)
      break
  }
}

exports._saveToFs = (data, cb) => {
  const fs = require('fs')
  const path = require('path')
  const fileName = path.join(__dirname, `${Date.now()}.jpg`)

  fs.writeFile(fileName, data, 'binary', (err) => {
    if (err) {
      error(err)
      cb(err.message)
      return
    }

    cb(null, `saved to ${fileName}`)
  })
}

exports._saveToS3 = (data, cb) => {
  cb(null, 'saved')
}
