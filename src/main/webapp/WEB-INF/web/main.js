/**
 * @fileOverview Main entry point for the web application
 */
var log = require('ringo/logging').getLogger(module.id);
var {json} = require('ringo/jsgi/response');

var {Application} = require('stick');
var app = exports.app = Application();
app.configure('notfound', 'params', 'mount', 'route');

app.get('/', function (req) {
	return json({
		web: true,
		path: req.pathInfo
	});
});

