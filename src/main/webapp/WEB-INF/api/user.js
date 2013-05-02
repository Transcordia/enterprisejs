/**
 * Created with IntelliJ IDEA.
 * User: toddbarchok
 * Date: 3/26/13
 * Time: 2:56 PM
 * This file handles all calls to /api/user
 * The main function is for processing openID requests from Google Identity Toolkit and generally creating and signing in and out users to the system
 * These urls are set in a javascript code block in index.html
 *
 * In all cases, when GIT pops up the initial login window, it eventually send users to api/users/check, which runs the checkUser function
 * When that completes, control is sent to popup.html, which handles closing the popup window and passing the results of the login to the main window
 * Upon success, the scope fires an event to run the auth.js getAuth() commend
 */

var httpclient = require('ringo/httpclient');
var log = require('ringo/logging').getLogger(module.id);
var {json, redirect} = require('ringo/jsgi/response');

var {Application} = require('stick');
var app = exports.app = Application();
app.configure('notfound', 'params', 'mount', 'route');

var {getZociaUrl, getLocalUrl} = require('utility/getUrls');
var {encode} = require('ringo/base64');
var {Headers} = require('ringo/utils/http');

// Included for forcing users to be re-authenticated
var {SecurityContextHolder} = Packages.org.springframework.security.core.context;
var {RoundtableUser} = Packages.com.zocia.nep.security;
var {UsernamePasswordAuthenticationToken} = Packages.org.springframework.security.authentication;
var {PreAuthenticatedAuthenticationToken} = Packages.org.springframework.security.web.authentication.preauth;


/**
    This gets the data from various oauth providers that GIT supports, and decides what to do with it
    First we need to pass in that data back to GIT, which will return us a nice, easy to use format that we can be certain will contain various bits of information
    Once we get the users identity and other details, we need to search through the existing user accounts. If we find one that matches, then we log them in. Otherwise, we auto-create the account

    @param req Request object
            userDetails object Parameters passed in by GIT when the user has logged in. These need to be processed into a url param type string before sending them to the GIT server.
    @return In all cases, this function performs a redirect to popup.html, with a parameter of "true" or "false" depending on if the login/account creation succeeded or failed. This is then used by popup.html to close itself, and return control to the main site
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

    var url = getLocalUrl(req);
    var body = processParams(userDetails);
    //if GIT calls this function via POST, there are a few variables in the GET section that are required. At the moment, this checks those and adds them to our parameters.
    //if there's an error in the future, this would be a good place to look
    if(req.params !== userDetails)
    {
        body += processParams(req.params);
    }

    var data = {
        "requestUri": url + "/user/check",
        "postBody": body,
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
    //there should ALWAYS be a verifiedEmail property. If there isn't one, then something went wrong with the call to GIT, and we can't proceed
    if(oAuthResults.verifiedEmail === undefined)
    {
        log.error("Verified Email not found: "+JSON.stringify(oAuthResults));
        return redirect(url.substr(0, (url.length - 3)) + "popup.html?false");
    }
    //these are added to the "third party logins" property in zocia, so we add them to our oAuthResults variable so we can use them when we create the user
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
        forceLoginWithUsername(results.username);
        return redirect(url.substr(0, (url.length - 3)) + "popup.html?true");
    } else {
        //user NOT found creating user now
        var profile = createUser(req, oAuthResults);
        if(profile) {
            //there's a few seconds of delay while the account is created, versus it showing up. best solution to that is to add some delay
            java.lang.Thread.sleep(2000);
            forceLoginWithUsername(profile.username);
            return redirect(url.substr(0, (url.length - 3)) + "popup.html?true");
        }
    }
    //it is unlikely that this point will ever be reached
    return redirect(url.substr(0, (url.length - 3)) + "popup.html?false");
}

/**
    takes user details supplied from identity toolkit, and creates a zocia user from those values
    in addition, if the user's email contains pykl.com as the address, they will be given admin status,
    which will allow them access to add and edit articles
    @param req Request object
           oAuthResult User properties returned by Google Identity Toolkit, details on what properties it contains can be found here: https://developers.google.com/identity-toolkit/v2/reference/relyingparty/verifyAssertion
    @returns The resulting profile object if successful, otherwise returns false if something goes wrong creating the profile
 */
function createUser(req, oAuthResults)
{
    var profile = {};

    //oAuthResults come from: https://developers.google.com/identity-toolkit/v2/reference/relyingparty/verifyAssertion
    profile.name = {
        given: oAuthResults.firstName,
        surname: oAuthResults.lastName,
        fullName: oAuthResults.fullName
    };

    //usernames have to be unique. The best solution to this is to use their email address, but we need to strip out special characters.
    //the most common special characters are the '@' and '.' so we strip out any occurrences of those. It's possible to use other special characters in email, but they are far less common
    //for now, this should be good
    profile.username = oAuthResults.verifiedEmail.replace(/@/gi, '').replace(/\./gi, '');

    profile.thumbnail = oAuthResults.photoUrl || 'images/GCEE_image_defaultMale.jpeg';
    profile.accountEmail = {
        address: oAuthResults.verifiedEmail,
        status: "verified"
    };

    //we give anyone who is logging in with a pykl.com address admin access, which allows them to add and edit articles
    if(oAuthResults.verifiedEmail.indexOf("@pykl.com") >= 0)
    {
        profile.roles = ["ROLE_USER", "ROLE_ADMIN"];
    }
    //set status to "verified" so we can access the user normally and such, since we're not going to bother verifying the user's email when they're logging in using a verified email
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

//clears the spring security context, which should log out the user from the system
app.get('/logout', function(req) {
    SecurityContextHolder.clearContext();

    return json(true);
})

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