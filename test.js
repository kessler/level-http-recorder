var middleware = require('./index.js')

var db = require('level-bytewise')('./testdb')

var expect = require('chai').expect

var handlerConfig = {}

describe('level-http-recorder', function() {

	var handler
	var request
	var response

	it('pesists all incoming traffic data to leveldb', function(done) {
		this.timeout(10000)

		function next(err) {
			if (err) {
				return done(err)
			}

			expect(response).to.have.property('statusCode', 200)
			db.get(request._levelHttpRecorderId, verify)
		}

		handler(request, response, next)

		function verify(err, data) {
			if (err) return done(err)
				// does not gets saved
			delete request._levelHttpRecorderId
			expect(data).to.have.property('httpVersion', '1.0')
			expect(data).to.have.property('url', 'abc://d.g.f')
			expect(data).to.have.property('ip', '1.2.3.4')
			expect(data).to.have.property('method', 'get')
			expect(data).to.have.property('timestamp')
			done()
		}
	})

	it('and invokes the modification function', function(done) {
		this.timeout(10000)

		handler = middleware(db, handlerConfig, function(data, _request) {
			expect(_request).to.eql(request)
			expect(data).to.have.property('httpVersion', '1.0')
			expect(data).to.have.property('headers')
			expect(data.headers).to.eql({ a: 1 })
			expect(data).to.have.property('url', 'abc://d.g.f')
			expect(data).to.have.property('ip', '1.2.3.4')
			expect(data).to.have.property('method', 'get')
			expect(data).to.have.property('timestamp')
			done()
		})

		handler(request, response, function() {})
	})

	it('and writes post data', function(done) {
		this.timeout(10000)

		request.body = 'abcd123'

		var theId

		function next(err) {
			if (err) {
				return done(err)
			}

			theId = request._levelHttpRecorderId
			expect(response).to.have.property('statusCode', 200)
			db.get(request._levelHttpRecorderId, verify1)
		}

		handler(request, response, next)

		function verify1(err, data) {
			if (err) {
				done(err)
			}

			expect(data).to.have.property('body')
			expect(data.body).to.eql(request.body)
			done()
		}
	})

	it('and does not write post data when using option writeBody = false', function(done) {
		this.timeout(10000)

		handler = middleware(db, { writeBody: false, dbTTL: 1000 * 10 })

		request.body = 'abcd123'

		var theId

		function next(err) {
			if (err) {
				return done(err)
			}

			theId = request._levelHttpRecorderId
			expect(response).to.have.property('statusCode', 200)
			db.get(request._levelHttpRecorderId, verify1)
		}

		handler(request, response, next)

		function verify1(err, data) {
			if (err)
				done(err)

			expect(data).to.not.have.property('body')
			done()
		}
	})

	it('using option writeBody = false in the config can still be overidden in the request by using request.writeBody=true', function(done) {
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
			expect(response).to.have.property('statusCode', 200)
			db.get(request._levelHttpRecorderId, verify1)
		}

		handler(request, response, next)

		function verify1(err, data) {
			if (err)
				done(err)

			expect(data).to.have.property('body')
			expect(data.body).to.eql(request.body)
			done()
		}
	})

	beforeEach(function() {
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

	after(function() {
		db.close()
	})
})
