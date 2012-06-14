/**
 * User: toddbarchok
 * Date: 6/12/12
 * Time: 3:38 PM
 */
var log = require('ringo/logging').getLogger(module.id);

var httpclient = require('ringo/httpclient');
var {Headers} = require('ringo/utils/http');

export (
    'roundTableAjaxRequest',
    'ajaxRequest',
    'getProfileFromId',
    'forceLogin',
    'forceLoginWithUsername'
    );


// Included for forcing users to be re-authenticated
var {SecurityContextHolder} = Packages.org.springframework.security.core.context;
var {RoundtableUser} = Packages.com.zocia.nep.security;
var {UsernamePasswordAuthenticationToken} = Packages.org.springframework.security.authentication;
var {PreAuthenticatedAuthenticationToken} = Packages.org.springframework.security.web.authentication.preauth;


/**
 * Helper function that should streamline RoundTable requests
 * Options object contains: data, url, method
 *
 * Multiple redirects may result in a 303 status being returned instead of the actual content.
 *
 * @param options
 * @param numRedirects Keeps track of the number of redirects this request takes.
 * @return {Object}
 */
function roundTableAjaxRequest(options, numRedirects) {
    if (typeof numRedirects === 'undefined') numRedirects = 0;


    var request = getApp().request;
    request.roundtableBase = "http://localhost:8080/ejs/api";
    request.roundtableUrl = "http://localhost:8080/ejs/api";

    // Add headers to request
    var headers = Headers({ 'x-rt-index': 'nep' });

    // Add additional headers if passed in the argument object
    if (options.headers) {
        for (var key in options.headers) {
            headers.add(key, options.headers[key]);
            log.debug('Adding header {{}:{}', key, options.headers[key]);
        }
    }

    // Add auth headers if user is logged in
    var authHeaders = request.roundtableAuthHeaders;
    if (authHeaders && !options.skipAuth) {
        headers.add('Authorization', authHeaders);
    }

    // The idea here is to convert a JSON payload into a String value before making our call. We
    // also use this function to perform file upload, so we need to take this into consideration
    // before we stringify our payload.
    // todo: Do we really want to stringify our payload under any circumstances? We have been, but is it right?
    if (typeof options.data === 'object' &&
        !(options.data instanceof Binary || options.data instanceof Stream || options.data instanceof java.io.InputStream)) {

        // Stringify the data payload
        options.data = JSON.stringify(options.data);

        // Add an appropriate Content-Type header, otherwise RoundTable won't acknowledge the data
        headers.add("Content-Type", "application/json");
    }

    // If we are in a redirect situation, the context is already included in the new URL.
    var url = numRedirects > 0
        ? request.roundtableBase + options.url
        : request.roundtableUrl + options.url;
      log.info("URL: "+url);
    var opts = {
        url: url,
        data: options.data,
        method: options.method || 'GET',
        headers: headers,
        async: options.async || false
    };

    //var id = getSimpleId();
    //log.debug('AJAX request [{}]: {}', id, JSON.stringify(opts, null, 4));

    var exchange = httpclient.request(opts);

    // Redirect situation
    if (exchange.status === 303) {
        if (numRedirects < 3) {
            numRedirects++;
            options.url = exchange.headers['Location'];
            log.warn(format(
                'Redirecting from %s to %s, this is the redirect attempt %.0f. Fix the URL!',
                opts.url, options.url, numRedirects));
            return roundTableAjaxRequest(options, numRedirects);
        }
    }

    //log.debug('AJAX response [{}]: {}', id, exchange.status);

    return {
        'status': exchange.status,
        'content': exchange.content,
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    };
}

/**
 Helper function that should streamline external HTTP requests
 Options object contains: data, url, method
 */
function ajaxRequest(options)
{
    var request = getApp().request;

    // Turn data into a string if an object
    if (typeof options.data == 'object')
        options.data = JSON.stringify(options.data);

    // var client = new Client(2000, false);
    var exchange = httpclient.request({
        url: options.url,
        data: options.data,
        method: options.method || 'GET',
        async: false
    });

    return {
        'status': exchange.status,
        'content': exchange.content,
        'headers': exchange.headers,
        'success': Math.floor(exchange.status / 100) === 2
    };
}

/**
 * Retrieves a user's profile based on the supplied id.
 *
 * @param {string} id The id to lookup
 * @returns {ProfileMixin|null} Returns the profile mixin of the specified user, or null if it
 * does not exist
 */
function getProfileFromId(id) {
    var exchange, results;

    // Warn if passed a bad argument
    if (typeof id !== "string") {
        log.warn("getProfileFromId requires a string as an argument.");
        return null;
    }

    // Query RoundTable to see if profile exists
    exchange = roundTableAjaxRequest({
        'url': '/profiles/' + id
    });

    if (exchange.success) {
        try {
            results = JSON.parse(exchange.content);
            return new ProfileMixin(results);
        } catch (e) {
            log.warn("Error parsing getProfileFromId results from RoundTable: " + e.message);
        }
    } else {
        log.warn("Received bad response from RoundTable while attempting getProfileFromId: " + exchange.content);
    }

    log.warn("getProfileFromId not able to find user with _id: " + id)
    return null;
}

/**
 * Forces the user to be authenticated.
 *
 * @param profile
 */
function forceLogin(username, password) {
    log.debug(format('forceLogin::Credentials, username: %s, password: %s', username, password));
    var authToken = new UsernamePasswordAuthenticationToken(username, password);

    // Is this how I get a new Authentication object inserted into SecurityContextHolder with
    // our custom UserDetails object?
    var request = getApp().request;
    var authManager = request.env.servlet.getBean('authenticationManager');
    var auth = authManager.authenticate(authToken);
    SecurityContextHolder.getContext().setAuthentication(auth);
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
    return require(module.resolve('../main')).app;
}
