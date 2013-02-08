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

app.post('/articles', function(req){
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

app.get('/articles', function(req, id){
    var map = store.getMap('ejs', 'articles');
    var articles = [];

    var keySet = map.keySet();

    var iterator = keySet.iterator();
    while(iterator.hasNext()){
        var article = iterator.next();
        articles.push(map.get(article));
    }

    return json(articles);
});

app.post('/processurl', function(req){
    return json(processUrl(req.postParams.url));
});

app.get('/article/view/:id', function(req, id){
    var map = store.getMap('ejs', 'articles');

    var article = map.get(id);

    return json(article);
});

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
})