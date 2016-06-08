# level-http-recorder [![Build Status](https://secure.travis-ci.org/kessler/level-http-recorder.png?branch=master)](http://travis-ci.org/kessler/level-http-recorder) [![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

A rudimentary middleware / handler that records http requests to a local level db.

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
})

http.createServer(stack(levelHttpRecorder))
```

### schema
Every recorded request will have the following fields
```javascript
    var result = {
        method: request.method,
        httpVersion: request.httpVersion,
        headers: request.headers,
        url: request.url,
        time: Date.utc(),
        body: ... // if there is a body to the request and config.writeBody === true
    }
```
