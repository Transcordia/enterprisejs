/**
 * User: toddbarchok
 * Date: 6/14/12
 * Time: 4:51 PM
 */

/**
 * Prepends the servlet's context path to the url parameter
 *
 * @param {string} url The URL to get the context prepended to
 * @returns The modified URL string
 */
var ctx = exports.ctx = function (url) {
    // Only prepend the context path if the URL is a relative
    if (/^\//.test(url)) {
        var req = getRequest();
        if (!req) {
            throw 'Function ctx requires a request object to be known to the application.';
        }

        // Get the servlet's context path
        var contextPath = req.env.servletRequest.contextPath;
        url = contextPath + url;
    }
    return url;
};

function getRequest() {
    var app = require(module.resolve('../main')).app;
    if (app) return app.request;
    return null;
}