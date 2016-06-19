module.exports = function createMiddleware(db, config, modify_) {
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
	var label = Date.now() 

	setInterval(function () {
		label = Date.now()
		counter = 0
	}).unref()

	function extract(request) {
		var result = {
			method: request.method,
			httpVersion: request.httpVersion,
			headers: request.headers,
			url: request.url,
			timestamp: Date.now()
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

		var id = [label, counter++]
		request.request_id = id

		var requestData = extract(request)
		
		modify(requestData, request)

		db.put(id, requestData, next)		
	}
}

function modifyNoop() {}