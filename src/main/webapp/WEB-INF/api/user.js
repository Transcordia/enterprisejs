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

//
app.post('/status', function(req) { console.log("USER STATUS INFO");
    return json({ "registered": true });
});

app.post('/login', function(req) {    console.log("user is now logged in");
    return json({ "status": "OK" });
});

/*
This is the results returned by Google's provider. They're here in full as an example
 {
 "rp_target":"callback",
 "rp_purpose":"signin",
 "gx.rp_st":"AEp4C1sd3HYoD8t937hx7EGNRRWVqMfM3IoI7iKVMrZAkEI8bG0awtVpnd83xhRwZfWUeimB96o1Rf29weU4Nz0gjaYOCAEAkqmSSBywc3pxt9QRHKth3O2yZCzUyqDR7nRkNaPm4vHQ",
 "openid.ns":"http://specs.openid.net/auth/2.0",
 "openid.mode":"id_res",
 "openid.op_endpoint":"https://www.google.com/accounts/o8/ud",
 "openid.response_nonce":"2013-03-27T18:40:40Z73i0_5FmBf4TYQ",
 "openid.return_to":"http://localhost:8080/ejs/api/user/create?rp_target=callback&rp_purpose=signin&gx.rp_st=AEp4C1sd3HYoD8t937hx7EGNRRWVqMfM3IoI7iKVMrZAkEI8bG0awtVpnd83xhRwZfWUeimB96o1Rf29weU4Nz0gjaYOCAEAkqmSSBywc3pxt9QRHKth3O2yZCzUyqDR7nRkNaPm4vHQ",
 "openid.assoc_handle":"1.AMlYA9XppaTSE68rE5QGQfU-T6ByltaZ8UgbLEEIEK250iMwkVXp5np2SzviTQ",
 "openid.signed":"op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle,ns.ext1,ext1.mode,ext1.type.attr3,ext1.value.attr3,ext1.type.attr6,ext1.value.attr6,ext1.type.auto2,ext1.value.auto2,ext1.type.attr9,ext1.value.attr9,ext1.type.attr0,ext1.value.attr0",
 "openid.sig":"mYGUaKSx35RPmJUdjPAMYmdIbJI=",
 "openid.identity":"https://www.google.com/accounts/o8/id?id=AItOawku1T0cyQFqbLwlVlPG8MXjHFpOAkNJ5is",
 "openid.claimed_id":"https://www.google.com/accounts/o8/id?id=AItOawku1T0cyQFqbLwlVlPG8MXjHFpOAkNJ5is",
 "openid.ns.ext1":"http://openid.net/srv/ax/1.0",
 "openid.ext1.mode":"fetch_response",
 "openid.ext1.type.attr3":"http://axschema.org/namePerson/first",
 "openid.ext1.value.attr3":"Todd",
 "openid.ext1.type.attr6":"http://axschema.org/namePerson/last",
 "openid.ext1.value.attr6":"Barchok",
 "openid.ext1.type.auto2":"http://www.google.com/accounts/api/federated-login/id",
 "openid.ext1.value.auto2":"108627989255012550126",
 "openid.ext1.type.attr9":"http://axschema.org/pref/language",
 "openid.ext1.value.attr9":"en",
 "openid.ext1.type.attr0":"http://axschema.org/contact/email",
 "openid.ext1.value.attr0":"tbarchok@pykl.com"
 }
 */
function processGoogle(userDetails, profile)
{
    profile.name = {
        given: userDetails["openid.ext1.value.attr3"],
        surname: userDetails["openid.ext1.value.attr6"]
    };
    //temporary solution, ideally the user could supply their own username...
    profile.username = profile.name.given + profile.name.surname;

    profile.thumbnail = 'images/GCEE_image_defaultMale.jpeg';
    profile.accountEmail = {
        address: userDetails["openid.ext1.value.attr0"]
    };

    profile.thirdPartyLogins = [{
        "identifier": userDetails["openid.identity"],
        "values": {
            "claimed_id": userDetails["openid.claimed_id"],
            "assoc_handle": userDetails["openid.assoc_handle"]
        }
    }];

    return profile;
}

/*
These are the results from Yahoo's provider. Included here as an example of what gets returned
 {
 "openid.ns":"http://specs.openid.net/auth/2.0",
 "openid.mode":"id_res",
 "openid.return_to":"http://localhost:8080/ejs/api/user/create?rp_target=callback&rp_purpose=signin&gx.rp_st=AEp4C1vN9X7aH8655zmoBc9avikeY4UC1ie3JUclQliGmkrs7SSD2wUObY82Qp5sca047xlpVU9VlL689XTK7mLOM2VzuEeMaElbjjkgj3e-lJzFC6iFyTusEWTKCHmSphOfZFF2PlDf",
 "openid.claimed_id":"https://me.yahoo.com/a/SmngC48Otd88pkE6Cl.sunYxwfmR#b2c64",
 "openid.identity":"https://me.yahoo.com/a/SmngC48Otd88pkE6Cl.sunYxwfmR",
 "openid.assoc_handle":"OLYOHVK0DPusmE0O3oFjlg8Ng_7jcBLCo3YT25rOiqVPLJ.7FwBFtY6wSPPPBu77GKS3PMhwi0TZiouhD8NUJawSq0jq7tn4TfFUo3XEJ9kFAiYBklPcPct_2vP9PIVzLQ--",
 "openid.realm":"http://localhost:8080",
 "openid.ns.ax":"http://openid.net/srv/ax/1.0",
 "openid.ax.mode":"fetch_response",
 "openid.ax.value.fullname":"Todd B.",
 "openid.ax.value.nickname":"Todd B",
 "openid.ax.value.language":"en-US",
 "openid.ax.value.timezone":"America/New_York",
 "openid.ax.value.image":"https://s.yimg.com/dh/ap/social/profile/profile_b48.png",
 "openid.response_nonce":"2013-03-27T15:03:14Zee5GL6YF5vwQXz3eyAmdmF4TtV1sc7PiqQ--",
 "openid.signed":"assoc_handle,claimed_id,identity,mode,ns,op_endpoint,response_nonce,return_to,signed,ax.value.fullname,ax.type.fullname,ax.value.nickname,ax.type.nickname,ax.value.language,ax.type.language,ax.value.timezone,ax.type.timezone,ax.value.image,ax.type.image,ns.ax,ax.mode,pape.auth_level.nist",
 "openid.op_endpoint":"https://open.login.yahooapis.com/openid/op/auth",
 "openid.ax.type.fullname":"http://axschema.org/namePerson",
 "openid.ax.type.nickname":"http://axschema.org/namePerson/friendly",
 "openid.ax.type.language":"http://axschema.org/pref/language",
 "openid.ax.type.timezone":"http://axschema.org/pref/timezone",
 "openid.ax.type.image":"http://axschema.org/media/image/default",
 "openid.pape.auth_level.nist":"0",
 "openid.sig":"3sz/MDAAiMnP5qLaeMsb4SX19II="
 }
 */
function processYahoo(userDetails, profile)
{
    profile.username = userDetails["openid.ax.value.nickname"];
    profile.name = {
        given: userDetails["openid.ax.value.fullname"],
        surname: userDetails["openid.ext1.value.attr6"]
    };

    profile.thumbnail = userDetails["openid.ax.value.image"];
    profile.accountEmail = {
        address: userDetails["openid.ext1.value.attr0"]
    };

    profile.thirdPartyLogins = [{
        "identifier": userDetails["openid.identity"],
        "values": {
            "claimed_id": userDetails["openid.claimed_id"],
            "assoc_handle": userDetails["openid.assoc_handle"]
        }
    }];

    return profile;
}

//ideally this needs to create the user in zocia
function createUser(req, userDetails)
{
    console.log("user is now created");

    var profile = {};

    profile.source = "ejs";
    profile.websites = [];
    profile.educationHistory = [];
    profile.workHistory = [];

    //process the result from open ID based on the endpoint. then we need to create the user itself
    switch(userDetails["openid.op_endpoint"])
    {
        case "https://www.google.com/accounts/o8/ud":
            profile = processGoogle(userDetails, profile);
            break;
        case "https://open.login.yahooapis.com/openid/op/auth":
            profile = processYahoo(userDetails, profile);
            break;
        default:
            log.error("Open ID Endpoint not recognized. Only Yahoo and Google endpoints supported.");
            break;
    }

    profile.password = '';
    profile.accountEmail.status = "verified";

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

    if(exchange.success)
    {
        console.log("successful user creation ok then!");
    }
    console.log("result: "+exchange.status);

    //create user, then we need to redirect them back to everything
    return json({ "status": JSON.stringify(profile) });
}

//due to inconsistency between open ID endpoints, some endpoints will return the results in a POST request while others will use GET
//we need to catch and handle both requests the same way, so that's what we're doing here
app.post('/create', function(req) {
    return createUser(req, req.postParams);
});

app.get('/create', function(req) {
    return createUser(req, req.params);
});

function _generateBasicAuthorization(username, password) {
    var header = username + ":" + password;
    var base64 = encode(header);
    return 'Basic ' + base64;
}