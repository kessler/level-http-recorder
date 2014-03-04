# level-http-recorder

A rudimentary middleware / handler that records http requests to a local level db, this module doesnt really depend on anything except on the levelup interface.

## normal use:
```
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

## using [DarkMagic](https://github.com/kessler/darkmagic) :
```
require('darkmagic').inject(levelHttpRecorder, stack, http) {
	http.createServer(stack(levelHttpRecorder))
}
```
