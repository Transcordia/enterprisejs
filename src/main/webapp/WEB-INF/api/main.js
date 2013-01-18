/**
 * @fileOverview Entry point for all api web service calls.
 */
var httpclient = require('ringo/httpclient');
var log = require('ringo/logging').getLogger(module.id);
var {json} = require('ringo/jsgi/response');

var {Application} = require("stick");

var Jsoup = Packages.org.jsoup.Jsoup;
var jsoupDocument = Packages.org.jsoup.nodes.Document;
var Parser = Packages.org.jsoup.parser.Parser;

var store = require('store-js');

var app = exports.app = Application();
app.configure('notfound', 'params', 'mount', 'route');

app.get('/', function (req) {
	return json({
		api: true,
		path: req.pathInfo
	});
});

app.post('/article', function(req){
    var article = req.postParams.article;

    var map = store.getMap('ejs', 'articles');

    map.put(article);
    return json(article, 201);
});

app.get('/article/:id', function(req, id){
    var map = store.getMap('ejs', 'articles');

    var article = map.get(id);

    return json(article);
});

app.post('/processurl', function(req){
    // 1. look for an rss feed url
    // 2. look for an atom feed url
    // 3. look for a feed url in document body
    // 4. parse structured data
    var response = {};
    var feedLink;
    var url;

    jsoupDocument = Jsoup.connect(req.postParams.url).get();
    // find the title tag
    var title = jsoupDocument.select("title").text().toLowerCase();

    // look for an rss feed
    feedLink = jsoupDocument.select("link[type=application/rss+xml]");
    // does the title attribute of this link tag contain the word 'comment'?
    // we don't want a comment feed
    if(feedLink.size() > 0 && (feedLink.attr('title').toLowerCase().indexOf('comment') === -1)){ // if not, parse the feed
        log.info('Rss/Atom feed found');
        url = feedLink.attr('href');

        // if this isn't an absolute url we have to add a protocol and domain
        if(url.indexOf('http') === -1){
            var parts = req.postParams.url.split(/^.*\/\/|\/.*/);
            url = 'http://' + parts[1] + url;
            // some relative urls contain two . characters; e.g. "..", get rid of those as well
            url = url.replace(/\.\./, '');
            log.info('Page domain name = {}', url);
        }

        response = parseFeed(url, title);

        return json({
            response: response
        });
    }

    // look for an atom feed
    feedLink = jsoupDocument.select("link[type=application/atom+xml]");
    if(feedLink.size() > 0){
        log.info('Atom feed found');
        url = feedLink.attr('href');
        response = parseFeed(url, title);

        return json({
            response: response
        });
    }

    // look for a feed url in document body; in this case "feedburner" feeds
    feedLink = jsoupDocument.select("a[href^=http://feeds2.feedburner]");
    if(feedLink.size() > 0){
        log.info('Feedburner feed found');
        url = feedLink.attr('href');
        response = parseFeed(url, title);

        return json({
            response: response
        });
    }

    // couldn't find any feeds? look for structured data
    log.info('This url does not have any syndicated feeds.');
    response = parseStructuredData(req.postParams.url);

    return json({
        response: response
    });
});

function parseStructuredData(url){
    log.info('Parsing structured data...');

    // look for Open Graph meta tags
    jsoupDocument = Jsoup.connect(url).get();

    var ogMeta = jsoupDocument.select('meta[property^=og:]');
    if(ogMeta.size() > 0){
        var structuredData = {
            "title": jsoupDocument.select('meta[property=og:title]').attr('content'),
            "description": jsoupDocument.select('meta[property=og:description]').attr('content'),
            "images": [jsoupDocument.select('meta[property=og:image]').attr('content')]
        };

        log.info('Structured data parsed by Jsoup: {}', JSON.stringify(structuredData, null, 4));
        return structuredData;
    }

    log.info('No structured data found. Returning an empty object');
    return {
        "images": []
    }
}

function parseFeed(feedUrl, title){
    // We'd like to get a description, title, content, and images for each feed
    var feed = {};
    httpclient.request({
        url: feedUrl,
        method: 'GET',
        success: function(content, status, contentType, exchange){
            // parsing the xml with Jsoup
            var xmlDoc = Jsoup.parse(content, "", Parser.xmlParser());

            if(xmlDoc.select('entry').size() > 0){
                log.info('Parsing Atom Feed...');
                feed = parseAtomFeed(xmlDoc, title);
            }else{
                log.info('Parsing RSS Feed...');
                feed = parseRSSFeed(xmlDoc, title);
            }
        },
        error: function(message, status, exchange){

        }
    });

    return feed;
}

function parseRSSFeed(xmlDoc, title){
    var feed = {};
    var feedImages = [];
    // could be an atom feed
    // ex4 won't parse atom feeds; using Jsoup's xml parser
    //var xmlDoc = Jsoup.parse(response, "", Parser.xmlParser());
    var items = xmlDoc.select('item');

    // iterate through the entries
    var iterator = items.listIterator();
    while(iterator.hasNext()){
        var item = iterator.next();

        var titles = processTitles(item.select('title').text(), title);

        if(titles.fullString.indexOf(titles.substring) !== -1){
            // unescape the html fragment
            // TODO: be sure to sanitize html
            var itemXml = Jsoup.parse(Parser.unescapeEntities(item, false));

            var images = itemXml.select('img');
            var imagesIterator = images.listIterator();
            while(imagesIterator.hasNext()){
                var image = imagesIterator.next();
                var document = Jsoup.parse(image);
                var img = document.select('img').first();
                feedImages.push(image.attr('src'));
            }

            feed = {
                "title": item.select('title').text(),
                "description": item.select('description').text(),
                "content": item.select('content|encoded').text(),
                "images": feedImages
            }

            log.info('RSS feed data parsed by Jsoup: {}', JSON.stringify(feed, null, 4));
            return feed;
        }

    }
}

function parseAtomFeed(xmlDoc, title){
    var feed = {};
    var feedImages = [];
    // could be an atom feed
    // ex4 won't parse atom feeds; using Jsoup's xml parser
    //var xmlDoc = Jsoup.parse(response, "", Parser.xmlParser());
    var entries = xmlDoc.select('entry');

    // iterate through the entries
    var iterator = entries.listIterator();
    while(iterator.hasNext()){
        var entry = iterator.next();

        var titles = processTitles(entry.select('title').text(), title)

        if(titles.fullString.indexOf(titles.substring) !== -1){
            // unescape the html fragment
            // TODO: be sure to sanitize html
            var entryHtml = Jsoup.parse(Parser.unescapeEntities(entry, false));

            var images = entryHtml.select('img');
            var imagesIterator = images.listIterator();
            while(imagesIterator.hasNext()){
                var image = imagesIterator.next();
                var document = Jsoup.parse(image);
                var img = document.select('img').first();
                feedImages.push(image.attr('src'));
            }

            feed = {
                "title": entry.select('title').text(),
                "description": entry.select('content').text(),
                "content": entry.select('content').text(),
                "images": feedImages
            }

            log.info('Atom feed data parsed by Jsoup: {}', JSON.stringify(feed, null, 4));
            return feed;
        }

    }
}

/*
This function takes in a feed article title and a web page title, converts the feed article to lowercase, decodes any html
entities, and assigns the title with a smaller length to a substring variable
 */
function processTitles(feedArticleTitle, pageTitle){
    var fullString = '', substring = '';
    feedArticleTitle = feedArticleTitle.toLowerCase();
    // html unescape feed article title
    feedArticleTitle = Parser.unescapeEntities(feedArticleTitle, false);

    // remove everything after pipe characters and hyphens from the page title
    pageTitle = pageTitle.replace(/\s\|.*/, '');

    if(feedArticleTitle.length >= pageTitle.length){
        fullString = feedArticleTitle;
        substring = pageTitle;
    }else{
        fullString = pageTitle;
        substring = feedArticleTitle
    }

    return {
        "fullString" : fullString,
        "substring" : substring
    }
}
