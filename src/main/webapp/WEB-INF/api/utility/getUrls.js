
//gets the Zocia URL. For instance: http://localhost:9300/myapp/api
var getZociaUrl = exports.getZociaUrl = function(request) {
    return getConfigParam(request, 'zociaUrl');
};

//gets the base URL for Zocia. For instance: http://localhost:9300/ (this is mostly here for future use, in case it ever ends up being needed)
var getZociaBase = exports.getZociaBase = function(request) {
    return getConfigParam(request, 'zociaBase');
};

/**
 * Returns the URL of the current server the website is hosted on. This is going to need to be
 * passed up to the main website for calling the backend javascript stuff.
 *
 * Not used currently. Keep in mind that this will return the URL of the incoming request. Because
 * we have load balancers and other infrastructure, this may be a misleading example.
 *
 * @type {Function}
 */
var getLocalUrl = exports.getLocalUrl = function(request) {
    var url = request.env.servletRequest.requestURL.toString();

    // If the "context" string is in the URL, strip everything out after that
    if (url.indexOf(ctx) !== -1) {
        url = url.split('/').splice(0, 4).join('/');
    } else {
        // Otherwise, all that is needed is the domain
        url = url.split('/').splice(0, 3).join('/');
    }

    return url;
};

var getConfigParam = exports.getConfigParam = function(request, name) {
    var configParams = request.env.servlet.getBean('ejsParams');
    return configParams.get(name);
};
