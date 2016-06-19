# level-http-recorder [![Build Status](https://secure.travis-ci.org/kessler/level-http-recorder.png?branch=master)](http://travis-ci.org/kessler/level-http-recorder) [![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

A rudimentary middleware / handler that records http requests to a local level db.

Compatible with various web frameworks that use standard middleware interface ```function (req, res, next) {}```

This module expects the given db to support:
- levelup interface 
- bytewise key encoding
- json value encoding

## normal use:
```js
var stack = require('stack')
var db = require('level-bytewise')('./mydb')
var http = require('http')

var levelHttpRecorder = require('level-http-recorder')(db)

http.createServer(stack(levelHttpRecorder))

```

### modify before a request is persisted
```javascript
var stack = require('stack')
var db = require('level-bytewise')('./mydb')
var http = require('http')

var levelHttpRecorder = require('level-http-recorder')(db, function (requestData, request) {
    // do stuff to request data
    // DO NOT modify request!
    requestData.myField = 'foo'
})

http.createServer(stack(levelHttpRecorder))
```

### schema
Every recorded request will have the following fields, represented here as the field name: the field name used to populate the value from the request object

```javascript
    var result = {
        ip: request.ip, // if request had an ip property, this will be it
        requestId: [12312312312233,2] // the leveldb key of the request,
        method: request.method,
        httpVersion: request.httpVersion,
        headers: request.headers,
        url: request.url,
        trailers: request.trailers,
        time: Date.utc(),
        query: {}, // a parsed query string
        body: ... // if there is a body to the request and config.writeBody === true || request.writeBody === true - this field will hold the entire body. It is advisable to employ limit restrictions
    }
```
