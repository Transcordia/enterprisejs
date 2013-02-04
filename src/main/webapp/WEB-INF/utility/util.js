/*
 * Copyright (c) 2010, Pykl Studios <admin@pykl.com>, All rights reserved.
 */
/**
 * @module utility/util
 */
var log = require('ringo/logging').getLogger(module.id);
var {format} = java.lang.String;
var Locale = java.util.Locale;

export
('dump', 'isValueInArray', 'merge', 'unique', 'mergeObjectValues', 'standardizedNow',
		'buildObjectBase', 'getAbbvObj', 'randomize8Chars', 'randomize8CharsCaseSensitive',
		'getEntityTypes', 'getSpamTypes', 'checkRippleUpdate', 'resolveEntity',
		'saveValidationError', 'createLocale', 'getSchema', 'getRatingTypes',
		'buildAbsolutePath', 'getRelatedIds', 'getNEPCollabIds',
		'textsearchcontroller', 'getLocaleTerms', 'getObjs', 'generateProfVerifyToken',
		'doesProfVerifyTokenExist', 'generateSlug', 'dateToISO8601', 'iso8601ToDate');

var store = require('store-js');
var errors = require('utility/errors');

var TimeUnit = java.util.concurrent.TimeUnit;

var {refresh} = require('utility/elasticsearch');
/*
 var mapProfiles = store.getMap("profiles");
 var mapVentures = store.getMap("ventures");
 var mapPosts = store.getMap("posts");
 var mapResources = store.getMap("resources");
 var mapRefLists = store.getMap("refLists");
 */
var {search} = require('store-js');

function odump(object, depth, max) {
	depth = depth || 0;
	max = max || 2;

	if (depth > max)
		return false;

	var indent = "";
	for (var i = 0; i < depth; i++)
		indent += "  ";

	var output = "";
	for (var key in object) {
		output += "\n" + indent + key + ": ";
		switch (typeof object[key]) {
			case "object":
				output += odump(object[key], depth + 1, max);
				break;
			case "function":
				output += "function";
				break;
			default:
				output += object[key];
				break;
		}
	}
	return output;
}

function dump(o, depth) {
	return odump(o, depth);
}


// todo: Just a note...I believe the array object has a contains() function.
function isValueInArray(arr, val) {
	var inArray = false;
	for (var i = 0; i < arr.length; i++)
		if (val == arr[i])
			inArray = true;
	return inArray;
}

function mergeObjectValues(partialObj, fullObj) {
//    print("Hello?");
	//Merges values from partialObj into fullObj where present in fullObj.
	for (var key in partialObj) {
//        print(key+" : 1\n");
		if (fullObj.hasOwnProperty(key) && key != "_id") {
//           print(key+" : 2\n");
			if (typeof partialObj[key] === 'object') {
				//If the partialObj[key] has a length we assume its an array, not a json object, and replace everything
				//in the fullObj[key] with partialObj[key]
				if (partialObj[key].length) {
					fullObj[key] = partialObj[key];
				}
				else {
					fullObj[key] = mergeObjectValues(partialObj[key], fullObj[key]);
				}
			}
			else {
				fullObj[key] = partialObj[key];
			}
		}
		/*
		 else if(!isNaN(key)) //This was added to deal with objects inside arrays, which, I think, is caused by a problem with the java wrapper.
		 {
		 fullObj[key] = partialObj[key]
		 }
		 */
	}
	return fullObj;
}

function buildObjectBase(schema) {
	var base = {};
	for (var key in schema.properties) {
		if (schema.properties[key]["optional"] === false && schema.properties[key].hasOwnProperty("defaultValue")) {
			if (schema.properties[key]["type"] === "array") {
				var tempArray = new Array();
				schema.properties[key]["defaultValue"].forEach(function (val) {
					tempArray.push(val);
				});
				base[key] = tempArray;
			}
			else if (schema.properties[key]["type"] === "object") {
				base[key] = buildObjectBase(schema.properties[key]);
			}
			else {
				base[key] = schema.properties[key]["defaultValue"];
			}

		}
	}
	return base;
}

/**
 * Performs a shallow copy of any number of json objects into the object to the left in the
 * arguments list. To make a complete copy of a json object, pass {} as the first parameter.
 */
function merge() {
	var result = arguments[0];
	for (var i = 1; i < arguments.length; i++) {
		var hash = arguments[i];
		for (var prop in hash) {
			result[prop] = hash[prop];
		}
	}
	return result;
}

function mergeObjectValues(partialObj, baseObj) {
	for (var key in partialObj) {
		if (key != "_id") {
			baseObj[key] = partialObj[key];
		}
	}
	return baseObj;
}

/**
 * Removes duplicate items from an array. The order of the items in the array may change because of
 * a sort step.
 *
 * @param a
 * @param compareFunc
 */
function unique(a, compareFunc) {
	if (!compareFunc) {
		compareFunc = function (a, b) {
			if (a < b) return -1;
			if (a > b) return 1;
			return 0;
		}
	}

	a.sort(compareFunc);

	for (var i = 1; i < a.length;) {
		if (compareFunc(a[i - 1], a[i]) === 0) {
			a.splice(i, 1);
		} else {
			i++;
		}
	}
	return a;
}


/**
 *  Returns time stamp as a string YYYY-mm-ddTHH:mm:ssZ
 */
function standardizedNow(d) {
	if (!d) d = new Date();
	return dateToISO8601(d, '-', ':');
}

/**
 * Creates an abbreviated use object based on the parameter information passed in.
 *
 * todo: Change the semantics of this function to return null if no entity could be found. Used to
 * throw an exception which looks like it was never caught anyway.
 *
 * @param index
 * @param dataType
 * @param id
 * @param profileId
 * @returns An entity-specific abbreviated object, or null if none was found.
 */
function getAbbvObj(index, dataType, id, profileId) {
	switch (dataType) {
		case "profiles":
			return _getAbbreviatedUser(index, id);
		case "ventures":
			return _getAbbreviatedVenture(index, id, profileId);
		case "posts":
			return _getAbbreviatedPost(index, id);
		case "resources":
			return _getAbbreviatedResource(index, id);
		case "postCategories":
			return _getAbbreviatedPostCategory(index, id);
	}
	return null;
}

/**
 * @private
 * All users with a profile in our system will have this data, but 3rd party systems and
 * internal test users may not. So, it is important that the lack of a profile is supported by
 * this call for an abbreviated user.
 *
 * @param index
 * @param userId
 * @return {Object}
 */
var _getAbbreviatedUser = function (index, userId) {
	var mapProfiles = store.getMap(index, "profiles");
	var profile = mapProfiles.get(userId);

	// Third party user
	if (!profile) return {
		_id: '',
		username: 'AnonymousUser',
		thumbnail: '',
		fullName: '',
		dataType: 'profiles',
		stages: ['']
	};

	return {
		_id: profile._id,
		username: profile.username,
		thumbnail: profile.thumbnail,
		fullName: profile.name && profile.name.fullName ? profile.name.fullName : "",
		dataType: profile.dataType,
		stages: profile.stages || ['']
	};
};

var _getAbbreviatedVenture = function (index, ventureId, profileId) {
	var mapVentures = store.getMap(index, "ventures");

	var venture = mapVentures.get(ventureId);
	if (!venture) return null;

	var res = {
		_id: venture._id,
		fullName: venture.name,
		username: venture.username,
		idea: venture.idea,
		serviceProvider: venture.serviceProvider,
		dateCreated: venture.dateCreated,
		active: venture.active,
		dataType: venture.dataType,
		thumbnail: venture.thumbnail
	};

	// If the requestor is an owner, then set a flag
	if (profileId) {
		venture.collaborators.forEach(function (collab) {
			if (collab.user._id === profileId) {
				res.owner = collab;
			}
		});
	}

	return res;
};

var _getAbbreviatedPost = function (index, postId) {
	var mapPosts = store.getMap(index, "posts");
	var post = mapPosts.get(postId);
	if (!post) return null;

	return {
		_id: post._id,
		dataType: post.dataType,
		dateCreated: post.dateCreated,
		rootId: post.rootId,
		parentId: post.parentId,
		type: post.type,
		title: post.title,
		creator: post.creator
	}
};

var _getAbbreviatedResource = function (index, resourceId) {
	var mapResources = store.getMap(index, "resources");

	var resource = mapResources.get(resourceId);
	if (!resource) return null;

	return {
		_id: resource._id,
		title: resource.name,
		key: resource.key,
		locale: resource.locale,
		thumbnail: resource.thumbnail,
		dataType: resource.dataType
	}
};

var _getAbbreviatedPostCategory = function (index, id) {

	var query = {
		"query": {
			"bool": {
				"must": [
					{ "field": { "key": "postCategories" } },
					{ "field": { "refData._id": id } }
				]
			}
		}
	};

	var mapRefLists = store.getMap(index, "refLists");
	var res = mapRefLists.get(query);

	res[0].refData.forEach(function (data) {
		if (data._id === id) return data;
	});

	return null;
};

var randomize8Chars = function () {
	var arrCharacters = ( "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ" );
	var retVal = "";
	for (var i = 0; i <= 7; i++) {
		var intValue = Math.floor(Math.random() * ((arrCharacters.length - 1)));
		retVal = retVal + arrCharacters[intValue];
	}
	return retVal.toLowerCase();
};

var randomize8CharsCaseSensitive = function () {
	var arrCharacters = ( "0123456789AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz" );
	var retVal = "";
	for (var i = 0; i <= 7; i++) {
		var intValue = Math.floor(Math.random() * ((arrCharacters.length - 1)));
		retVal = retVal + arrCharacters[intValue];
	}
	return retVal;
};

function getEntityTypes() {
	return "activities,profiles,ventures,posts,resources";
}

function getSpamTypes() {
	return "posts";
}

function getRatingTypes() {
	//Add in documents/resources/article once they have been fleshed out
	return "games,resources,ventures";
}

function checkRippleUpdate(oldObj, newObj) {
	var returnVal = false;
	for (var key in oldObj) {

		if (typeof oldObj[key] === 'object') {
			returnVal = checkRippleUpdate(oldObj[key], newObj[key])
		}
		else if (oldObj[key] !== newObj[key]) {
			returnVal = true;
			break;
		}
	}

	return returnVal;
}

function resolveEntity(lookup, language, index) {
	//lookup could be a _id, username, email address or key.

	//Check _id
	var query = {
		query: {
			field: {
				"_id": lookup
			}
		}
	};
	log.debug(format('Attempting to resolve id %s to an entity.', lookup));
	var res = search(query, index, getEntityTypes());
	if (res.length) {
		log.debug(format('Found %s entity which matches the id %s.', res[0].dataType, lookup));
		return res[0]._id;
	}

	//Check username
	query = {
		query: {
			field: {
				"username": lookup
			}
		}
	};
	log.debug(format('Attempting to resolve %s as a username field.', lookup));
	res = search(query, index, getEntityTypes());
	if (res.length) {
		log.debug(format('Found %s entity which matches the username %s.', res[0].dataType, lookup));
		return res[0]._id;
	}

	//Check email address
	query = {
		query: {
			field: {
				"accountEmail.address": lookup
			}
		}
	};
	log.debug(format('Attempting to resolve %s as an email field.', lookup));
	res = search(query, index, getEntityTypes());
	if (res.length) {
		log.debug(format('Found %s entity which matches the email %s.', res[0].dataType, lookup));
		return res[0]._id;
	}

	//Check postCategory
	query = {
		"query": {
			"bool": {
				"must": [
					{ "field": { "key": "postCategories" } },
					{ "field": { "refData._id": lookup } }
				]
			}
		}
	};
	log.debug(format('Attempting to resolve %s as a post category.', lookup));
	res = search(query, index, "refLists");
	if (res.length) {
		log.debug(format('Found a post category which matches the id %s.', lookup));
		return lookup;
	}

	//Check key
	log.debug(format('Attempting to resolve resource key %s and locale %s as a resource.', lookup, language));

    var {getResourceByKey} = require('api/resources');
	var resource = getResourceByKey(lookup, language, index);
	if (resource) {
		log.debug(format('Found %s object which matches the key %s.', resource.dataType, lookup));
		return resource._id;
	}


	log.debug(format('No object found which matches %s.', lookup));
	return null;
}

function saveValidationError(req, error) {
	log.error('Validation error on property: {}, {}', error.property, error.message);
	if (error.message.indexOf("additional properties") > 0) {
		req.addError(errors.ERR_NO_ADDITIONAL_PROPS, [], error.property);
	}
	else if (error.message.indexOf("found, but") > 0) {
		req.addError(errors.ERR_INVALID_TYPE, [], error.property);
	}
	else if (error.message.indexOf("not optional") > 0) {
		req.addError(errors.ERR_MISSING_NOT_OPTIONAL, [], error.property);
	}
	else {
		req.addError(errors.ERR_UNKNOWN_VALIDATION, [], error.property);
	}


    
}

function createLocale(lang) {
	if (typeof lang !== 'string') return lang;
	if (/[-_]/i.test(lang)) {
		var [language, country] = lang.split(/[-_]/);
        return new Locale(language, country);
	} else {
        return new Locale(lang);
	}
}

function getSchema(schemaType, index) {
	var {baseSchema} = require('schemas/_base/' + schemaType);
	var baseManip = JSON.parse(JSON.stringify(baseSchema));
	try {
		var {abridgedSchema} = require('schemas/' + index + '/' + schemaType);
		var abridgedManip = JSON.parse(JSON.stringify(abridgedSchema));
		mergeObjectValues(abridgedManip.properties, baseManip.properties);
		return baseManip;
	}
	catch (e) {
		return baseManip;
	}
}

function buildAbsolutePath(req, path, stripFromRight) {
	var servletRequest = req.env.servletRequest;
	var url = servletRequest.getRequestURL();
	if (!path) return url.toString();

	if (stripFromRight && stripFromRight > 0) {
		//Split on /, pop off from right and reform url
		var urlList = url.toString().split("/");
		while (stripFromRight > 0) {
			urlList.pop();
			stripFromRight--;
		}
		url = "";
		for (var i = 0; i < urlList.length; i++) {
			var appendVal = "/"
			url = url + urlList[i] + appendVal;
		}

	}
	return url + path;
}

function getRelatedIds(actObj, index) {

	var idArray = [];
	switch (index) {
        case "gc":
            getGCFollowedUserIds(actObj.actor, idArray, index);
            break;
		case "nep":
			switch (actObj.direct.dataType) {
				case "spMessages":
					getServiceProviderIds(actObj.about, idArray, index);
					break;
				default:
					getNEPCollabIds(actObj.actor, idArray, index);
					getNEPCollabIds(actObj.direct, idArray, index);
					getNEPCollabIds(actObj.about, idArray, index);
			}
			break;
	}
	return idArray;
}

function getGCFollowedUserIds(obj, idArray, index) {
    //do this so the user is always getting their own activities in their stream
    idArray.push(obj._id);

    var mapFollowing = store.getMap(index, "following");
    var follows = mapFollowing.get(
        { query:
        {
            query_string :
            {
                query : "entityId:"+obj._id
            }
        }
    });

    if(follows.length > 0) {
        for(var i=0; i<follows.length; i++) {
            idArray.push(follows[i].followedById);
        }
    }
}

function getNEPCollabIds(obj, idArray, index) {
	var mapVentures = store.getMap(index, "ventures");
	var mapProfiles = store.getMap(index, "profiles");

	//This check ensure that we have an abbv object,
	//As sometimes the about object can be empty.
	if (obj && obj._id) {
		if (obj.dataType === "profiles" || obj.dataType === "ventures") {
			idArray.push(obj._id);

			switch (obj.dataType) {
				case "profiles":

					//Get all of the actors business collaborator ids
					var actorProf = mapProfiles.get(obj._id);
					if (actorProf) {
						actorProf.businesses.forEach(function (abbrevBiz) {
							var biz = mapVentures.get(abbrevBiz._id);
							biz.collaborators.forEach(function (collab) {
								idArray.push(collab.user._id);
							});
						});
					}

					break;

				case "ventures":
					var biz = mapVentures.get(obj._id);
					if (biz) {
						biz.collaborators.forEach(function (collab) {
							idArray.push(collab.user._id);
						});
					}
					break;
			}
		}

	}


}

function getServiceProviderIds(obj, idArray, index) {

	var mapVentures = store.getMap(index, "ventures");
	var mapFollowing = store.getMap(index, "following");

	//Start by pushing the servoce provider _id into the array
	idArray.push(obj._id);


	var biz = mapVentures.get(obj._id);
	if (biz) {
		biz.collaborators.forEach(function (collab) {
			idArray.push(collab.user._id);
		});
	}

	var follows = mapFollowing.get(
			{ query: {
				query_string: {
					query: "entityId:" + obj._id + " AND silence:false"
				}
			}
			});

	if (follows) {
		follows.forEach(function (collab) {
			idArray.push(collab.followedById);
		});
	}

}


function textsearchcontroller(request, query) {
	var localeTerm = getLocaleTerms(request);
	log.debug("Locale: " + localeTerm);

	var from = request.params.from;
	var size = request.params.size;
	var sort = request.params.sort || 'asc';
	var sortField = request.params.sortField;
	var dataType = request.params.dataType;


	if (sortField) {
		query.sort = [
			{}
		];
		query.sort[0][sortField] = sort;
	}
	var totalCount = search(query, request.index, dataType).length;
	if (from) {
		query.from = from;
	}
	if (size) {
		query.size = size;
	}

	var results = search(query, request.index, dataType);
	var returnObj = {
		results: results,
		totalSearchCount: totalCount
	};
	return returnObj;

}

/**
 * Returns an array of string terms for the current request locale.
 *
 * @param req
 * @return {Array}
 */
function getLocaleTerms(req) {
	var locale = req.env.servletRequest.getLocale();
	var localeTerm = [locale.toString()];
	if (locale.getCountry()) localeTerm.push(locale.getLanguage());
	localeTerm = localeTerm.join(' ');
	return localeTerm;
}

//todo: this is currently used by both likes and views. Does a replacement for this already exist in utils?
function getObjs(id, index) {

	var query = {
		query: {
			field: {
				"_id": id
			}
		}
	};

	//Array back
	var res = search(query, index, getEntityTypes());
	var returnArray = [];
	if (res.length) {
		returnArray.push(res[0]);

		if (res[0].dataType === "resources") {
			//print("KEY " + res[0].key);
			query = {
				query: {
					field: {
						key: res[0].key
					}
				}
			};
			var mapResources = store.getMap(index, "resources");
			var resources = mapResources.get(query);

			resources.forEach(function (resource) {
				if (resource._id != id) {
					returnArray.push(resource);
				}
			});
			//print("SIZE "+returnArray.length + " " + res[0].key);
		}
	}

	return returnArray;

}
;

function generateProfVerifyToken(index, profile) {
	var mapTokens = store.getMap(index, "profileVerificationTokens");

	var tokenObj = {
		dataType: 'profileVerificationTokens',
		dateCreated: standardizedNow(),
		userId: profile._id,
		emailAddress: profile.accountEmail.address
	};

	// Generate Token
	do {
		tokenObj._id = randomize8Chars();
	} while (doesProfVerifyTokenExist(index, tokenObj._id));

	// 72 Hour Time To Live
	mapTokens.put(tokenObj, 72, TimeUnit.HOURS);

	return  tokenObj._id;
}

function doesProfVerifyTokenExist(index, token) {
	var mapTokens = store.getMap(index, "profileVerificationTokens");
	return !!mapTokens.get(token);
}

//Currently used by service provider data seeding
function generateSlug(string) {
	string = string.toLowerCase();
	string = string.replace(/[^a-z0-9]+/g, '-');
	string = string.replace(/^-|-$/g, '');

	return string;
}


/**
 * Convert an ISO 8601 string to a JS Date object. The string passed in can have any types of
 * separators between months or time.
 *
 * @param s
 * @return {Date}
 */
function iso8601ToDate(s) {
	var d = new Date();
	var [date,time] = s.replace(/[^0-9T]/g, '').split('T');
//	log.info('string: ' + s + ', date: {}, time: {}', date, time);
	d.setUTCFullYear(parseInt(date.substring(0, 4)));
	d.setUTCMonth(parseInt(date.substring(4, 6).replace(/^0/, '')) - 1);
	d.setUTCDate(parseInt(date.substring(6, 8).replace(/^0/, '')));
	d.setUTCHours(parseInt(time.substring(0, 2).replace(/^0/, '')));
	d.setUTCMinutes(parseInt(time.substring(2, 4).replace(/^0/, '')));
	d.setUTCSeconds(parseInt(time.substring(4, 6).replace(/^0/, '')));
	d.setUTCMilliseconds(0);
	return d;
}

/**
 * Convert a JS date object to an ISO8601 string representation. Optional separator characters
 * for date and time can be supplied. Default values for separators are provided.
 *
 * @param {Date} d A JS date object to format
 * @param {String} dateSep Separator for date terms. Default is '-'.
 * @param {String} timeSep Separator for time terms. Default is ':'.
 * @return {String} The ISO8601 formatted date and time value.
 */
function dateToISO8601(d, dateSep, timeSep) {
	function pad(n) {
		return n < 10 ? '0' + n : n
	}

	if (typeof dateSep !== 'string') dateSep = '-';
	if (typeof timeSep !== 'string') timeSep = ':';

	return d.getUTCFullYear() + dateSep
			+ pad(d.getUTCMonth() + 1) + dateSep
			+ pad(d.getUTCDate()) + 'T'
			+ pad(d.getUTCHours()) + timeSep
			+ pad(d.getUTCMinutes()) + timeSep
			+ pad(d.getUTCSeconds());
}

