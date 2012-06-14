require.paths.push(module.resolve('.'));
require.paths.push(module.resolve('../../main/webapp/WEB-INF/app'));

var log = require('ringo/logging').getLogger(module.id);
var {encode} = require('ringo/base64');
var assert = require("assert");

exports.baseUrl = 'http://localhost:9300/myapp';
exports.index = 'ejs';
exports.authToken = _generateBasicAuthorization('backdoor', 'Backd00r');

function _generateBasicAuthorization(username, password) {
	var header = username + ":" + password;
	var base64 = encode(header);
	return 'Basic ' + base64;
}

exports.dateToISO8601 = function (d, dateSep, timeSep) {
	function pad(n) {
		return n < 10 ? '0' + n : n
	}
	function pad3(n) {
		return n < 10 ? '00' + n :
				n < 100 ? '0' + n : n;
	}

	if (typeof dateSep !== 'string') dateSep = '-';
	if (typeof timeSep !== 'string') timeSep = ':';

	return d.getUTCFullYear() + dateSep
			+ pad(d.getUTCMonth() + 1) + dateSep
			+ pad(d.getUTCDate()) + 'T'
			+ pad(d.getUTCHours()) + timeSep
			+ pad(d.getUTCMinutes()) + timeSep
			+ pad(d.getUTCSeconds())  + '.'
			+ pad3(d.getUTCMilliseconds()) + 'Z';
};


exports.assertContents = function(actual, expected, pkField, preserveOrder) {
	assert.isTrue(Array.isArray(actual));
	assert.isTrue(Array.isArray(expected));
	assert.equal(actual.length, expected.length);

	var actualKeys = actual.map(function(a) { return a[pkField]; });
	var expectedKeys = expected.map(function(a) { return a[pkField]; });

	if (!preserveOrder) {
		actualKeys.sort();
		expectedKeys.sort();
	}

	for (var i = 0, c = actualKeys.length; i < c; i++) {
		assert.equal(actualKeys[i], expectedKeys[i]);
	}
};

exports.assertContentValues = function(actual, expected, pkField, preserveOrder) {
	assert.isTrue(Array.isArray(actual));
	assert.isTrue(Array.isArray(expected));
	assert.equal(actual.length, expected.length);

	var actualKeys = actual.map(function(a) { return a[pkField]; });
	var expectedKeys = [].concat(expected);

	if (!preserveOrder) {
		actualKeys.sort();
		expectedKeys.sort();
	}

	for (var i = 0, c = actualKeys.length; i < c; i++) {
		assert.equal(actualKeys[i], expectedKeys[i]);
	}
};

// TODO: rewrite this so that each file of tests runs separately,
//       with its own exports object and therefore its own setUp()/tearDown()

function addTests(testModule) {
    for (var key in testModule) {
        exports[key] = testModule[key];
    }
}

addTests(require('./integration/test_topic_crud'));
addTests(require('./integration/test_topic_filters'));

// start the test runner if we're called directly from command line
if (require.main == module.id) {
    system.exit(require('test').run(exports));
}
