/**
 * @fileOverview Entry point for all api web service calls.
 */
var httpclient = require('ringo/httpclient');
var log = require('ringo/logging').getLogger(module.id);
var {json} = require('ringo/jsgi/response');

var {Application} = require("stick");

var {processUrl, iso8601ToDate, dateToISO8601} = require('utility/parse');

var store = require('store-js');

var app = exports.app = Application();
app.configure('notfound', 'params', 'mount', 'route');

app.get('/', function (req) {
	return json({
		api: true,
		path: req.pathInfo
	});
});

//chooses an article layout based on the existence of an image, the length of the description
function assignLayout(article)
{
    var layout = 1;
    // an article can have a title, image, and description

    // if an article has no images assign a value of 1
    if(article.images.length === 0 && article.description !== ""){
        // if an article has no images and a long description
        if(article.description.split(" ").length > 70){
            return 4;
        }
        return 1;
    }

    // article has an image and a description
    if(article.images.length > 0 && article.description !== ""){
        // article has long description
        if(article.description.split(" ").length > 40){
            return 8;
        }

        if(article.description.split(" ").length < 20){
            return 1;
        }
    }else{
        return 1;
    }

    // if an article has an image but no description assign a value of 1
    //  and a description assign a value of 4,5
    return layout;
}

app.post('/articles', function(req){
    var article = req.postParams.article;

    if(article.layout === undefined) {
        // assign this article a layout based on its content
        //it's probably easier to do this once on article creation
        article.layout = assignLayout(article);
        log.info('This article was assigned a layout of ' + article.layout);
    }

    var map = store.getMap('ejs', 'articles');

    map.put(article);
    return json(article, 201);
});

//editing an article
app.put('/articles', function(req){
    var article = req.postParams.article;

    var map = store.getMap('ejs', 'articles');

    map.put(article);
    return json(article, 201);
});

app.get('/articles/:id', function(req, id){
    var map = store.getMap('ejs', 'articles');

    var article = map.get(id);

    return json(article);
});

//gets a list of articles
app.get('/articles', function(req){
    var map = store.getMap('ejs', 'articles');
    var articles = [];

    var keySet = map.keySet();

    var keySetArray = keySet.toArray();

    var numArticles = parseInt(req.params.numArticles);
    var page = parseInt(req.params.page);

    for(var article in keySetArray){
        articles.push(map.get(keySetArray[article]));
    }

    sortArticles(articles);

    var start = (page - 1) * numArticles;
    var end = 0;

    if(page * numArticles < articles.length){
        end = page * numArticles;
    }else{
        end = articles.length;
    }

    log.info('Starting index {} Ending index {}', start, end);

    articles = articles.slice(start, end);

    return json({"articles": articles, "totalArticles": keySetArray.length});
});

//processing articles is in utility/parse.js
app.post('/processurl', function(req){
    return json(processUrl(req.postParams.url));
});

//increases the view count of an article
app.get('/article/view/:id', function(req, id){
    var map = store.getMap('ejs', 'articles');

    var article = map.get(id);

    article.views++;

    map.put(article);

    return json({ "views": article.views });
});

/**
 * Sorts the list of articles according to score (this might be temporary, and removed if/when we switch over to zocia which would have sorting as part of elasticsearch)
 * @param articles
 */
function sortArticles(articles)
{
    articles.sort(function(a, b) {
        //we actually want higher scores to move to the top, so this is the reverse the comparison on mdn
        if(a.score > b.score)
        {
            return -1;
        }
        if(a.score < b.score)
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
    var age = Math.floor((Date.now() - iso8601ToDate(article.date).getTime())/MILLISECONDS_PER_HOUR);
    var gravity = 2.2;
    article.score = (article.views) / (Math.pow(age + 2, gravity));
    article.age = age;
}

/**
 * Calculates the score for all articles currently in the map. Saves the resulting score (and age in hours) back to the map
 * This is run as part of a cron job, and likely doesn't need to be called outside of that, or when seeding the data
 */
app.get('/articles/score', function(req) {
    var map = store.getMap('ejs', 'articles');
    var articles = [];

    var keySet = map.keySet();

    var iterator = keySet.iterator();
    while(iterator.hasNext()){
        var article = map.get(iterator.next());

        calculateScore(article);

        map.put(article);
    }
    log.info("Article score calculated. "+keySet.size()+" articles updated.");
    return json(true);
});
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