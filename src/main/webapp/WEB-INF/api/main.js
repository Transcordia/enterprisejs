/**
 * @fileOverview Entry point for all api web service calls.
 */
var log = require('ringo/logging').getLogger(module.id);
var {json} = require('ringo/jsgi/response');

var {Application} = require("stick");

var app = exports.app = Application();
app.configure('notfound', 'params', 'mount', 'route');

app.get('/', function (req) {
	return json({
		api: true,
		path: req.pathInfo
	});
});

app.post('/processurl', function(req){
    log.info('URL to process passed in via post: {}', JSON.stringify(req.postParams, null, 4));
    return json({});
});
