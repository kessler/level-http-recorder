var middleware = require('./index.js')
var db = require('levelup')('./testdb', {
	valueEncoding: 'json'
})

var assert = require('assert')

var handlerConfig = {
	dbTTL: 1000 * 10
}

var log = {
	error: function(err) {
		console.log(err)
	}
}

describe('level-http-recorder write a request to leveldb', function () {

	var handler
	var request
	var response

	it('simple', function (done) {
		this.timeout(10000)

		function next(err) {
			if (err) {
				return done(err)
			}

			assert.strictEqual(response.statusCode, 200)
			db.get(request.id, verify)
		}
		
		handler(request, response, next)

		function verify(err, data) {
			// does not gets saved
			delete request.id
			assert.deepEqual(data, request)
			done()
		}
	})

	it('and invokes the modification function', function (done) {
		this.timeout(10000)

		handler = middleware(db, handlerConfig, log, function (data, _request) {
			assert.strictEqual(_request, request)
			assert.deepEqual(data, {"httpVersion":"1.0","headers":{"a":1},"url":"abc://d.g.f","ip":"1.2.3.4", "method": "get"})
			done()
		})
		
		handler(request, response, function () {

		})
	})

	it('and writes post data', function (done) {
		this.timeout(10000)

		request.body = 'abcd123'

		var theId

		function next(err) {
			if (err) {
				return done(err)
			}

			theId = request.id
			assert.strictEqual(response.statusCode, 200)
			db.get(request.id, verify1)
		}
		
		handler(request, response, next)

		function verify1(err, data) {
			if (err) {
				done(err.message)
			}

			assert.deepEqual(data.body, request.body)
			done()
		}
	})

	it('and does not write post data when using option writeBody = false', function (done) {
		this.timeout(10000)

		handler = middleware(db, { writeBody: false, dbTTL: 1000 * 10 }, log)

		request.body = 'abcd123'

		var theId

		function next(err) {
			if (err) {
				return done(err)
			}

			theId = request.id
			assert.strictEqual(response.statusCode, 200)
			db.get(request.id, verify1)
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

		handler = middleware(db, { writeBody: false, dbTTL: 1000 * 10 }, log)

		request.writeBody = true
		request.body = 'abcd123'

		var theId

		function next(err) {
			if (err) {
				return done(err)
			}

			theId = request.id
			assert.strictEqual(response.statusCode, 200)
			db.get(request.id, verify1)
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
		handler = middleware(db, handlerConfig, log)

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