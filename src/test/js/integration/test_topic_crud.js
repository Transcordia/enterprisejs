var log = require('ringo/logging').getLogger(module.id);
var assert = require("assert");

var {traverse} = require('utility/traverse');
var {mergeObjectValues} = require('utility/util');
var {dateToISO8601} = require('../integration');
var {get, post, put, deleteTopics, genTopics, genBareBonesTopics} = require('./test_topic_support');

exports.testCreateAndRead = function () {
	try {
		var topic = genTopics(1);
		var exchange = post('/', topic);

		assert.equal(exchange.status, 201);
		assert.isNotNull(exchange.headers);
		assert.isNotNull(exchange.headers.Location);

		// Retrieve topic by location returned on create
		exchange = get(exchange.headers.Location);

		assert.equal(exchange.status, 200);
		var response = JSON.parse(exchange.content);

		// There is no _id field in our generated code.
		assert.ok(response._id);
		delete response._id;

		// lastModifiedDate is set during persistence, so they won't be comparable.
		assert.equal(typeof response.lastModifiedDate, 'string');
		delete response.lastModifiedDate;
		delete topic.lastModifiedDate;

		// dateCreated is set during persistence, so they won't be comparable.
		assert.equal(typeof response.dateCreated, 'string');
		delete response.dateCreated;
		delete topic.dateCreated;

		// When dates come out of ES they are ISO 8601 strings. converting other dates to
		// strings for comparison.
		traverse(topic).forEach(function (date) {
			if (this.key === 'date') this.update(dateToISO8601(date, '-', ':'));
		});

		assert.deepEqual(topic, response);
	} finally {
		deleteTopics();
	}
};

/**
 * Checks to ensure that certain defaults are set appropriately when adding a topic.
 */
exports.testCreateDefaults = function () {
	try {
		var topic = genBareBonesTopics(1);

		var exchange = post('/', topic);

		assert.equal(exchange.status, 201);
		assert.isNotNull(exchange.headers);
		assert.isNotNull(exchange.headers.Location);

		// Retrieve topic by location returned on create
		exchange = get(exchange.headers.Location);

		assert.equal(exchange.status, 200);
		var response = JSON.parse(exchange.content);

		// These fields should have been created from default values
		assert.equal(response.dataType, 'topics');
		assert.equal(response.thumbnail, null);
		assert.equal(typeof response.dateCreated, 'string');
		assert.equal(typeof response.lastModifiedDate, 'string');
		assert.equal(response.status, 'candidate');
		assert.deepEqual(response.roles, ['ROLE_USER']);
		assert.deepEqual(response.businesses, []);
		assert.equal(response.likes, 0);
		assert.equal(response.views, 0);
		assert.equal(response.percentComplete, 0);
		assert.deepEqual(response.notificationSettings, [
		                  {
		                     "fieldName":"ventures-comments",
		                     "value":{
		                        "stream":false,
		                        "alert":true
		                     }
		                  },
		                  {
		                     "fieldName":"ventures-discussions",
		                     "value":{
		                        "stream":false,
		                        "alert":true
		                     }
		                  },
		                  {
		                     "fieldName":"collaborations-collaborators",
		                     "value":{
		                        "stream":false,
		                        "alert":true
		                     }
		                  },
		                  {
		                     "fieldName":"collaborations-discussions",
		                     "value":{
		                        "stream":false,
		                        "alert":true
		                     }
		                  },
		                  {
		                     "fieldName":"ideas-likes",
		                     "value":{
		                        "stream":false,
		                        "alert":true
		                     }
		                  },
		                  {
		                     "fieldName":"ventures-collaborators",
		                     "value":{
		                        "stream":false,
		                        "alert":true
		                     }
		                  },
		                  {
		                     "fieldName":"collaborations-comments",
		                     "value":{
		                        "stream":false,
		                        "alert":true
		                     }
		                  },
		                  {
		                     "fieldName":"ideas-comments",
		                     "value":{
		                        "stream":false,
		                        "alert":true
		                     }
		                  },
		                  {
		                     "fieldName":"ventures-likes",
		                     "value":{
		                        "stream":false,
		                        "alert":true
		                     }
		                  },
		                  {
		                     "fieldName":"collaborations-likes",
		                     "value":{
		                        "stream":false,
		                        "alert":true
		                     }
		                  }
		               ]);

	} finally {
		deleteTopics();
	}
};

exports.testTopicUpdate = function () {
	try {
		var topic = genTopics(1);
		var exchange = post('/', topic);

		assert.equal(exchange.status, 201);
		assert.isNotNull(exchange.headers);
		assert.isNotNull(exchange.headers.Location);

		// Retrieve topic by location returned on create
		exchange = get(exchange.headers.Location);

		assert.equal(exchange.status, 200);
		var savedTopic = JSON.parse(exchange.content);

		// Create a new topic that will provide the updated fields.
		var newTopic = genTopics(2);

		// Copy the properties from the new topic over the properties of the saved topic.
		mergeObjectValues(newTopic, savedTopic);

		// Update the topic
		exchange = put('/' + savedTopic._id, savedTopic);

		assert.equal(exchange.status, 204);
		assert.isNotNull(exchange.headers);
		assert.isNotNull(exchange.headers.Location);

		// Retrieve topic by location returned on put
		exchange = get(exchange.headers.Location);
		assert.equal(exchange.status, 200);
		var updatedTopic = JSON.parse(exchange.content);

		// Compare updatedTopic to newTopic
		delete updatedTopic._id;

		// lastModifiedDate is set during persistence, so they won't be comparable.
		assert.equal(typeof updatedTopic.lastModifiedDate, 'string');
		delete updatedTopic.lastModifiedDate;
		delete newTopic.lastModifiedDate;

		// dateCreated is set during persistence, so they won't be comparable.
		assert.equal(typeof updatedTopic.dateCreated, 'string');
		delete updatedTopic.dateCreated;
		delete newTopic.dateCreated;

		// When dates come out of ES they are ISO 8601 strings. converting other dates to
		// strings for comparison.
		traverse(newTopic).forEach(function (date) {
			if (this.key === 'date') this.update(dateToISO8601(date, '-', ':'));
		});

		assert.deepEqual(updatedTopic, newTopic);
	} finally {
		deleteTopics();
	}

};

// start the test runner if we're called directly from command line
if (require.main == module.id) {
	system.exit(require('test').run(exports));
}

