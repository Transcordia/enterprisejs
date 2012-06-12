/**
 * @module api/topics
 *
 * @fileOverview This file handles all of the REST apis dealing with topics. A topic is the
 * fundamental unit in TopicBoard storing a single news feed or article.
 *
 * var topic = {
 *      title: '',
 *      link: '',
 *      poster: {
 *      },
 *      thumb: '',
 *      date: '',
 *      comments: [
 *          { msg: '', date: '', author: { name: '', email: '' }, flagged: 0 }
 *      ],
 *      likes: [
 *          { name: '', email: '' }
 *      ],
 *      content: '',
 *      tags: ['', '']
 * }
 *
 * POST /topics
 * GET  /topics
 * GET  /topics/id/:id
 * GET  /topics/ids/:id,:id,:id
 * PUT  /topics/id/:id
 * DEL  /topics/id/:id
 * GET  /topics/id/comments
 * POST /topics/id/comments
 * DEL  /topics/id/comments/:id
 * GET  /topics/id/likes
 * POST /topics/id/likes
 * DEL  /topics/id/likes/:id
 * GET  /topics/newest
 * GET  /topics/popular
 * GET  /topics/likes
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
 *                 example, /topics/popular?sort=desc will result in a list of entities sorted
 *                 by the least popular.
 *                 Usage: sortDir=asc
 *
 *     sortField:  The string name of the property alias to sort on. Overriden if the url
 *                 supplies a sort alias.
 *                 Usage: sortField=likes
 *
 *     tags:       Restricts the list to topics which contain a tag which appears in the comma
 *                 separated list of tags.
 *                 Usage: stages=node,async
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
 * @description Retrieve all (at most 100 profiles) topics in default sort order.
 *
 * todo: Define what default sort order is. Default sorting should emphasize the "hotter" items
 * based on factors such as newness, likes, and views.
 *
 * @name /topics/
 * @example GET /topics
 *
 * @param {Object} req the current request object
 * @returns {Array} an array of topics.
 */
app.get('/', function (req) {
	return json({
        topics: true
    });
});

app.get('/id/:id', function (req, id) {
	return json({
        topics: true
    });
});

