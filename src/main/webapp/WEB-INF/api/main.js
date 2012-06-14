/**
 * @fileOverview Entry point for all api web service calls.
 */
var log = require('ringo/logging').getLogger(module.id);
var {json} = require('ringo/jsgi/response');

var {Application} = require("stick");

var app = exports.app = Application();
app.configure('notfound', 'params', 'mount', 'route');

app.mount('/topics', require('./topics'));
app.mount('/profiles', require('./profiles'));

app.get('/', function (req) {
	return json({
		api: true,
		path: req.pathInfo
	});
});
