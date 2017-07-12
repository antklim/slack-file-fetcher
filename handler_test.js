// TODO: Add callSns test

process.env.ACCESS_TOKEN = '123'
process.env.BUCKET = 'testBucket'

const assert = require('assert')
const AWS = require('aws-sdk')
const request = require('request')
const sinon = require('sinon')
const handler = require('./handler')

describe('Slack file fetcher', function() {

  const sns = new AWS.SNS()
  const stepfunctions = new AWS.StepFunctions()
  const aws = {sns, stepfunctions}

  let sandbox = null

  beforeEach(() => sandbox = sinon.sandbox.create())
  afterEach(() => sandbox.restore())

  describe('main', () => {
    it('should prepare options for file fetcher and fetch file', (done) => {
      const accessTokenSpy = sandbox.spy(handler, '_getAccessToken')
      const fetchOptionsSpy = sandbox.spy(handler, '_getFileFetchOptions')

      const fetchFileSpy = sandbox.spy(handler, '_fetchFile')
      const saveFileSpy = sandbox.spy(handler, '_saveFile')

      const getStub = sandbox.stub(request, 'get')
      getStub.yields()

      const saveToS3Stub = sandbox.stub(handler, '_saveToS3')
      saveToS3Stub.yields(null, {file: 'test/file'})

      handler.main({eventId: 'testEvent', url: 'https://test.com', msg: 'testMsg'}, aws, (err, data) => {
        assert.ifError(err)
        assert(accessTokenSpy.calledOnce)

        assert(fetchOptionsSpy.calledOnce)
        assert.deepEqual(fetchOptionsSpy.args[0][0], 'https://test.com')
        assert.deepEqual(fetchOptionsSpy.args[0][1], 'test')

        assert(fetchFileSpy.calledOnce)
        assert.deepEqual(fetchFileSpy.args[0][0], fetchOptionsSpy.returnValues[0])

        assert(getStub.calledOnce)
        assert.deepEqual(getStub.args[0][0], fetchOptionsSpy.returnValues[0])

        assert(saveFileSpy.calledOnce)
        assert(saveToS3Stub.calledOnce)

        assert.equal(data.eventId, 'testEvent')
        assert.equal(data.url, 'https://test.com')
        assert.equal(data.msg, 'testMsg')
        assert.equal(data.file, 'test/file')

        done()
      })
    })
  })

  describe('_getAccessToken', () => {
    it('should return access token by environment', () => {
      assert.equal(handler._getAccessToken('test'), 'test')
      assert.equal(handler._getAccessToken('prod'), '123')
      assert.equal(handler._getAccessToken('dev'), '123')
    })
  })

  describe('_getFileFetchOptions', () => {
    it('should prepare file fetcher options', () => {
      const expectedOptions = {
        url: 'https://test.com',
        encoding: null,
        headers: {
          'Authorization': `Bearer kraken`
        }
      }
      const actualOptions = handler._getFileFetchOptions('https://test.com', 'kraken')
      assert.deepEqual(actualOptions, expectedOptions)
    })
  })

  describe('_fetchFile', () => {
    it('should return response body when request success', (done) => {
      const stub = sandbox.stub(request, 'get')
      stub.yields(null, {response: true}, 'body')

      handler._fetchFile({}, (err, res, body) => {
        assert.ifError(err)
        assert(res)
        assert(body)
        assert.deepEqual(res, {response: true})
        assert.deepEqual(body, 'body')
        done()
      })
    })

    it('should return error callback when request failed', (done) => {
      const stub = sandbox.stub(request, 'get')
      stub.yields(new Error('Fetch failed'))

      handler._fetchFile({}, (err, body) => {
        assert(err)
        assert.ifError(body)
        assert.equal(err.message, 'Fetch failed')
        done()
      })
    })
  })

  describe('_saveFile', () => {
    it.skip('should save file to file system when NODE_ENV is `dev`', (done) => {
      const env = process.env.NODE_ENV
      process.env.NODE_ENV = 'dev'

      const saveToFsStub = sandbox.stub(handler, '_saveToFs')
      const saveToS3Stub = sandbox.stub(handler, '_saveToS3')
      saveToFsStub.yields()
      saveToS3Stub.yields()

      handler._saveFile(aws, {response: true}, 'body', (err) => {
        assert.ifError(err)

        assert(saveToFsStub.calledOnce)
        assert.equal(saveToFsStub.args[0][0], 'body')

        assert(saveToS3Stub.notCalled)
        process.env.NODE_ENV = env
        done()
      })
    })

    it('should save file to S3 by default', (done) => {
      const saveToFsStub = sandbox.stub(handler, '_saveToFs')
      const saveToS3Stub = sandbox.stub(handler, '_saveToS3')
      saveToFsStub.yields()
      saveToS3Stub.yields()

      handler._saveFile(aws, {response: true}, 'body', (err) => {
        assert.ifError(err)
        assert(saveToFsStub.notCalled)
        assert(saveToS3Stub.calledOnce)
        assert.equal(saveToS3Stub.args[0][1], 'testBucket')
        assert.equal(saveToS3Stub.args[0][2], 'body')
        done()
      })
    })

    it('should return error callback when file save failed', (done) => {
      const saveToFsStub = sandbox.stub(handler, '_saveToFs')
      const saveToS3Stub = sandbox.stub(handler, '_saveToS3')
      saveToFsStub.yields()
      saveToS3Stub.yields(new Error('S3 save failed'))

      handler._saveFile(aws, {response: true}, 'body', (err) => {
        assert(err)
        // TODO: it should be a text message
        // will be fixed when S3 integration finished
        assert.deepEqual(err, new Error('S3 save failed'))
        done()
      })
    })
  })
})
