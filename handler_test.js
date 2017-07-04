const assert = require('assert')
const request = require('request')
const sinon = require('sinon')
const handler = require('./handler')

describe('Slack file fetcher', function() {

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
      getStub.callsArg(1)

      handler.main({url: 'https://test.com'}, (err) => {
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

        done()
      })
    })
  })

  describe('_getAccessToken', () => {
    before(() => process.env.ACCESS_TOKEN = '123')
    after(() => process.env.ACCESS_TOKEN = '')

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
      stub.yields(null, {response: true}, {body: 'yes'})

      handler._fetchFile({}, (err, res, body) => {
        assert.ifError(err)
        assert(res)
        assert(body)
        assert.deepEqual(res, {response: true})
        assert.deepEqual(body, {body: 'yes'})
        done()
      })
    })

    it('should return error callback when request failed', (done) => {
      const stub = sandbox.stub(request, 'get')
      stub.yields(new Error('Fetch failed'), null, null)

      handler._fetchFile({}, (err, body) => {
        assert(err)
        assert.ifError(body)
        assert.equal(err, 'Fetch failed')
        done()
      })
    })
  })

  describe('_saveFile', () => {
    it('should save file to file system when NODE_ENV is `test`')
    it('should save file to S3 by default')
    it('should return error callback when file save failed')
  })
})
