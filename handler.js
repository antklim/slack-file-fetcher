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
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})

exports._fetchFile = (options, cb) => {
  request.get(options, (err, res, body) => {
    if (err) {
      error(err)
      cb(err.message)
      return
    }

    cb(null, body)
  })
}

exports._saveFile = (data, cb) => {
  debug(data)
  cb()
}
