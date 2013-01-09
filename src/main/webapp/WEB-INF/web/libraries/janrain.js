/*
 * Copyright (c) 2010, Pykl Studios <admin@pykl.com>, All rights reserved.
 */
var log = require('ringo/logging').getLogger(module.id);

var {forceLogin,
	forceLoginWithUsername,
	roundTableAjaxRequest,
	ajaxRequest,
	getProfileFromId} = require('libraries/common-io');

export('JanRain', 'processAuthToken', 'unlink');

var URL_AUTH_INFO = 'https://rpxnow.com/api/v2/auth_info';
var JANRAIN_API = 'fe32ff6109e1ffb7c1d3737b1511ca1d01e75b58';

/**
 * Submit info to Janrain
 */
function JanRain(token) {

	function getAuthInfo() {
		// Submit token to Janrain to get info about user
		return callRpx(URL_AUTH_INFO);
	}

	function callRpx(url) {
		if (!url) throw 'Url is required field';

		var exchange = ajaxRequest({
			"url": url + '?token=' + token + '&apiKey=' + JANRAIN_API,
			"method": 'POST'
		});

		log.info('Call to RPX: ' + url + ', method: POST, status: ' + exchange.status);
		if (exchange.success) {
			log.info("Success! " + exchange.content);
			return JSON.parse(exchange.content);
		} else {
			log.info("Failure! " + exchange.content);
		}

		throw('Unexpected error code received from rpxnow server.');
	}

	Object.defineProperty(this, "authInfo", {
	    get: function() {
		    return getAuthInfo();
	    }
	}, { enumerable: true, configurable: true });

	return this;
}

/**
 * Process the response from Janrain; log the user in if possible
 */
function processAuthToken(thirdPartyResults, request)  {

	// User authenticated successfully
	if (thirdPartyResults.stat === 'ok') {
		
		// If user has already logged in, that means they're trying to link an additional account
		if (request.authenticatedId) {

			// Get the user's NEP profile
			var profile = getProfileFromId(request.authenticatedId);

			 log.info("Found profile " + profile + " from _id " + request.authenticatedId);

			// Attempt to map the user on Janrain's servers using the _id property
			var exchange = ajaxRequest({
				"url": 'https://rpxnow.com/api/v2/map?apiKey=' + JANRAIN_API + '&primaryKey=' + profile._id + '&identifier=' + thirdPartyResults.profile.identifier
			});

			 log.info("Trying to map additional account. Result: " + exchange.content);

			// Push additional nonsense on the stack
			var data = {};

			data.thirdPartyLogins = profile.thirdPartyLogins || [];

			// Make sure that there aren't duplicates
			var dupe = false;
			data.thirdPartyLogins.forEach(function (profile) {
				if (profile.identifier === thirdPartyResults.profile.identifier) {
					dupe = true;
				}
			});		

			if (dupe === false) {
				data.thirdPartyLogins.push({ 
					"identifier": thirdPartyResults.profile.identifier, 
					"values": thirdPartyResults 
				});

				// Update that nonsense
				var exchange = roundTableAjaxRequest({
					'url': '/profiles/' + request.authenticatedId,
					'method': 'PUT',
					'data': data
				});

				// Try to refresh here!
	   			var results = roundTableAjaxRequest({
	 				'url': '/utilities/refresh'
	 			});

				 log.info("Update result: " + JSON.stringify(exchange));
			}

			return true;
		} else if (thirdPartyResults.profile.primaryKey && thirdPartyResults.profile.primaryKey !== "undefined") {
			// If the user already has a mapped account, log them in automatically
			var profile = getProfileFromId(thirdPartyResults.profile.primaryKey);
			
			if(profile != null)
			{
				// Log in using the profile object that we found
				forceLoginWithUsername(profile.username);
			} else {
				//if we don't find a profile object, then we're probably using a third party account that no longer has a link to an account here 
				return false;
			}

			 log.info("Successfully found mapping for user " + profile.username);

			return true;
		} else {
			// Otherwise, search for a user with the associated account info, and log that person in
			var exchange = roundTableAjaxRequest({
				"url": '/profiles/search',
				"data": {
					"query": { 
						"query_string": {  
							"fields" : [
								"thirdPartyLogins.values.profile.providerName", 
								"thirdPartyLogins.values.profile.displayName"
							],
							"query" : thirdPartyResults.profile.providerName.replace('!', '') + ' AND ' + thirdPartyResults.profile.displayName,
							"use_dis_max" : true 
						} 
					}
				},
				"method": 'POST'
			});

			try {
				var users = JSON.parse(exchange.content);		
			} catch (e) {
				var users = [];
				log.error("Unexpected response from RoundTable: " + exchange.content);
			}
			
			if (users && users.length > 0) {
				// REST API returns an array
				var profile = users[0];

				 log.info('Found user with associated account! Trying to log in ' +  profile.username);
				
				// Attempt to map the user on Janrain's servers using the _id property
				exchange = ajaxRequest({
					"url": 'https://rpxnow.com/api/v2/map?apiKey=' + JANRAIN_API + '&primaryKey=' + profile._id + '&identifier=' + thirdPartyResults.profile.identifier
				});

				 log.info("Mapping result: " + exchange.content);

				// Log in using the profile object that we found
				forceLoginWithUsername(profile.username);

				return true;
			}
		}

		 log.info("Can't find the user with thirdPartyLogins.providerName: " + thirdPartyResults.profile.providerName + " and thirdPartyLogins.displayName " + thirdPartyResults.profile.displayName);
	}

	return false;
}

/**
 * @name unlink
 * @description Removes a social network entry in a user's profile
 * @param {String} userId
 * @param {string} identifier The OpenID identifier string
 * @returns {Boolean} results of the unlink process
 */
var unlink = function (userId, identifier) {
	// Call Janrain removal process - will also un-auth from provider (but only Facebook aparently)
	var exchange = ajaxRequest({
		"url": 'https://rpxnow.com/api/v2/unmap?apiKey=' + JANRAIN_API + '&primaryKey=' + userId + '&identifier=' + identifier + '&unlink=true'
	});

	// log.info('Trying to unlink: https://rpxnow.com/api/v2/unmap?apiKey=' + JANRAIN_API + '&primaryKey=' + userId + '&identifier=' + identifier + '&unlink=true');

	return exchange.success;
};