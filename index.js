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

		return result
	}

	return function levelHttpRecorderMiddleware(request, response, next) {

		var now = Date.now()

		var id = request.id = now + '-' + counter++ + '-' + suffix

		var requestData = extract(request)

		modify_(requestData, request)

		//TODO might want client provided ttl
		if ( (config.writeBody || request.writeBody) && request.body) {
			var batch = db.batch()
			batch.put(id, requestData, { valueEncoding: 'json', ttl: config.dbTTL })
			batch.put(id + '-body', request.body, { ttl: config.dbTTL })
			batch.write(function (err) {
				if (err) {
					return next(err)
				}

				next()
			})
		} else {
			db.put(id, requestData, { valueEncoding: 'json', ttl: config.dbTTL }, function (err) {
				next(err)
			})
		}		
	}
}