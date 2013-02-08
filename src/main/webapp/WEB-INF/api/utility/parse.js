var httpclient = require('ringo/httpclient');
var log = require('ringo/logging').getLogger(module.id);

var Jsoup = Packages.org.jsoup.Jsoup;
var jsoupDocument = Packages.org.jsoup.nodes.Document;
var Parser = Packages.org.jsoup.parser.Parser;

function processUrl(pageUrl)
{
    // 1. look for an rss feed url
    // 2. look for an atom feed url
    // 3. look for a feed url in document body
    // 4. parse structured data
    var response = {};
    var feedLink;
    var feedUrl;

    jsoupDocument = Jsoup.connect(pageUrl).get();
    // find the title tag
    var title = jsoupDocument.select("title").text().toLowerCase();

    // look for an rss feed
    feedLink = jsoupDocument.select("link[type=application/rss+xml]");
    // does the title attribute of this link tag contain the word 'comment'?
    // we don't want a comment feed
    if(feedLink.size() > 0 && (feedLink.attr('title').toLowerCase().indexOf('comment') === -1)){ // if not, parse the feed
        log.info('Rss/Atom feed found');
        feedUrl = feedLink.attr('href');

        // if this isn't an absolute url we have to add a protocol and domain
        if(feedUrl.indexOf('http') === -1){
            var parts = pageUrl.split(/^.*\/\/|\/.*/);
            feedUrl = 'http://' + parts[1] + feedUrl;
            // some relative urls contain two . characters; e.g. "..", get rid of those as well
            pageUrl = pageUrl.replace(/\.\./, '');
            log.info('Page domain name = {}', pageUrl);
        }

        response = parseFeed(feedUrl, title, pageUrl);

        return {
            response: response
        };
    }

    // look for an atom feed
    feedLink = jsoupDocument.select("link[type=application/atom+xml]");
    if(feedLink.size() > 0){
        log.info('Atom feed found');
        feedUrl = feedLink.attr('href');
        response = parseFeed(feedUrl, title);

        return {
            response: response
        };
    }

    // look for a feed url in document body; in this case "feedburner" feeds
    feedLink = jsoupDocument.select("a[href^=http://feeds2.feedburner]");
    if(feedLink.size() > 0){
        log.info('Feedburner feed found');
        url = feedLink.attr('href');
        response = parseFeed(url, title);

        return {
            response: response
        };
    }

    feedLink = jsoupDocument.select("a[href^=http://feeds]");
    if(feedLink.size() > 0){
        log.info('Feedburner feed found');
        url = feedLink.attr('href');
        response = parseFeed(url, title);

        return {
            response: response
        };
    }

    // couldn't find any feeds? look for structured data
    log.info('This url does not have any syndicated feeds.');
    response = parseStructuredData(pageUrl);

    return {
        response: response
    };
}

function parseStructuredData(url){
    log.info('Parsing structured data...');

    // look for Open Graph meta tags
    jsoupDocument = Jsoup.connect(url).get();

    var ogMeta = jsoupDocument.select('meta[property^=og:]');
    if(ogMeta.size() > 0){
        var structuredData = {
            "title": jsoupDocument.select('meta[property=og:title]').attr('content'),
            "description": jsoupDocument.select('meta[property=og:description]').attr('content'),
            "content": '',
            "images": [
                {
                    "src": jsoupDocument.select('meta[property=og:image]').attr('content'),
                    "w": "",
                    "h": ""
                }
            ],
            "url": url,
            "date": standardizedNow(),
            "likes": 0
        };

        log.info('Structured data parsed by Jsoup: {}', JSON.stringify(structuredData, null, 4));

        return structuredData;
    }

    log.info('No structured data found. Returning an empty object');
    return {
        "images": []
    }
}

function parseFeed(feedUrl, title, pageUrl){
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
                feed = parseAtomFeed(xmlDoc, title, pageUrl);
            }else{
                log.info('Parsing RSS Feed...');
                feed = parseRSSFeed(xmlDoc, title, pageUrl);
            }
        },
        error: function(message, status, exchange){

        }
    });

    return feed;
}

function parseRSSFeed(xmlDoc, title, url){
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

            // does this feed have any media attributes?
            // parse the images in the media attributes of the feed
            var media = item.select('media|content[type^=image]');

            if(media.size() > 0){
                log.info('Getting images from media attributes');
                var mediaIterator = media.listIterator();
                var prevImageSize = 0, currImageSize;

                while(mediaIterator.hasNext()){
                    var media = mediaIterator.next();

                    // calculate the area of the images and only use the largest image
                    currImageSize = parseInt(media.attr('width')) * parseInt(media.attr('height'));

                    if(currImageSize > prevImageSize){
                        feedImages.shift();
                        //feedImages.push(media.attr('url'));
                        feedImages.push({
                            "src": media.attr('url'),
                            "w": "",
                            "h": ""
                        });
                    }

                    prevImageSize = currImageSize;
                }
            }else{
                var images = itemXml.select('img');
                var imagesIterator = images.listIterator();
                while(imagesIterator.hasNext()){
                    var image = imagesIterator.next();
                    var document = Jsoup.parse(image);
                    var img = document.select('img').first();
                    log.info('Feed image src: {}', image.attr('src'));
                    feedImages.push({
                        "src": image.attr('src'),
                        "w": "",
                        "h": ""
                    });
                }
            }

            feed = {
                "title": item.select('title').text(),
                "description": item.select('description').text(),
                "content": item.select('content|encoded').text(),
                "images": feedImages,
                "url": url,
                "date": standardizedNow(),
                "likes": 0
            }

            log.info('RSS feed data parsed by Jsoup: {}', JSON.stringify(feed, null, 4));
            return feed;
        }
    }

    // the article may have been too old, look for structured data
    log.info('Could\'t find this article in the rss feeds. Parsing structured data...');
    return parseStructuredData(url);
}

function parseAtomFeed(xmlDoc, title, url){
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
                feedImages.push({
                    "src": img.attr('src'),
                    "w": "",
                    "h": ""
                });
            }

            feed = {
                "title": entry.select('title').text(),
                "description": entry.select('content').text(),
                "content": entry.select('content').text(),
                "images": feedImages,
                "url": url,
                "date": standardizedNow(),
                "likes": 0
            }

            log.info('Atom feed data parsed by Jsoup: {}', JSON.stringify(feed, null, 4));
            return feed;
        }

    }

    // the article may have been too old, look for structured data
    log.info('Article was not in any available feeds.');
    return parseStructuredData(url);
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

/**
 *  Returns time stamp as a string YYYY-mm-ddTHH:mm:ssZ
 */
function standardizedNow(d) {
    if (!d) d = new Date();
    return dateToISO8601(d, '-', ':');
}

/**
 * Convert an ISO 8601 string to a JS Date object. The string passed in can have any types of
 * separators between months or time.
 *
 * @param s
 * @return {Date}
 */
function iso8601ToDate(s) {
    var d = new Date();
    var [date,time] = s.replace(/[^0-9T]/g, '').split('T');
//	log.info('string: ' + s + ', date: {}, time: {}', date, time);
    d.setUTCFullYear(parseInt(date.substring(0, 4)));
    d.setUTCMonth(parseInt(date.substring(4, 6).replace(/^0/, '')) - 1);
    d.setUTCDate(parseInt(date.substring(6, 8).replace(/^0/, '')));
    d.setUTCHours(parseInt(time.substring(0, 2).replace(/^0/, '')));
    d.setUTCMinutes(parseInt(time.substring(2, 4).replace(/^0/, '')));
    d.setUTCSeconds(parseInt(time.substring(4, 6).replace(/^0/, '')));
    d.setUTCMilliseconds(0);
    return d;
}

/**
 * Convert a JS date object to an ISO8601 string representation. Optional separator characters
 * for date and time can be supplied. Default values for separators are provided.
 *
 * @param {Date} d A JS date object to format
 * @param {String} dateSep Separator for date terms. Default is '-'.
 * @param {String} timeSep Separator for time terms. Default is ':'.
 * @return {String} The ISO8601 formatted date and time value.
 */
function dateToISO8601(d, dateSep, timeSep) {
    function pad(n) {
        return n < 10 ? '0' + n : n
    }

    if (typeof dateSep !== 'string') dateSep = '-';
    if (typeof timeSep !== 'string') timeSep = ':';

    return d.getUTCFullYear() + dateSep
        + pad(d.getUTCMonth() + 1) + dateSep
        + pad(d.getUTCDate()) + 'T'
        + pad(d.getUTCHours()) + timeSep
        + pad(d.getUTCMinutes()) + timeSep
        + pad(d.getUTCSeconds());
}

export('processUrl', 'iso8601ToDate', 'dateToISO8601');