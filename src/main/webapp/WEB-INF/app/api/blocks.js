/**
 * @module api/blocks
 *
 * @fileOverview This file handles all /profiles rest calls by routing to the appropriate
 * function.
 *
 * The retrieval of profiles can be very specific or very general.
 *
 *     /profiles/:id               - Returns a specific profile
 *     /profiles/newest[/:count]   - Returns all profiles sorted by most recently modified
 *     /profiles/popular[/:count]  - Returns all profiles sorted by likes
 *     /profiles/views[/:count]    - Returns all profiles sorted by views
 *     /profiles/count             - Returns a count of all profiles.
 *
 * In addition to the URLs mentioned above, each GET request can also supply some additional
 * parameters which will affect the results:
 *     from:       This is a number which is an index into the result set. If you think of all
 *                 the results as an ordered list, 'from' indicates the index into that list for
 *                 the first element to be returned. Useful for pagination.
 *                 Usage: from=210
 *
 *     size:       This is a number which indicates the number of results to return.
 *                 Usage: size=50
 *
 *     sortDir:    A string value ('asc' or 'desc') that indicates the sort direction. For
 *                 example, /<entity>/popular?sort=desc will result in a list of entities sorted
 *                 by the least popular.
 *                 Usage: sortDir=asc
 *
 *     sortField:  The string name of the property alias to sort on. Overriden if the url
 *                 supplies a sort alias.
 *                 Usage: sortField=likes
 *                        GET /resources/newest
 *
 *     stages:     Restricts the list to entities from a particular stage of entrepreneurship.
 *                 The parameter may include multiple stages by delimiting the values with a
 *                 comma.
 *                 Usage: stages=startup,growth
 */

//  Requires
var log = require('ringo/logging').getLogger(module.id);
var {Application} = require('stick');
var {json} = require('ringo/jsgi/response');

//  Global Vars
var app = exports.app = Application();
app.configure('route');


/**
 * @function
 * @description HTTP Method: GET. Retrieve all profiles residing in the index specified by the
 *              request object (req.index). Also used to get multiple profiles (see 2nd example
 *              below).
 *
 *              At most only 100 profiles are returned.
 *
 * @name /profiles/
 * @example GET /
 * @example GET /?ids[]=213&ids[]=783
 *
 * @param {Object} req the current request object
 * @returns a JSGI response object of type application/json: an array of resource objects.
 *          CODE: 200 on success.
 */
app.get('/', function (req) {
	return json({
        blocks: true
    });
});

