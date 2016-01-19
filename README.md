# level-http-recorder [![Build Status](https://secure.travis-ci.org/kessler/level-http-recorder.png?branch=master)](http://travis-ci.org/kessler/level-http-recorder) [![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

A rudimentary middleware / handler that records http requests to a local level db in a certain manner, this module doesn't really depend on anything except the levelup interface.

## normal use:
```js
var stack = require('stack')
var db = require('levelup')('./mydb')
var http = require('http')

// optionally have items expire, you will need to install level-ttl for this to take effect
var config = {
	dbTTL: 1000 * 10
}

// optionally, plug in whatever logger you are using
var log = {
	error: function() {
	},
	info: function() {
	}
}

var levelHttpRecorder = require('level-http-recorder')(db, config, log)

http.createServer(stack(levelHttpRecorder))

```

> can be used with [DarkMagic](https://github.com/kessler/darkmagic)
