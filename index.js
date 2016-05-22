const bytewise = require('bytewise')

module.exports = function injectableHandlerFactory(db, config, modify_) {
	if (!db) {
		throw new Error('must supply a db instance')
	}

	if (typeof config === 'function') {
		modify_ = config
		config = undefined
	}

	config = config  || {}
	var modify = modify_ || modifyNoop

	if (config.writeBody === undefined) {
		// TODO: should probably clone this before...
		config.writeBody = true
	}

	var counter = 0

	function extract(request) {
		var result = {
			method: request.method,
			httpVersion: request.httpVersion,
			headers: request.headers,
			url: request.url
		}

		if (request.ip) {
			result.ip = request.ip
		}

		if (request.query) {
			result.query = request.query
		}

		if (request.trailers) {
			result.trailers = request.trailers
		}

		if ( (config.writeBody || request.writeBody) && request.body) {
			result.body = request.body	
		}

		return result
	}

	return function levelHttpRecorderMiddleware(request, response, next) {

		var now = Date.now()

		var id = [now, counter++]
		request._levelHttpRecorderId = bytewise.encode(id)

		var requestData = extract(request)
		
		modify(requestData, request)

		db.put(id, requestData, { keyEncoding: bytewise, valueEncoding: 'json', ttl: config.dbTTL }, next)		
	}
}

function modifyNoop() {}