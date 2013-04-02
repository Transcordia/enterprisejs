'use strict';

/* Filters */

angular.module('ejs.filters', []);

angular.module('ejs.filters').filter('shorten', function(){
    return function(string, length){
        // only run when the substr function is broken
        if ('ab'.substr(-1) != 'b'){
            /**
             *  Get the substring of a string
             *  @param  {integer}  start   where to start the substring
             *  @param  {integer}  length  how many characters to return
             *  @return {string}
             */
            String.prototype.substr = function(substr) {
                return function(start, length) {
                    // did we get a negative start, calculate how much it is from the beginning of the string
                    if (start < 0) start = this.length + start;

                    // call the original function
                    return substr.call(this, start, length);
                }
            }(String.prototype.substr);
        }

        if(string && string.length > 30){
            return string.substr(0, length);
        }

        return string;
    }
});

angular.module('ejs.filters').filter('timeago', function(){
    return function(time){
        return moment(time, 'YYYY-MM-DD HH:mm Z').fromNow();
    }
});
