/**
 * @fileOverview Entry point for all api web service calls.
 */
var httpclient = require('ringo/httpclient');
var log = require('ringo/logging').getLogger(module.id);
var {json} = require('ringo/jsgi/response');

var {Application} = require("stick");

var {processUrl} = require('utility/parse');

var store = require('store-js');

var app = exports.app = Application();
app.configure('notfound', 'params', 'mount', 'route');

app.get('/', function (req) {
	return json({
		api: true,
		path: req.pathInfo
	});
});

app.post('/login', function(req){
    var response = {};
    httpclient.request({
        url: "https://www.googleapis.com/identitytoolkit/v1/relyingparty/createAuthUrl",
        method: 'POST',
        data: {
            "identifier": "jhines@pykl.com",
            "continueUrl": "192.168.10.143:8080/ejs",
            "openidRealm": "",
            "oauthConsumerKey": "",
            "oauthScope": "",
            "uiMode": "redirect",
            "context": "enterprisejs"
        },
        contentType: 'application/json',
        success: function(content, status, contentType, exchange){
            log.info('Content in the success callback: {}', content);
            response = content;
        },
        error: function(message, status, exchange){
            log.info('There was an error: {}', message);
            log.info('Exchange.content: ', JSON.stringify(exchange.content, null, 4));
        }
    });

    return json({});
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
