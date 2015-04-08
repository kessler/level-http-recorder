var noopLog = {
	error: function() {
	},
	info: function() {
	}
}

function modifyNoop() {}

module.exports = function injectableHandlerFactory(db, config, log, modify_) {
	if (!db)
		throw new Error('must supply a db instance')

	config = config  || {}
	log = log || noopLog
	modify_ = modify_ || modifyNoop

	if (config.writeBody === undefined) {
		// TODO: should probably clone this before...
		config.writeBody = true
	}

	var counter = 0
	var suffix = 6

	setInterval(function () {
		counter = 0
		suffix = 42 / suffix
	}, 1000).unref()

	function extract(request) {
		var result = {
			method: request.method,
			httpVersion: request.httpVersion,
			headers: request.headers,
			url: request.url
		}

		if (request.ip)
			result.ip = request.ip

		if (request.query)
			result.query = request.query

		if (request.trailers)
			result.trailers = request.trailers

		modify_(result, request)

		return result
	}

	return function dbHandler(request, response, next) {

		var now = Date.now()

		var id = request.id = now + '-' + counter++ + '-' + suffix

		var requestData = extract(request)

		//TODO might want client ttl

		db.put(id, requestData, { valueEncoding: 'json', ttl: config.dbTTL }, putCallback)

		// 1
		function putCallback(err) {
			if (err) {
				log.error(err.message)
				response.statusCode = 500
				return next('failed #11')
			}

			response.statusCode = 200

			if (config.writeBody && request.body) {
				db.put(id + '-body', request.body, { ttl: config.dbTTL }, putDataCallback)
			} else {
				next()
			}
		}

		//2
		function putDataCallback(err) {
			if (err) {
				log.error(err.message)
				response.statusCode = 500
				next('failed #12')
			} else {
				response.statusCode = 200
				next()
			}
		}
	}
}