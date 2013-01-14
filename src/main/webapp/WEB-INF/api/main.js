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

    log.info('Page title is: {}', titleText);

    // look for any link elements with a type attribute that has a value of "application/rss+xml"
    // <link rel="alternate" type="application/rss+xml" title="RSS 2.0" href="http://www.webdesigndev.com/feed" />
    jsoupElements = jsoupDocument.select("link[type=application/rss+xml]");

    //var element = jsoupElements.first();
    var feedUrl = jsoupElements.attr('href');

    var response = parseRSSFeed(feedUrl, titleText);

    return json({
        response: response
    });
});

function parseRSSFeed(feedUrl, title){
    // We'd like to get a description, title, content, and images for each feed made available by rss
    var feed = {};

    httpclient.request({
        url: feedUrl,
        method: 'GET',
        success: function(content, status, contentType, exchange){
            content = content.replace(/^<\?xml\s+version\s*=\s*(["'])[^\1]+\1[^?]*\?>/, "");
            var feedImages = [];
            var response = new XML(content.trim());
            var contentns = new Namespace("http://purl.org/rss/1.0/modules/content/");
            for(var item in response.channel.item){
                // in order to find the article we need, we're going to match the page title
                // with the title of the article
                if(response.channel.item[item].title.toString().match(/title/g) !== 'null'){
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
        },
        error: function(message, status, exchange){

        }
        //https://www.facebook.com/jamesohines
    });

    return feed;
}
