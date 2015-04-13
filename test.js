var middleware = require('./index.js')
var db = require('levelup')('./testdb')

var assert = require('assert')

var handlerConfig = {
	dbTTL: 1000 * 10
}

var log = {
	error: function(err) {
		console.log(err)
	}
}

describe('level-http-recorder writes requests to leveldb', function () {

	var handler
	var request
	var response

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
		console.log('closing db')
		db.close()
	})

	it('writes a request', function (done) {
		this.timeout(10000)

		function next(err) {
			console.timeEnd('request')

			if (err) {
				return done(err)
			}

			assert.strictEqual(response.statusCode, 200)
			db.get(request.id, verify, { valueEncoding: 'json'} )
		}

		console.time('request')

		handler(request, response, next)

		function verify(err, data) {
			// does not gets saved
			delete request.id
			assert.deepEqual(JSON.parse(data), request)
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

		console.time('request')

		handler(request, response, function () {

		})
	})

	it('writes post data', function (done) {
		this.timeout(10000)

		request.body = 'abcd123'

		var theId

		function next(err) {
			console.timeEnd('request')

			if (err) {
				return done(err)
			}

			theId = request.id
			assert.strictEqual(response.statusCode, 200)
			db.get(request.id, verify1, { valueEncoding: 'json'} )
		}

		console.time('request')

		handler(request, response, next)

		function verify1(err, data) {
			if (err)
				done(err.message)

			db.get(theId + '-body', verify2)
		}

		function verify2(err, data) {
			if (err)
				done(err.message)

			assert.deepEqual(data, request.body)
			done()
		}
	})

	it('but does not write post data when using option writeBody = false', function (done) {
		this.timeout(10000)

		handler = middleware(db, { writeBody: false, dbTTL: 1000 * 10 }, log)

		request.body = 'abcd123'

		var theId

		function next(err) {
			console.timeEnd('request')

			if (err) {
				return done(err)
			}

			theId = request.id
			assert.strictEqual(response.statusCode, 200)
			db.get(request.id, verify1, { valueEncoding: 'json'} )
		}

		console.time('request')

		handler(request, response, next)

		function verify1(err, data) {
			if (err)
				done(err)

			db.get(theId + '-body', verify2)
		}

		function verify2(err, data) {
			if (err) {
				return done()
			}

			done(new Error('should not happen'))
		}
	})

	it('using option writeBody = false in the config can still be overidden in the request by using request.writeBody=true', function (done) {
		this.timeout(10000)

		handler = middleware(db, { writeBody: false, dbTTL: 1000 * 10 }, log)

		request.writeBody = true
		request.body = 'abcd123'

		var theId

		function next(err) {
			console.timeEnd('request')

			if (err) {
				return done(err)
			}

			theId = request.id
			assert.strictEqual(response.statusCode, 200)
			db.get(request.id, verify1, { valueEncoding: 'json'} )
		}

		console.time('request')

		handler(request, response, next)

		function verify1(err, data) {
			if (err)
				done(err)

			db.get(theId + '-body', verify2)
		}

		function verify2(err, data) {
			if (err) {
				return done(err)
			}

			assert.strictEqual(data, 'abcd123')
			done()
		}
	})

})