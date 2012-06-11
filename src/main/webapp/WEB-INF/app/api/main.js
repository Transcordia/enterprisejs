/**
 * @fileOverview Entry point for all api web service calls.
 */
var log = require('ringo/logging').getLogger(module.id);

var {Application} = require("stick");
var app = exports.app = Application();
app.configure("mount");

app.mount("/blocks", require("./blocks"));

