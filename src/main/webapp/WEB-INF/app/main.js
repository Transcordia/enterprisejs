/**
 * @fileOverview Main entry point for the web application
 */
var log = require('ringo/logging').getLogger(module.id);

var {Application} = require('stick');
var app = exports.app = Application();
app.configure('notfound', 'params', 'mount', 'route');

app.mount('/web', require('./web/main'));
app.mount('/api', require('./api/main'));

// Script to run app from command line
if (require.main === module) {
	require('ringo/httpserver').main(module.directory);
}