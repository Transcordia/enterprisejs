var log = require('ringo/logging').getLogger(module.id);
var assert = require("assert");
var {get, deleteTopics, genTopics, addTopics} = require('./test_topic_support');

/**
 * Tests the stage of entrepreneurship of an entity.
 *      /topics?stages=startup,growth
 */
exports.testStagesSearch = function () {
	var exchange, results, identifiers;
	try {
		var [ent1, ent2, ent3, ent4, ent5] = genTopics([1, 2, 3, 4, 5]);
		ent1.stages= ['startup','growth'];
		ent2.stages = ['startup'];
		ent3.stages = ['inquisitive'];
		ent4.stages = [];
		ent5.stages = ['inquisitive','startup'];
		addTopics([ent1, ent2, ent3, ent4, ent5]);

		// Search for blogs in a single stage
		exchange = get('/count?stages=startup');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);
		assert.equal(results.count, 3);

		exchange = get('/?stages=startup');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);

		assert.equal(results.length, 3);
		identifiers = results.map(function(ent) { return ent.username; });
		assert.isTrue(identifiers.indexOf(ent1.username) >= 0);
		assert.isTrue(identifiers.indexOf(ent2.username) >= 0);
		assert.isTrue(identifiers.indexOf(ent5.username) >= 0);

		// Search for entities in multiple stages
		exchange = get('/count?stages=inquisitive,growth');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);
		assert.equal(results.count, 3);

		exchange = get('/?stages=inquisitive,growth');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);

		assert.equal(results.length, 3);
		identifiers = results.map(function(ent) { return ent.username; });
		assert.isTrue(identifiers.indexOf(ent1.username) >= 0);
		assert.isTrue(identifiers.indexOf(ent3.username) >= 0);
		assert.isTrue(identifiers.indexOf(ent5.username) >= 0);

		// Search for entities in a missing stage
		exchange = get('/count?stages=ideation');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);
		assert.equal(results.count, 0);

		exchange = get('/?stages=ideation');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);

		assert.equal(results.length, 0);

		// Search for all stages
		exchange = get('/count?stages=ideation,inquisitive,growth,startup');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);
		assert.equal(results.count, 4);

		exchange = get('/?stages=ideation,inquisitive,growth,startup');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);

		assert.equal(results.length, 4);
		identifiers = results.map(function(ent) { return ent.username; });
		assert.isTrue(identifiers.indexOf(ent1.username) >= 0);
		assert.isTrue(identifiers.indexOf(ent2.username) >= 0);
		assert.isTrue(identifiers.indexOf(ent3.username) >= 0);
		assert.isTrue(identifiers.indexOf(ent5.username) >= 0);

	} finally {
		deleteTopics();
	}
};

/**
 * Tests the role of an entity.
 *      /topics?roles=ROLE_ADMIN,ROLE_USER
 */
exports.testRolesSearch = function () {
	var exchange, results, identifiers;
	try {
		var [ent1, ent2, ent3, ent4, ent5] = genTopics([1, 2, 3, 4, 5]);
		ent1.roles= ['ROLE_USER','ROLE_ADMIN'];
		ent2.roles= ['ROLE_USER'];
		ent3.roles= ['ROLE_ADMIN'];
		ent4.roles= ['ROLE_TELLER'];
		// ent5 should have ROLE_USER and ROLE_ADMIN by default
		addTopics([ent1, ent2, ent3, ent4, ent5]);

		// Search for entities with ROLE_USER
		exchange = get('/count?roles=ROLE_USER');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);
		assert.equal(results.count, 3);

		exchange = get('/?roles=ROLE_USER');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);

		assert.equal(results.length, 3);
		identifiers = results.map(function(ent) { return ent.username; });
		assert.isTrue(identifiers.indexOf(ent1.username) >= 0);
		assert.isTrue(identifiers.indexOf(ent2.username) >= 0);
		assert.isTrue(identifiers.indexOf(ent5.username) >= 0);

		// Lowercase analyzer should support testing for any case of search
		exchange = get('/count?roles=role_user');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);
		assert.equal(results.count, 3);

		exchange = get('/?roles=role_user');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);

		assert.equal(results.length, 3);
		identifiers = results.map(function(ent) { return ent.username; });
		assert.isTrue(identifiers.indexOf(ent1.username) >= 0);
		assert.isTrue(identifiers.indexOf(ent2.username) >= 0);
		assert.isTrue(identifiers.indexOf(ent5.username) >= 0);

		// Lowercase analyzer should support testing for any case of search
		exchange = get('/count?roles=RoLe_UsEr');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);
		assert.equal(results.count, 3);

		exchange = get('/?roles=RoLe_UsEr');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);

		assert.equal(results.length, 3);
		identifiers = results.map(function(ent) { return ent.username; });
		assert.isTrue(identifiers.indexOf(ent1.username) >= 0);
		assert.isTrue(identifiers.indexOf(ent2.username) >= 0);
		assert.isTrue(identifiers.indexOf(ent5.username) >= 0);

		// Search for entities with ROLE_ADMIN
		exchange = get('/count?roles=ROLE_ADMIN');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);
		assert.equal(results.count, 3);

		exchange = get('/?roles=ROLE_ADMIN');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);

		assert.equal(results.length, 3);
		identifiers = results.map(function(ent) { return ent.username; });
		assert.isTrue(identifiers.indexOf(ent1.username) >= 0);
		assert.isTrue(identifiers.indexOf(ent3.username) >= 0);
		assert.isTrue(identifiers.indexOf(ent5.username) >= 0);

		// Test for non-existant role
		exchange = get('/count?roles=ROLE_MANAGER');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);
		assert.equal(results.count, 0);

		exchange = get('/?roles=ROLE_MANAGER');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);

		assert.equal(results.length, 0);

		// Test for multiple roles (considered an 'or' search)
		exchange = get('/count?roles=role_admin,role_teller');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);
		assert.equal(results.count, 4);

		exchange = get('/?roles=role_admin,role_teller');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);

		assert.equal(results.length, 4);
		identifiers = results.map(function(ent) { return ent.username; });
		assert.isTrue(identifiers.indexOf(ent1.username) >= 0);
		assert.isTrue(identifiers.indexOf(ent3.username) >= 0);
		assert.isTrue(identifiers.indexOf(ent4.username) >= 0);
		assert.isTrue(identifiers.indexOf(ent5.username) >= 0);

		// Search for all roles
		exchange = get('/count?roles=role_user,role_teller,role_admin');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);
		assert.equal(results.count, 5);

		exchange = get('/?roles=role_user,role_teller,role_admin');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);

		assert.equal(results.length, 5);
		identifiers = results.map(function(ent) { return ent.username; });
		assert.isTrue(identifiers.indexOf(ent1.username) >= 0);
		assert.isTrue(identifiers.indexOf(ent2.username) >= 0);
		assert.isTrue(identifiers.indexOf(ent3.username) >= 0);
		assert.isTrue(identifiers.indexOf(ent4.username) >= 0);
		assert.isTrue(identifiers.indexOf(ent5.username) >= 0);

	} finally {
		deleteTopics();
	}
};

exports.testViewsAscending = function () {
	var exchange, results, entity, id, i, count = 200;
	try {
		for (i = 1; i < count; i++) {
			var ent = genTopics(i);
			ent.views = i;
			ent.roles = (i % 2 === 0) ? ['ROLE_ADMIN'] : ['ROLE_USER'];
			addTopics(ent);
		}

		exchange = get('/views/15');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);
		assert.ok(results);
		assert.isTrue(Array.isArray(results));
		assert.equal(results.length, 15);

		// The 15 items in the search result should be the same as the last 15 items added.
		count = 199;
		while (results.length > 0) {
			entity = results.shift();
			id = count.toString();
			while (id.length < 10) id = '0' + id;
			assert.equal(entity.username, 'topic_' + id);
			count--;
		}

		// Get 15 least viewed articles
		exchange = get('/views/15?roles=role_admin');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);
		assert.ok(results);
		assert.isTrue(Array.isArray(results));
		assert.equal(results.length, 15);

		// Only even ids should match
		count = 198;
		while (results.length > 0) {
			entity = results.shift();
			id = count.toString();
			while (id.length < 10) id = '0' + id;
			assert.equal(entity.username, 'topic_' + id);
			count -= 2;
		}

	} finally {
		deleteTopics();
	}
};

exports.testViewsDescending = function () {
	var exchange, results, entity, id, i, count = 200;
	try {
		for (i = 1; i < count; i++) {
			var ent = genTopics(i);
			ent.views = i;
			ent.roles = (i % 2 === 0) ? ['ROLE_ADMIN'] : ['ROLE_USER'];
			addTopics(ent);
		}

		// Get 15 most viewed entities
		exchange = get('/views/15?sortDir=asc');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);
		assert.ok(results);
		assert.isTrue(Array.isArray(results));
		assert.equal(results.length, 15);

		// The 15 items in the search result should be the same as the first 15 items added.
		count = 1;
		while (results.length > 0) {
			entity = results.shift();
			id = count.toString();
			while (id.length < 10) id = '0' + id;
			assert.equal(entity.username, 'topic_' + id);
			count++;
		}

		// Get 15 oldest entities
		exchange = get('/views?sortDir=asc&size=15&roles=role_admin');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);
		assert.ok(results);
		assert.isTrue(Array.isArray(results));
		assert.equal(results.length, 15);

		// Only even ids are entities
		count = 2;
		while (results.length > 0) {
			entity = results.shift();
			id = count.toString();
			while (id.length < 10) id = '0' + id;
			assert.equal(entity.username, 'topic_' + id);
			count += 2;
		}

	} finally {
		deleteTopics();
	}
};

exports.testPagination = function () {
	var exchange, results, entity, from, size, id, i, count = 200;
	try {
		for (i = 1; i < count; i++) {
			var ent = genTopics(i);
			ent.views = i;
			ent.roles = (i % 2 === 0) ? ['ROLE_ADMIN'] : ['ROLE_USER'];
			addTopics(ent);
		}

		// Get 17 entities
		from = 0;
		size = 17;
		// Intential to use 15, the url param should override
		exchange = get('/views/17?from=' + from + '&size=15');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);
		assert.ok(results);
		assert.isTrue(Array.isArray(results));
		assert.equal(results.length, 17);

		count = 199;
		while (results.length !== 0) {
			while (results.length > 0) {
				entity = results.shift();
				id = count.toString();
				while (id.length < 10) id = '0' + id;
				assert.equal(entity.username, 'topic_' + id);
				count--;
			}

			from += size;
			exchange = get('/views?from=' + from + '&size=' + size);
			assert.equal(exchange.status, 200);
			results = JSON.parse(exchange.content);
			assert.ok(results);
			assert.isTrue(Array.isArray(results));
			assert.equal(results.length, count < 17 ? count : 17);
		}


		// Same thing, but now with admins
		from = 0;
		size = 17;
		exchange = get('/views?from=' + from + '&size=' + size + '&roles=role_admin');
		assert.equal(exchange.status, 200);
		results = JSON.parse(exchange.content);
		assert.ok(results);
		assert.isTrue(Array.isArray(results));
		assert.equal(results.length, 17);

		count = 198;
		while (results.length !== 0) {
			while (results.length > 0) {
				entity = results.shift();
				id = count.toString();
				while (id.length < 10) id = '0' + id;
				assert.equal(entity.username, 'topic_' + id);
				count -= 2;
			}

			from += size;
			exchange = get('/views?from=' + from + '&size=' + size + '&roles=role_admin');
			assert.equal(exchange.status, 200);
			results = JSON.parse(exchange.content);
			assert.ok(results);
			assert.isTrue(Array.isArray(results));
			assert.equal(results.length, count < 34 ? count/2 : 17);
		}
	} finally {
		deleteTopics();
	}
};


// start the test runner if we're called directly from command line
if (require.main == module.id) {
	system.exit(require('test').run(exports));
}

