'use strict';

var tablet = window.matchMedia( "(max-width: 1024px)" );

/* Directives */
angular.module('ejs.directives', []);

angular.module('ejs.directives').directive('nested', ['truncate', '$timeout', '$log', function (truncate, $timeout, $log) {
    return {
        scope: {
            articles: '=',
            newArticles: '='
        },
        link: function (scope, element, attrs) {
            var gridCombinations = {
                "1": {
                    "size": "size11"
                },
                "2": {
                    "size": "size12"
                },
                "8": {
                    "size": "size21"
                },
                "4": {
                    "size": "size31"
                },
                "5": {
                    "size": "size22"
                }
            }

            var options = {
                selector: ".article",
                minWidth: (tablet.matches) ? 330 : 320,
                minColumns: 2
            };

            var articleHtml = '';

            /*<div class="article">
                <div class="article-abstract-image"></div>
                <div class="article-abstract-title">
                Aenean lacinia bibendum nulla sed consectetur.
                Morbi leo risus, porta ac consectetur ac, vestibulum at eros.
                Praesent commodo cursus magna, vel scelerisque nisl consectetur et.
                </div>
                <div class="clearfix">
                    <div class="article-abstract-meta">
                        <div class="time-posted">1 hour ago</div>
                        <div class="articles-views">10</div>
                    </div>
                </div>
            </div>*/

            var renderArticles = function (articles, append) {
                var imageWidth = "", imageHeight = "", src = "";
                var abstractImage = "";
                var image = " ";
                var i = 1;
                articles.forEach(function (article) {
                    if(Object.keys(article.abstractImage).length > 0){
                        imageWidth = article.abstractImage.w;
                        imageHeight = article.abstractImage.h;
                        src = article.abstractImage.src;
                        abstractImage = '<div class="abstract-image-holder"><img width="'+ imageWidth +'" height="'+ imageHeight +'" src="'+ src +'"></div>';
                        image = " has-image ";
                    }

                    if(i < 5){
                        articleHtml += '<div class="article featured' + image + gridCombinations[article.layout].size+'">\
                                            <div class="abstract-title-holder"><h1><a href="#/article/' + article._id + '">'+ article.title +'</a></h1></div>\
                                            <div class="article-abstract-image">'+ abstractImage +'\
                                                <div class="article-abstract-title transparent"></div>\
                                            </div>\
                                            <div class="article-abstract-meta">\
                                                <p>' + article.description + '</p>\
                                                <div class="clearfix">\
                                                    <div class="time-posted"><p><i>1 hour ago</i></p></div>\
                                                    <div class="article-views"><p>10</p></div>\
                                                </div>\
                                            </div>\
                                        </div>';
                    }else{
                        articleHtml += '<div id="'+ article._id +'" class="article' + image + gridCombinations[article.layout].size+'">\
                                            <div>\
                                                <h1><a href="#/article/' + article._id + '">'+ article.title +'</a></h1>'+ abstractImage +'\
                                                <p class="description">' + article.description + '</p>\
                                            </div>\
                                        </div>';
                    }



                    abstractImage = "";
                    image = " ";
                    i++;
                });

                //don't run jquery.nested if the browser size is below 640px. This prevents it from running on mobile, which would cause problems.
                var mq = window.matchMedia( "(min-width: 640px)" );

                if (mq.matches) {
                    // viewport width is at least 640px
                    if(!append){
                        element.append(articleHtml);
                        element.nested(options);
                    }else{
                        element.append(articleHtml).nested('append', articleHtml);
                    }
                }else{
                    element.append(articleHtml);
                }

                articleHtml = "";
            };

            scope.$watch('articles', function (newValue, oldValue) {
                if (newValue.length > 0 && oldValue.length == 0){
                    renderArticles(scope.articles, false);
                }else if(newValue.length > 0 && oldValue.length > 0){
                    renderArticles(scope.$parent.newArticles, true);
                }
            });
        }
    };
}]);

/**
 * Loads an image, passing in the height and width to the provided scope, and emits an event that can be listened for
 * The sibling or parent scope can then decide what to do with that image, based on the size (since we don't know what size the image is until it's loaded)
 * In the EnterpriceJS project, this is used to filter out images that are deemed "too small"
 */
angular.module('ejs.directives').directive('checkSize', function(){
    return {
        restrict: 'A',
        link: function(scope, elem, attr) {
            elem.on('load', function() {
                scope.image.w = elem[0].naturalWidth;
                scope.image.h = elem[0].naturalHeight;
                scope.$emit('Event:ImageLoaded');
            });
        }
    };
});

/**
 * Runs a function when the user reaches the bottom of the page. The individual function that is run is passed in as an argument.
 *
 * @param [options] {function} This should be a function that is passed into the directive. The function would then load more objects and add them to the list
 * @example <div when-scrolled="loadMore()" offset="90">
 */
angular.module('ejs.directives').directive('whenScrolled', function() {
    return function(scope, elm, attr) {
        var raw = elm[0];
        var offset = attr.offset || 0;
        angular.element(window).bind('scroll', function() {
            var rectObject = raw.getBoundingClientRect();
            //the number being subtracted from window.height() is the static height of any footers or other elements that are on all the pages.
            //offset is passed in as an option and is the height of any padding or margins that might occur as part of the element this directive is used on
            //
            //WARNING: if there's any changes in that collection of elements (mostly in terms of changing the CSS), these numbers needs to be changed. this also prevents use of 'ems' as they don't translate consistently to pixel values
            //there might be a way to handle this without using static numbers. if so, please do, as this current solution isn't as flexible and reusable as it could be
            if (Math.floor(rectObject.bottom) === $(window).height() - 0 - offset) {
                scope.$apply(attr.whenScrolled);
            }
        });
    };
});

/**
 * Reloads the twitter buttons. Without this, twitter buttons show up as unstyled "Tweet" links, which are boring and ugly.
 *
 * @example <div class="article-tweet-button" reload-twitter-btns>
 <a href="https://twitter.com/share" class="twitter-share-button" data-lang="en">Tweet</a>
 </div>
 */
angular.module('ejs.directives').directive('reloadTwitterBtns', function(){
    return {
        compile: function compile() {
            return {
                post: function(){
                    if(twttr !== undefined) {
                        twttr.widgets.load();
                    }
                }
            }
        }
    }
});

/**
 * Used for liking, and unliking and object
 * This directive assumes the existence of a $rootScope.auth property, which comes from auth.js in the BabsonGC project.
 * The backend code for liking/unliking objects in zocia requires 2 id values, one for the object that is BEING liked, and one for the object DOING the liking
 * Thus at the very least, there needs to be some sort of way to get the zocia/database ID of the user.
 *
 * @param [id] {string} The ID of the object to be liked
 * @example <like id="{{id}}"></like>
 */
angular.module('ejs.directives').directive('like', ['$http', '$rootScope', function($http, $rootScope){
    return {
        restrict: 'E',
        template: '<a ng-click="like()"><i class="likes"></i> {{likeText}}</a>',
        replace: true,
        link: function(scope, elm, attrs){
            scope.likeText = "Like This";
            scope.alreadyLiked = true;
            /*
            attrs.$observe('objectid', function(object_id) {
                if( (object_id !== '') && ($rootScope.auth.isAuthenticated) ) {
                    $http.get("api/utility/like/" + object_id).success(function(data) {
                        var result = JSON.parse(data);
                        if(result) {
                            scope.likeText = "Unlike";
                        }
                        scope.alreadyLiked = result;
                    });
                }
            });

            scope.like = function() {
                if(!$rootScope.auth.isAuthenticated) {
                    return;
                }
                if(scope.alreadyLiked) {
                    $http.post("api/utility/unlike/" + attrs.objectid).success(function(data) {
                        scope.likeText = "Like This";
                        scope.alreadyLiked = false;
                        if(scope.increaseLikes !== undefined) {
                            scope.increaseLikes(data.likes);
                        }
                    });
                } else {
                    $http.post("api/utility/like/" + attrs.objectid).success(function(data) {
                        scope.likeText = "Unlike";
                        scope.alreadyLiked = true;
                        if(scope.increaseLikes !== undefined) {
                            scope.increaseLikes(data.likes);
                        }
                    });
                }
            }  */
        }
    }
}]);