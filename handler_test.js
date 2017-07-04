const assert = require('assert')
const request = require('request')
const sinon = require('sinon')
const handler = require('./handler')

describe('Slack file fetcher', function() {

  let sandbox = null

  beforeEach(() => {
    sandbox = sinon.sandbox.create()
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('main', () => {
    it('should prepare options for file fetcher and fetch file', (done) => {
      const stub = sandbox.stub(request, 'get')
      const fetchOptionsSpy = sandbox.spy(handler, '_getFileFetchOptions')
      const fetchHandlerSpy = sandbox.spy(handler, '_fileFetchHandler')
      stub.callsArg(1)

      handler.main({url: 'https://test.com'}, (err) => {
        assert.ifError(err)
        assert(stub.calledOnce)
        assert(fetchOptionsSpy.calledOnce)
        assert(fetchHandlerSpy.calledOnce)
        assert.deepEqual(fetchOptionsSpy.args[0][0], 'https://test.com')
        assert.deepEqual(fetchOptionsSpy.args[0][1], 'test')
        assert.deepEqual(stub.args[0][0], fetchOptionsSpy.returnValues[0])
        done()
      })
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

  describe('_fileFetchHandler', () => {
    it('should return response body when request success', (done) => {
      handler._fileFetchHandler(null, {response: true}, {body: 'yes'}, (err, body) => {
        assert.ifError(err)
        assert(body)
        assert.deepEqual(body, {body: 'yes'})
        done()
      })
    })

    it('should return error callback when request failed', (done) => {
      handler._fileFetchHandler(new Error('Fetch failed'), null, null, (err, body) => {
        assert(err)
        assert.ifError(body)
        assert.equal(err, 'Fetch failed')
        done()
      })
    })
  })
})
