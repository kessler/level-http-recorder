var middleware = require('./index.js')
var bytewise = require('bytewise')

var db = require('level-hyper')('./testdb', {
	valueEncoding: 'json',
	keyEncoding: bytewise
})

var assert = require('assert')

var handlerConfig = {
	dbTTL: 1000 * 10
}

describe('level-http-recorder', function () {

	var handler
	var request
	var response

	it('pesists all incoming traffic data to leveldb', function (done) {
		this.timeout(10000)

		function next(err) {
			if (err) {
				return done(err)
			}

			assert.strictEqual(response.statusCode, 200, 'expected 200 response code in response')
			db.get(request._levelHttpRecorderId, verify)
		}
		
		handler(request, response, next)

		function verify(err, data) {
			// does not gets saved
			delete request._levelHttpRecorderId
			assert.deepEqual(data, request, 'request not equal to data')
			done()
		}
	})

	it('and invokes the modification function', function (done) {
		this.timeout(10000)

		handler = middleware(db, handlerConfig, function (data, _request) {
			assert.strictEqual(_request, request)
			assert.deepEqual(data, {"httpVersion":"1.0","headers":{"a":1},"url":"abc://d.g.f","ip":"1.2.3.4", "method": "get"})
			done()
		})
		
		handler(request, response, function () {	})
	})

	it('and writes post data', function (done) {
		this.timeout(10000)

		request.body = 'abcd123'

		var theId

		function next(err) {
			if (err) {
				return done(err)
			}

			theId = request._levelHttpRecorderId
			assert.strictEqual(response.statusCode, 200)
			db.get(request._levelHttpRecorderId, verify1)
		}
		
		handler(request, response, next)

		function verify1(err, data) {
			if (err) {
				done(err)
			}

			assert.deepEqual(data.body, request.body)
			done()
		}
	})

	it('and does not write post data when using option writeBody = false', function (done) {
		this.timeout(10000)

		handler = middleware(db, { writeBody: false, dbTTL: 1000 * 10 })

		request.body = 'abcd123'

		var theId

		function next(err) {
			if (err) {
				return done(err)
			}

			theId = request._levelHttpRecorderId
			assert.strictEqual(response.statusCode, 200)
			db.get(request._levelHttpRecorderId, verify1)
		}
		
		handler(request, response, next)

		function verify1(err, data) {
			if (err)
				done(err)

			assert(!data.body)
			done()
		}
	})

	it('using option writeBody = false in the config can still be overidden in the request by using request.writeBody=true', function (done) {
		this.timeout(10000)

		handler = middleware(db, { writeBody: false, dbTTL: 1000 * 10 })

		request.writeBody = true
		request.body = 'abcd123'

		var theId

		function next(err) {
			if (err) {
				return done(err)
			}

			theId = request._levelHttpRecorderId
			assert.strictEqual(response.statusCode, 200)
			db.get(request._levelHttpRecorderId, verify1)
		}
		
		handler(request, response, next)

		function verify1(err, data) {
			if (err)
				done(err)
			
			assert.strictEqual(data.body, request.body)
			done()
		}
	})

	beforeEach(function () {
		handler = middleware(db, handlerConfig)

		response = { statusCode: 200 }

		request = {
			ip: '1.2.3.4',
			headers: {
				a: 1
			},
			httpVersion: '1.0',
			url: 'abc://d.g.f',
			method: 'get'
		}
	})

	after(function () {
		db.close()
	})
})