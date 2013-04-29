
//gets the Zocia URL. For instance: http://localhost:9300/myapp/api
var getZociaUrl = exports.getZociaUrl = function(request) {
    return getConfigParam(request, 'zociaUrl');
};

//gets the base URL for Zocia. For instance: http://localhost:9300/ (this is mostly here for future use, in case it ever ends up being needed)
var getZociaBase = exports.getZociaBase = function(request) {
    return getConfigParam(request, 'zociaBase');
};

//gets the base URL for elasticsearch. For instance: http://localhost:9311/
var getElasticBase = exports.getElasticBase = function(request) {
    return getConfigParam(request, 'elasticBase');
};

var ctx = exports.ctx = function( url ) {
    // Only prepend the context path if the URL is a relative
    if ( /^\//.test( url ) ) {
        var req = getRequest();
        if ( !req ) {
            throw 'Function ctx requires a request object to be known to the application.';
        }

        // Get the servlet's context path
        var contextPath = req.env.servletRequest.contextPath;
        url = contextPath + url;
    }
    return url;
};

//gets the base URL for the local site. For instance: http://localhost:8080/ejs
var getLocalUrl = exports.getLocalUrl = function(request) {
    return getConfigParam(request, 'localUrl');
};

var getConfigParam = exports.getConfigParam = function(request, name) {
    var configParams = request.env.servlet.getBean('ejsParams');
    return configParams.get(name);
};
