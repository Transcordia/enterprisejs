/**
 * @fileOverview Entry point for all api web service calls.
 */
var log = require('ringo/logging').getLogger(module.id);
var {json} = require('ringo/jsgi/response');
var {trimpathResponse} = require('trimpath');

var {Application} = require("stick");
var app = exports.app = Application();
app.configure('notfound', 'params', 'route');

app.get('/', function (req) {
    //return json({web:true});

    return trimpathResponse(module.resolve('views/index.html'));
});


