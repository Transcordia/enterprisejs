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

            var renderArticles = function (articles, append) {
                var imageWidth = "", imageHeight = "", src = "";
                var articleHolder = "";
                var image = " ";
                articles.forEach(function (article) {
                    if(Object.keys(article.abstractImage).length > 0){
                        imageWidth = article.abstractImage.w;
                        imageHeight = article.abstractImage.h;
                        src = article.abstractImage.src;
                        articleHolder = '<div class="article-holder"><img width="'+ imageWidth +'" height="'+ imageHeight +'" src="'+ src +'"></div>';
                        image = " has-image ";
                    }

                    articleHtml += '<div id="'+ article._id +'" class="article' + image + gridCombinations[article.layout].size+'">\
                                    <div>\
                                        <h1><a href="#/article/' + article._id + '">'+ article.title +'</a></h1>'+ articleHolder +'\
                                        <p class="description">' + article.description + '</p>\
                                    </div>\
                                </div>';

                    articleHolder = "";
                    image = " ";
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
            //200 is the value of the footer height and some other things. offset is passed in as an option and is used for
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