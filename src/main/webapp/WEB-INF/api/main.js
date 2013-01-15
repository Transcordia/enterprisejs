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
    jsoupDocument = Jsoup.connect(req.postParams.url).get();

    // find the title tag
    var title = jsoupDocument.select("title").first();
    var titleText = title.text();

    // look for any link elements with a type attribute that has a value of "application/rss+xml"
    // <link rel="alternate" type="application/rss+xml" title="RSS 2.0" href="http://www.webdesigndev.com/feed" />
    jsoupElements = jsoupDocument.select("link[type=application/rss+xml]");
    var url = jsoupElements.attr('href');

    if(jsoupElements.size() === 0){
        log.info('This url does not have any syndicated feeds');
        var response = parseStructuredData(url);
    }else{
        var response = parseFeed(url, titleText.trim());
        log.info('Feed url: {}', url);
    }

    return json({
        response: response
    });
});

function parseStructuredData(url){
    // look for meta tags
    var structuredData = {
        "title": "Title of Article",
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
            content = content.replace(/^<\?xml\s+version\s*=\s*(["'])[^\1]+\1[^?]*\?>/, "");

            var response = new XML(content.trim());
            log.info('Value of response.channel: {}', response.channel);

            // is this an atom feed?
            if(response.channel === ''){
                log.info('Parsing Atom Feed');
                feed = parseAtomFeed(response, title);
            }else{
                log.info('Parsing RSS Feed');
                feed = parseRSSFeed(response, title);
            }
        },
        error: function(message, status, exchange){

        }
        //https://www.facebook.com/jamesohines
    });

    return feed;
}

function parseAtomFeed(response, title){
    var feed = {};
    var feedImages = [];
    // could be an atom feed
    // ex4 won't parse atom feeds; using Jsoup's xml parser
    log.info('Page title: {}', title);
    //log.info('Feed author: {}', response.author.name);
    var xmlDoc = Jsoup.parse(response, "", Parser.xmlParser());
    var entries = xmlDoc.select('entry');

    // iterate through the entries
    var iterator = entries.listIterator();
    while(iterator.hasNext()){
        var entry = iterator.next();

        if(title.search(entry.select('title').get(0).text()) !== -1){
            // unescape the html fragment
            var entryHtml = Jsoup.parse(Parser.unescapeEntities(entry, false));
            log.info('Unescaped Feed entry markup: {}', entryHtml);
            var images = entryHtml.select('img');
            var imagesIterator = images.listIterator();
            while(imagesIterator.hasNext()){
                var image = imagesIterator.next();
                document = Jsoup.parse(image);
                var img = document.select('img').first();
                log.info('Image src: {}', image.attr('src'));
                feedImages.push(image.attr('src'));
            }

            feed = {
                "title": entry.select('title').get(0).text(),
                "description": entry.select('content').get(0).text(),
                "content": entry.select('content').get(0).text(),
                "images": feedImages
            }
            break;
        }

    }

    return feed;
}

function parseRSSFeed(response, title){
    var feed = {};
    var feedImages = [];

    var contentns = new Namespace("http://purl.org/rss/1.0/modules/content/");
    for(var item in response.channel.item){
        if(title.search(response.channel.item[item].title.toString()) !== -1){
            // get as many images as possible
            var document = Jsoup.parse(response.channel.item[item].contentns::encoded);
            var images = document.select('img');

            // iterate through the images
            var iterator = images.listIterator();
            while(iterator.hasNext()){
                var image = iterator.next();
                // grab the source attribute of each image
                document = Jsoup.parse(image);
                var img = document.select('img').first();
                var src = img.attr('src');
                feedImages.push(src);
            }

            feed = {
                "title": response.channel.item[item].title.toString(),
                "description": response.channel.item[item].description.toString(),
                "content": response.channel.item[item].contentns::encoded.toString(),
                "images": feedImages
            }

            break;
        }
    }

    return feed;
}
