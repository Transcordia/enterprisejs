'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('ejs.services', []);

angular.module('ejs.services').
    factory('truncate', function(){
        return function(originalString, length){
            // do not truncate the string in a place that will break the markup
            var truncatedString = originalString.substring(0, length);
            if(truncatedString.length == length){
                return truncatedString = truncatedString + " ...";
            }
            return truncatedString;
        }
    });