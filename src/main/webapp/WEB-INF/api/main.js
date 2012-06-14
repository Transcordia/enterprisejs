/**
 * @fileOverview Entry point for all api web service calls.
 */
var log = require('ringo/logging').getLogger(module.id);
var {json} = require('ringo/jsgi/response');

var {Application} = require("stick");
var {JanRain, processAuthToken} = require('libraries/janrain');

var app = exports.app = Application();
app.configure('notfound', 'params', 'mount', 'route');

app.mount('/topics', require('./topics'));
app.mount("/profiles", require("./profiles"));

app.get('/', function (req) {
	return json({
		api: true,
		path: req.pathInfo
	});
});

app.get('/user/', function(req) {
    return json({success: true});
});

app.post('/user/', function(request) {
    var params = request.params;
    var thirdPartyAccountInfo = '';

    // Deal w/ 3rd party login here
    if (params.token) {
        var thirdParty = new JanRain(params.token);
        //thirdPartyAccountInfo = thirdParty.authInfo;
        thirdPartyAccountInfo = {"stat": "ok", "profile":
        {"url": "https:\/\/www.google.com\/profiles\/101539563248779683803", "preferredUsername": "tbarchok", "email": "tbarchok@pykl.com",
            "name": {"formatted": "Todd Barchok", "givenName": "Todd", "familyName": "Barchok"},
            "displayName": "tbarchok", "identifier": "https:\/\/www.google.com\/profiles\/101539563248779683803", "verifiedEmail": "tbarchok@pykl.com",
            "primaryKey": "3547706e99f94f32a08232754a348e23", "providerName": "Google", "googleUserId": "101539563248779683803"}
        };

        // If we're able to log the user in w/ supplied 3rd party info, clear out the passed param
        if (processAuthToken(thirdPartyAccountInfo, request)) {
            // Try to redirect to the same page, so that the request object has an "authenticated" user attached to it
            if(session.getAttribute('SPRING_SECURITY_SAVED_REQUEST_KEY')){
                log.info("redirecting to: " + session.getAttribute('SPRING_SECURITY_SAVED_REQUEST_KEY').requestURL);
                return Response.redirect(session.getAttribute('SPRING_SECURITY_SAVED_REQUEST_KEY').requestURL);
            }else{
                return Response.redirect(String(request.scriptName + params.redirect));
            }
        }
        log.info("THIRD PARTY INFO: "+JSON.stringify(thirdPartyAccountInfo));
    }

    log.info("PARAMS: "+JSON.stringify(params));
    return json({success: true, method: 'post', token: params.token});
});
