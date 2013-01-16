/**
 * @fileOverview Entry point for all api web service calls.
 */
var httpclient = require('ringo/httpclient');
var log = require('ringo/logging').getLogger(module.id);
var {json} = require('ringo/jsgi/response');

var {Application} = require("stick");

var Jsoup = Packages.org.jsoup.Jsoup;
var jsoupDocument = Packages.org.jsoup.nodes.Document;
var jsoupElements = Packages.org.jsoup.select.Elements;
var Parser = Packages.org.jsoup.parser.Parser;

var DocumentBuilderFactory = Packages.javax.xml.parsers.DocumentBuilderFactory;
//var DocumentBuilder = Packages.javax.xml.parsers.DocumentBuilder;
var URL = Packages.java.net.URL;

var app = exports.app = Application();
app.configure('notfound', 'params', 'mount', 'route');

app.get('/', function (req) {
	return json({
		api: true,
		path: req.pathInfo
	});
});

app.post('/processurl', function(req){
    var response = {};
    var feedLink;
    var url;

    jsoupDocument = Jsoup.connect(req.postParams.url).get();

    // find the title tag
    var title = jsoupDocument.select("title").text().toLowerCase();

    // look for an rss feed
    feedLink = jsoupDocument.select("link[type=application/rss+xml]");

    // does the title attribute contain the word 'comment'?
    if('comment'.indexOf(feedLink.attr('title').toLowerCase())){
        // look for any anchor tags on the page with an href that starts with feeds2.feedburner
        feedLink = jsoupDocument.select("a[href^=http://feeds2.feedburner]");
        url = feedLink.attr('href');
    }else{
        // use the url from the first selector
        url = feedLink.attr('href');
    }

    // could be an atom feed
    if(feedLink.size() === 0){
        // look for an atom feed
        feedLink = jsoupDocument.select("link[type=application/atom+xml]");
        url = feedLink.attr('href');
        response = parseFeed(url, title);

        // hate nested ifs BUT... if we STILL can't find a feed link
        if(feedLink.size() === 0){
            log.info('This url does not have any syndicated feeds');
            response = parseStructuredData(url);
        }
    }else{
        response = parseFeed(url, title);
    }

    return json({
        response: response
    });
});

function parseStructuredData(url){
    // look for meta tags
    var structuredData = {
        "title": "This URL Doesn't have RSS or atom feeds",
        "description": "Trust fund truffaut shoreditch, flexitarian you probably haven't heard of them consequat thundercats typewriter etsy selfies officia next level delectus vegan. Hoodie authentic accusamus, keytar lomo PBR art party. Reprehenderit fanny pack you probably haven't heard of them, letterpress stumptown brunch pork belly elit typewriter irure cray.",
        "content": "Trust fund truffaut shoreditch, flexitarian you probably haven't heard of them consequat thundercats typewriter etsy selfies officia next level delectus vegan. Hoodie authentic accusamus, keytar lomo PBR art party. Reprehenderit fanny pack you probably haven't heard of them, letterpress stumptown brunch pork belly elit typewriter irure cray. Commodo letterpress eu, farm-to-table flannel kale chips craft beer nostrud wayfarers chillwave retro est. Photo booth vero tofu tousled tempor chillwave, ex cillum pitchfork et labore mumblecore aliqua narwhal. Consequat pitchfork non, VHS umami meggings forage skateboard. Keytar in deserunt, sed vinyl nihil swag id master cleanse actually.",
        "images": []
    };
    return structuredData;
}

function parseFeed(feedUrl, title){
    // We'd like to get a description, title, content, and images for each feed made available by rss
    var feed = {};
    httpclient.request({
        url: feedUrl,
        method: 'GET',
        success: function(content, status, contentType, exchange){
            // parsing the xml with Jsoup
            var xmlDoc = Jsoup.parse(content, "", Parser.xmlParser());

            log.info('Jsoup xmlDoc.select(\'entry\').size() = {}', xmlDoc.select('entry').size());

            if(xmlDoc.select('entry').size() > 0){
                log.info('Parsing Atom Feed');
                feed = parseAtomFeed(xmlDoc, title);
            }else{
                log.info('Parsing RSS Feed');
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
            log.info('Unescaped feed item markup: {}', itemXml);

            var images = itemXml.select('img');
            var imagesIterator = images.listIterator();
            while(imagesIterator.hasNext()){
                var image = imagesIterator.next();
                var document = Jsoup.parse(image);
                var img = document.select('img').first();
                log.info('Image src: {}', image.attr('src'));
                feedImages.push(image.attr('src'));
            }

            feed = {
                "title": item.select('title').text(),
                "description": item.select('description').text(),
                "content": item.select('content|encoded').text(),
                "images": feedImages
            }

            break;
        }

    }

    return feed;
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
            log.info('Unescaped feed entry markup: {}', entryHtml);

            var images = entryHtml.select('img');
            var imagesIterator = images.listIterator();
            while(imagesIterator.hasNext()){
                var image = imagesIterator.next();
                var document = Jsoup.parse(image);
                var img = document.select('img').first();
                log.info('Image src: {}', image.attr('src'));
                feedImages.push(image.attr('src'));
            }

            feed = {
                "title": entry.select('title').text(),
                "description": entry.select('content').text(),
                "content": entry.select('content').text(),
                "images": feedImages
            }

            break;
        }

    }

    return feed;
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
