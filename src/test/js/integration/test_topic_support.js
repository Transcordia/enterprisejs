var log = require('ringo/logging').getLogger(module.id);
var assert = require("assert");

var {request} = require('ringo/httpclient');
var {refresh} = require('utility/elasticsearch');
var {index, baseUrl, authToken} = require('../integration');

baseUrl += '/api/topics';

/***   HTTP Utilities  ***/
var get = exports.get = function (url) {
	// Convert relative URLs to absolute URLs
	if (!/^http/i.test(url)) url = baseUrl + url;

	var opts = {
		url: url,
		method: 'GET',
		headers: {'x-rt-index': index},
		async: false
	};
	log.debug('GET Request: {}', JSON.stringify(opts));
	return request(opts);
};

var post = exports.post = function (url, json) {
	var opts = {
		url: baseUrl + url,
		method: 'POST',
		headers: {'x-rt-index': index, 'Content-Type': 'application/json'},
		async: false,
		data: JSON.stringify(json)
	};
	log.debug('POST Request: {}', JSON.stringify(opts));
	var result = request(opts);
	refresh(index);
	return result;
};

var put = exports.put = function (url, json) {
	var result = request({
		url: baseUrl + url,
		method: 'PUT',
		headers: {'x-rt-index': index, 'Content-Type': 'application/json', 'Authorization': authToken },
		async: false,
		data: JSON.stringify(json)
	});
	refresh(index);
	return result;
};


exports.deleteTopics = function () {
	// Delete all topics
	var exchange = request({
		url: baseUrl + '/',
		method: 'DELETE',
		headers: { 'x-rt-index': index, 'Authorization': authToken },
		async: false
	});

	assert.equal(exchange.status, 204);
	refresh(index);

	// Verify the delete
	exchange = get('/?size=100');
	assert.equal(exchange.status, 200);
	var topics = JSON.parse(exchange.content);
	assert.equal(topics.length, 0);
};


var genBareBonesTopics = exports.genBareBonesTopics = function (ids, result) {
	var id = Array.isArray(ids) ? ids.shift() : ids;

	var val = id.toString();
	while (val.length < 10) val = '0' + val;

	var topic = {
		source: 'test',
		username: 'username_' + val,
		password: 'password_' + val,
		accountEmail: {
			status: 'status_' + val,
			address: 'address_' + val
		}
	};

	if (Array.isArray(ids)) {
		result = !result ? [topic] : result.concat(topic);
		if (ids.length > 0) return genBareBonesTopics(ids, result);
		return result;
	}

	return topic;
};


var genTopics = exports.genTopics = function (ids, result) {
	var id = Array.isArray(ids) ? ids.shift() : ids;

	var val = id.toString();
	while (val.length < 10) val = '0' + val;

	var topic = {
		source: 'test',
		dataType: 'topics',
		about: 'about_' + val,
		username: 'topic_' + val,
		instantMessenger: [
			{ provider: 'providera_' + val, screenName: 'screenNamea_' + val },
			{ provider: 'providerb_' + val, screenName: 'screenNameb_' + val },
			{ provider: 'providerc_' + val, screenName: 'screenNamec_' + val }
		],
		accountEmail: {
			status: 'status_' + val,
			address: 'address_' + val
		},
		displayEmails: [
			{ type: 'typea_' + val, address: 'addressa_' + val },
			{ type: 'typeb_' + val, address: 'addressb_' + val },
			{ type: 'typec_' + val, address: 'addressc_' + val }
		],
		civilId: 'civilid_' + val,
		websites: [
			{ title: 'titlea_' + val, url: 'urla_' + val },
			{ title: 'titleb_' + val, url: 'urlb_' + val },
			{ title: 'titlec_' + val, url: 'urlc_' + val }
		],
		password: 'password_' + val,
		thirdPartyLogins: [
			{ identifier: 'identifiera_' + val, values: { a: 'test' } },
			{ identifier: 'identifierb_' + val, values: { b: 'test' } }
		],
		socialNetworks: [
			{ title: 'titlea_' + val, url: 'url_' + val, userName: 'userNamea_' + val },
			{ title: 'titleb_' + val, url: 'url_' + val, userName: 'userNameb_' + val },
			{ title: 'titlec_' + val, url: 'url_' + val, userName: 'userNamec_' + val },
			{ title: 'titled_' + val, url: 'url_' + val, userName: 'userNamed_' + val }
		],
		name: {
			given: 'given_ ' + val,
			surname: 'surname_' + val,
			middle: 'middle_' + val,
			pre: 'pre_' + val,
			suf: 'suf_' + val,
			grandfather: 'grandfather_' + val,
			fullName: 'fullName_' + val
		},
		gender: 'gender_' + val,
		birthDate: {
			hijri: 'hijri_' + val,
			gregorian: 'gregorian_' + val,
			preference: 'preference_' + val
		},
		placeOfBirth: {
			city: 'city_' + val,
			state: 'state_' + val,
			country: 'country_' + val
		},
		nationality: 'nationality_' + val,
		fullDescription: 'fullDescription_' + val,
		thumbnail: 'thumbnail_' + val,
		phones: [
			{ title: 'titlea_' + val, number: 'numbera_' + val, extension: 'extensiona_' + val },
			{ title: 'titleb_' + val, number: 'numberb_' + val, extension: 'extensionb_' + val },
			{ title: 'titlec_' + val, number: 'numberc_' + val, extension: 'extensionc_' + val }
		],
		loginHistory: [
			{ ip: 'ipa_' + val, city: 'citya_' + val, region: 'regiona_' + val, country: 'countrya_' + val, date: new Date() },
			{ ip: 'ipb_' + val, city: 'cityb_' + val, region: 'regionb_' + val, country: 'countryb_' + val, date: new Date() },
			{ ip: 'ipc_' + val, city: 'cityc_' + val, region: 'regionc_' + val, country: 'countryc_' + val, date: new Date() },
			{ ip: 'ipd_' + val, city: 'cityd_' + val, region: 'regiond_' + val, country: 'countryd_' + val, date: new Date() },
			{ ip: 'ipe_' + val, city: 'citye_' + val, region: 'regione_' + val, country: 'countrye_' + val, date: new Date() }
		],
		educationHistory: [
			{ country: 'countrya_' + val,
				yearFrom: { hijri: 'hijria_' + val, gregorian: 'gregoriana_' + val, preference: 'preferencea_' + val},
				yearTo: {hijri: 'hijria_' + val, gregorian: 'gregoriana_' + val, preference: 'preferencea_' + val},
				degree: 'degreea_' + val, fieldOfStudy: 'fielda_' + val, schoolName: 'schoolNamea_' + val,
				edNotes: 'edNotesa_' + val
			},
			{ country: 'countryb_' + val,
				yearFrom: { hijri: 'hijrib_' + val, gregorian: 'gregorianb_' + val, preference: 'preferenceb_' + val},
				yearTo: {hijri: 'hijrib_' + val, gregorian: 'gregorianb_' + val, preference: 'preferenceb_' + val},
				degree: 'degreeb_' + val, fieldOfStudy: 'fieldb_' + val, schoolName: 'schoolNameb_' + val,
				edNotes: 'edNotesb_' + val
			}
		],
		workHistory: [
			{ title: 'title_' + val, businessName: 'businessName_' + val,
				yearStarted: { hijri: 'hijrib_' + val, gregorian: 'gregorianb_' + val, preference: 'preferenceb_' + val},
				yearFinished: {hijri: 'hijrib_' + val, gregorian: 'gregorianb_' + val, preference: 'preferenceb_' + val},
				workNotes: 'workNotes_' + val, location: 'location_' + val
			}
		],
		addresses: [
			{
				title: 'title_' + val,
				poBox: 'poBox_' + val,
				extendedAddress: 'extendedAddress_' + val,
				streetAddress: 'streetAddress_' + val,
				locality: 'locality_' + val,
				city: 'city_' + val,
				state: 'state_' + val,
				town: 'town_' + val,
				block: 'block_' + val,
				region: 'region_' + val,
				postalCode: 'postalCode_' + val,
				countryName: 'countryName_' + val
			}
		],
		accomplishmentsAndLearning: [
			{ topicTitle: 'topicTitlea_' + val, description: 'descriptiona_' + val },
			{ topicTitle: 'topicTitleb_' + val, description: 'descriptionb_' + val },
			{ topicTitle: 'topicTitlec_' + val, description: 'descriptionc_' + val }
		],
		generalText: [
			{ textTitle: 'textTitlea_' + val, description: 'descriptiona_' + val },
			{ textTitle: 'textTitleb_' + val, description: 'descriptionb_' + val }
		],
		myExpertise: [
			{ topicTitle: 'topicTitlea_' + val, description: 'descriptiona_' + val },
			{ topicTitle: 'topicTitleb_' + val, description: 'descriptionb_' + val }
		],
		othersExpertise: [
			{ topicTitle: 'topicTitlea_' + val, description: 'descriptiona_' + val },
			{ topicTitle: 'topicTitleb_' + val, description: 'descriptionb_' + val }
		],
		"notificationSettings": [
			{
				"fieldName": "ventures-comments",
				"value": {
					"stream": false,
					"alert": true
				}
			},
			{
				"fieldName": "ventures-discussions",
				"value": {
					"stream": false,
					"alert": true
				}
			},
			{
				"fieldName": "collaborations-collaborators",
				"value": {
					"stream": false,
					"alert": true
				}
			},
			{
				"fieldName": "collaborations-discussions",
				"value": {
					"stream": false,
					"alert": true
				}
			},
			{
				"fieldName": "ideas-likes",
				"value": {
					"stream": false,
					"alert": true
				}
			},
			{
				"fieldName": "ventures-collaborators",
				"value": {
					"stream": false,
					"alert": true
				}
			},
			{
				"fieldName": "collaborations-comments",
				"value": {
					"stream": false,
					"alert": true
				}
			},
			{
				"fieldName": "ideas-comments",
				"value": {
					"stream": false,
					"alert": true
				}
			},
			{
				"fieldName": "ventures-likes",
				"value": {
					"stream": false,
					"alert": true
				}
			},
			{
				"fieldName": "collaborations-likes",
				"value": {
					"stream": false,
					"alert": true
				}
			}
		],
		languagePref: 'languagePref_' + val,
		race: 'race_' + val,
		ethnicity: 'ethnicity_' + val,
		maritalStatus: 'maritalStatus_' + val,
		religion: 'religion_' + val,
		requests: 'requests_' + val,
		tags: null,
		likes: Math.floor(Math.random() * 10000),
		follows: {type: "any", optional: true}, //now external jnct and returns array
		followedBy: {type: "any", optional: true}, //now external jnct and returns array
		notificationPref: 'notificationPref_' + val,
		views: Math.floor(Math.random() * 10000),
		privacySettings: [
			{ fieldName: 'fieldNamea_' + val, value: 'valuea_' + val },
			{ fieldName: 'fieldNameb_' + val, value: 'valueb_' + val },
			{ fieldName: 'fieldNamec_' + val, value: 'valuec_' + val }
		],
		privacyVisibility: {
			privateInformation: 'privateInformation_' + val,
			searchResults: 'searchResults_' + val
		},
		stages: ['startup'],
		status: "status_" + val,
		roles: ['ROLE_USER', 'ROLE_ADMIN'],
		businesses: [],
		percentComplete: Math.floor(Math.random() * 100) + 1
	};

	if (Array.isArray(ids)) {
		result = !result ? [topic] : result.concat(topic);
		if (ids.length > 0) return genTopics(ids, result);
		return result;
	}

	return topic;
};

var addTopics = exports.addTopics = function (topics, results) {
	var res = Array.isArray(topics) ? topics.shift() : topics;

	var exchange = post('/', res);
	assert.equal(exchange.status, 201);
	assert.isNotNull(exchange.headers);
	assert.isNotNull(exchange.headers.Location);
	var id = exchange.headers.Location.split('/').pop();

	exchange = get(exchange.headers.Location);
	assert.equal(exchange.status, 200);

	var topic = JSON.parse(exchange.content);
	topic._id = id;

	if (Array.isArray(topics)) {
		results = !results ? [topic] : results.concat(topic);
		if (topics.length > 0) return addTopics(topics, results);
		return results;
	}

	return topic;
};
