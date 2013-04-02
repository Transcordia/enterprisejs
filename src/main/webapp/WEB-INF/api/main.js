/**
 * @fileOverview Entry point for all api web service calls.
 */
var httpclient = require('ringo/httpclient');
var log = require('ringo/logging').getLogger(module.id);
var {json} = require('ringo/jsgi/response');

var fileUpload = require('ringo/utils/http');
var {Headers} = fileUpload;

var {Application} = require("stick");
var {trimpath, trimpathResponse, registerHelper} = require( 'trimpath' );

var {processUrl, iso8601ToDate, dateToISO8601, preferredArea, getAbstractImage, abstractImageOrientation} = require('utility/parse');
var {getZociaUrl, getZociaBase, getElasticBase} = require('utility/getUrls');
var {encode} = require('ringo/base64');

var store = require('store-js');

registerHelper( {
    include: function ( path, context ) {
        return trimpath( path );
    },
    ctx: function ( url ) {
        return ctx( url );
    }
} );

function ctx( url ) {
    // Only prepend the context path if the URL is a relative
    if ( /^\//.test( url ) ) {
        var req = getRequest();
        if ( !req ) {
            throw 'Function ctx requires a request object to be known to the application.';
        }

        // Get the servlet's context path
        var contextPath = req.env.servletRequest.contextPath;
        url = contextPath + url;
    }
    return url;
}

function getRequest() {
    var app = require( module.resolve( 'main' ) ).app;
    if ( app ) return app.request;
    return null;
}

var app = exports.app = Application();
app.configure('notfound', 'params', 'mount', 'route');

app.get('/', function (req) {
	return json({
		api: true,
		path: req.pathInfo
	});
});

app.post('/articles', function(req){
    var article = req.postParams.article;

    delete article.images;
    delete article.layout;

    article.key = article.title.replace(/ /g, '+');
    article.format = "article";
    article.locale = "en";

    var opts = {
        url: getZociaUrl(req) + '/resources/',
        method: 'POST',
        data: JSON.stringify(article),
        headers: Headers({ 'x-rt-index': 'ejs', 'Content-Type': 'application/json' }),
        async: false
    };

    return _simpleHTTPRequest(opts);
});

app.post('articles/image', function(req){
    var image = req.postParams.image;

    var opts = {
        url: getZociaUrl(req) + '/resources/',
        method: 'POST',
        data: JSON.stringify(image),
        headers: Headers({ 'x-rt-index': 'ejs', 'Content-Type': 'application/json' }),
        async: false
    };

    return _simpleHTTPRequest(opts);
})

//editing an article
app.put('/articles', function(req){
    var article = req.postParams.article;

    var map = store.getMap('ejs', 'articles');

    map.put(article);
    return json(article, 201);
});

app.get('/articles/:id', function(req, id){
    var opts = {
        url: getZociaUrl(req) + '/resources/' + id,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'ejs', 'Content-Type': 'application/json' }),
        async: false
    };

    return _simpleHTTPRequest(opts);
});

//gets a list of articles sorted by rating
app.get('/articles', function(req){
    var opts = {
        url: getZociaUrl(req) + '/resources/articles/rating/?from=' + req.params.from + '&size=' + req.params.size,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'ejs', 'Content-Type': 'application/json' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    var articles = JSON.parse(exchange.content);

    articles.forEach(function(article){
        var image;

        if(article.thumbnail != ""){
            image = {
                h: article.imageHeight,
                w: article.imageWidth
            };
        }else{
            image = false;
        }

        article.layout = preferredArea(article.title, article.description, image);
        article.thumbnailOrientation = abstractImageOrientation(image);
    });

    return json({
        'status': exchange.status,
        'content': articles,
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    });
});

//processing articles is in utility/parse.js
app.post('/processurl', function(req){
    return json(processUrl(req.postParams.url));
});

//increases the view count of an article
app.put('/articles/views/:id', function(req, id){
    var article = req.postParams;

    article.views ++;

    var opts = {
        url: getZociaUrl(req) + '/resources/' + id,
        method: 'PUT',
        data: JSON.stringify(article),
        headers: Headers({ 'x-rt-index': 'ejs',
            'Content-Type': 'application/json',
            'Authorization': _generateBasicAuthorization('backdoor', 'Backd00r')}),
        async: false
    };

    return _simpleHTTPRequest(opts);
});

/**
 * Sorts the list of articles according to score (this might be temporary, and removed if/when we switch over to zocia which would have sorting as part of elasticsearch)
 * @param articles
 */
function sortArticles(articles)
{
    articles.sort(function(a, b) {
        //we actually want higher scores to move to the top, so this is the reverse the comparison on mdn
        if(a.rating > b.rating)
        {
            return -1;
        }
        if(a.rating < b.rating)
        {
            return 1;
        }

        return 0;
    });
}

/**
 * Function for calculating the score of an article, using the hacknews style scoring algorithm .
 * This drops the score based heavily on time, so newer articles have a higher score, and thus, higher rank, than older ones
 * even those with more views
 * Currently, this only counts views as part of the popularity. There may be a point where "likes" or other such values are included
 *
 * @param article Object containing the article
 */
function calculateScore(article)
{
    var MILLISECONDS_PER_HOUR = 3600000;
    var age = Math.floor((Date.now() - iso8601ToDate(article.dateCreated).getTime())/MILLISECONDS_PER_HOUR);
    var gravity = 2.2;
    article.rating = (article.views) / (Math.pow(age + 2, gravity));
    //article.age = age;
}

/**
 * Calculates the score for all articles currently in the map. Saves the resulting score (and age in hours) back to the map
 * This is run as part of a cron job, and likely doesn't need to be called outside of that, or when seeding the data
 */
app.get('/articles/score', function(req) {
    var opts = {
        url:getElasticBase(req) + '/ejs/resources/_search?search_type=scan&scroll=1m&size=100',
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'ejs', 'Content-Type': 'application/json' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    var content = JSON.parse(exchange.content);
    var scrollId = content._scroll_id;

    opts = {
        url:getElasticBase(req) + '/_search/scroll?scroll=1m&scroll_id=' + scrollId,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'ejs', 'Content-Type': 'application/json' }),
        async: false
    };

    exchange = httpclient.request(opts);
    content = JSON.parse(exchange.content);

    var articles = content.hits.hits;

    while(articles.length > 0){
        articles.forEach(function(obj){
            var article = obj._source;

            calculateScore(article);

            var scoreOpts = {
                url:getZociaUrl(req) + '/resources/' + article._id,
                method:'PUT',
                data:JSON.stringify(article),
                headers:Headers({ 'x-rt-index':'ejs',
                    'Content-Type':'application/json',
                    'Authorization':_generateBasicAuthorization('backdoor', 'Backd00r')}),
                async:false
            };

            var scoreExchange = httpclient.request(scoreOpts);
        });

        opts = {
            url:getElasticBase(req) + '/_search/scroll?scroll=1m&scroll_id=' + scrollId,
            method: 'GET',
            headers: Headers({ 'x-rt-index': 'ejs', 'Content-Type': 'application/json' }),
            async: false
        };

        exchange = httpclient.request(opts);
        content = JSON.parse(exchange.content);
        articles = content.hits.hits;
    }

    return json(true);
});

function _simpleHTTPRequest(opts) {
    var exchange = httpclient.request(opts);

    return json({
        'status': exchange.status,
        'content': JSON.parse(exchange.content),
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    });
}

function _generateBasicAuthorization(username, password) {
    var header = username + ":" + password;
    var base64 = encode(header);
    return 'Basic ' + base64;
}
/*
    Liking commented out because it relies on zocia at the moment.
//likes a specific object. todo: can anonymous users like something?
app.post('/utility/like/:id', function(req, id) {
    var opts = {
        url: getZociaUrl(req) + "/likes/" + req.auth.principal.id + "/" + id,
        method: 'POST',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    return json(JSON.parse(exchange.content));
});

//checks to see if a user has already liked this particular object, if so, returns true, otherwise, returns false
app.get('/utility/like/:id', function(req, id) {
    if(!req.auth.isAuthenticated) {
        return json(false);
    }

    var opts = {
        url: getZociaUrl(req) + "/likes/" + req.auth.principal.id + "/" + id,
        method: 'GET',
        headers: Headers({ 'x-rt-index': 'gc' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    if(exchange.status === 404) {
        return json(false);
    } else {
        return json(true);
    }
});

//deletes a like relationship, effectively decreasing total likes by one
app.post('/utility/unlike/:id', function(req, id) {
    var opts = {
        url: getZociaUrl(req) + "/likes/" + req.auth.principal.id + "/" + id,
        method: 'DELETE',
        headers: Headers({ 'x-rt-index': 'gc', 'Authorization': _generateBasicAuthorization('backdoor', 'Backd00r') }),
        async: false
    };

    var exchange = httpclient.request(opts);

    return json(JSON.parse(exchange.content));
});   */