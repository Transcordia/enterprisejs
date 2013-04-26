/**
 * Created with IntelliJ IDEA.
 * User: toddbarchok
 * Date: 3/26/13
 * Time: 2:56 PM
 * This file handles all calls to /api/user
 * The main function is for processing openID requests from Google Identity Toolkit and generally creating and signing in and out users to the system
 */

var httpclient = require('ringo/httpclient');
var log = require('ringo/logging').getLogger(module.id);
var {json} = require('ringo/jsgi/response');

var {Application} = require('stick');
var app = exports.app = Application();
app.configure('notfound', 'params', 'mount', 'route');

var {getZociaUrl} = require('utility/getUrls');
var {encode} = require('ringo/base64');
var {Headers} = require('ringo/utils/http');

// Included for forcing users to be re-authenticated
var {SecurityContextHolder} = Packages.org.springframework.security.core.context;
var {RoundtableUser} = Packages.com.zocia.nep.security;
var {UsernamePasswordAuthenticationToken} = Packages.org.springframework.security.authentication;
var {PreAuthenticatedAuthenticationToken} = Packages.org.springframework.security.web.authentication.preauth;

//
app.post('/status', function(req) { console.log("USER STATUS INFO");
    return json({ "registered": true });
});

app.post('/login', function(req) {    console.log("user is now logged in");
    return json({ "status": "OK" });
});

/*
 This gets the data from various oauth providers that GIT supports, and decides what to do with it
 First we need to pass in that data back to GIT, which will return us a nice, easy to use format that we can be certain will contain various bits of information
 Once we get the users identity and other details, we need to search through the existing user accounts. If we find one that matches, then we log them in. Otherwise, we auto-create the account
 */
function checkUser(req, userDetails)
{
    //when sending in the parameters that we got back from GIT to the "verifyAssertion" API call,
    //the parameters need to be encoded into a string along the lines of &param=value&more=value2
    //otherwise, GIT will return an error message
    function processParams(params) {
        var result = "";

        for (var key in params) {
            result += key + "=" + encodeURIComponent(params[key]) + "&";
        }

        return result;
    }

    var data = {
        "requestUri": "http://localhost:8080/ejs/api/user/check",
        "postBody": processParams(userDetails),
        "returnOauthToken": true
    };

    var opts = {
        url: "https://www.googleapis.com/identitytoolkit/v1/relyingparty/verifyAssertion?key=AIzaSyAH6F_1XgdpAb93KazCHcSWHUmkAQAbWn8",
        method: 'POST',
        data: JSON.stringify(data),
        headers:Headers({ 'Content-Type':'application/json' }),
        async: false
    };

    var exchange = httpclient.request(opts);

    var oAuthResults = JSON.parse(exchange.content);

    oAuthResults.claimed_id = userDetails["openid.claimed_id"];
    oAuthResults.assoc_handle = userDetails["openid.assoc_handle"];

    //we've got the data from the oauth providers, and filtered it through GIT to get a standardized form of the data
    //now we search through our user accounts to see if it exists or not
    opts = {
        "url": getZociaUrl(req) + '/profiles/byprimaryemail/'+oAuthResults.verifiedEmail,
        "method": 'GET',
        headers:Headers({ 'x-rt-index':'ejs' }),
        async:false
    };

    exchange = httpclient.request(opts);

    if(exchange.status === 200)
    {
        var results = JSON.parse(exchange.content);
        //user found logging in user now
        console.log("USER FOUND LOGGING IN USER NOW");
        forceLoginWithUsername(results.username);
        return json({"user": "login successful"});
    } else {
        //user NOT found creating user now
        var profile = createUser(req, oAuthResults);
        if(profile) {
            console.log("user created: "+JSON.stringify(profile));
            //issue: things might not work instantly. might need to add a few seconds delay
            forceLoginWithUsername(profile.username);
            return json({"user": "creation successful"});
        } else {
            return json(false);
        }
    }

    return json(true);
}

//ideally this needs to create the user in zocia
function createUser(req, oAuthResults)
{
    var profile = {};

    //oAuthResults come from: https://developers.google.com/identity-toolkit/v2/reference/relyingparty/verifyAssertion
    profile.name = {
        given: oAuthResults.firstName,
        surname: oAuthResults.lastName,
        fullName: oAuthResults.fullName
    };

    profile.username = oAuthResults.nickName || (profile.name.given + profile.name.surname);

    profile.thumbnail = oAuthResults.photoUrl || 'images/GCEE_image_defaultMale.jpeg';
    profile.accountEmail = {
        address: oAuthResults.verifiedEmail,
        status: "verified"
    };

    profile.status = "verified";

    profile.thirdPartyLogins = [{
        "identifier": oAuthResults.identifier,
        "values": {
            "claimed_id": oAuthResults.claimed_id,
            "assoc_handle": oAuthResults.assoc_handle
        }
    }];

    //these are all the properties needed to create a user in zocia
    profile.source = "ejs";
    profile.websites = [];
    profile.educationHistory = [];
    profile.workHistory = [];
    profile.password = '';

    var opts = {
        url: getZociaUrl(req) + '/profiles/',
        method:'POST',
        data:JSON.stringify(profile),
        headers:Headers({ 'x-rt-index':'ejs',
            'Content-Type':'application/json',
            'Authorization':_generateBasicAuthorization('backdoor', 'Backd00r')}),
        async:false
    };

    var exchange = httpclient.request(opts);

    if(exchange.status === 201)
    {
        //create user was successful, return the profile object so it can be used
        return profile;
    } else {
        log.error("There was an error creating the user. Status: "+exchange.status);
        return false;
    }
}

//due to inconsistency between open ID endpoints, some endpoints will return the results in a POST request while others will use GET
//we need to catch and handle both requests the same way, so that's what we're doing here
app.post('/check', function(req) {
    return checkUser(req, req.postParams);
});

app.get('/check', function(req) {
    return checkUser(req, req.params);
});

function _generateBasicAuthorization(username, password) {
    var header = username + ":" + password;
    var base64 = encode(header);
    return 'Basic ' + base64;
}

/**
 * Forces the user to be authenticated.
 *
 * @param profile
 */
function forceLoginWithUsername(username) {
    if (!username) throw 'Cannot force login with a profile that does not contain a username.';

    var request = getApp().request;
    var authManager = request.env.servlet.getBean('preauthAuthProvider');
    var authToken = new PreAuthenticatedAuthenticationToken(username, '');

    var auth = authManager.authenticate(authToken);
    SecurityContextHolder.getContext().setAuthentication(auth);
}

function getApp() {
    return require(module.resolve('main')).app;
}