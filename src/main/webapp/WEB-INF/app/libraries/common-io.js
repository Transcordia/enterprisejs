/**
 * User: toddbarchok
 * Date: 6/12/12
 * Time: 3:38 PM
 */
var httpclient = require('ringo/httpclient');


export ('ajaxRequest');

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

function getApp() {
    return require(module.resolve('../main')).app;
}
