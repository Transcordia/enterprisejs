'use strict';

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
                minWidth: 200,
                minColumns: 2,
                gutter: 10
            };

            var articles = '';

            var setup = function () {
                var imageWidth = "", imageHeight = "", src = "";
                var articleHolder = "";
                scope.articles.forEach(function (article) {
                    if(article.images[0]){
                        imageWidth = article.abstractImage.w;
                        imageHeight = article.abstractImage.h;
                        src = article.abstractImage.src;
                        articleHolder = '<div class="article-holder"><img width="'+ imageWidth +'" height="'+ imageHeight +'" src="'+ src +'"></div>';
                    }

                    articles += '<div id="'+ article._id +'" class="article '+ gridCombinations[article.layout].size+'">\
                                    <div>\
                                        <h4><a href="#/article/' + article._id + '">'+ article.title +'</a></h4><p class="description"><b>Score: </b><i>'+ article.score +'</i></p>'+ articleHolder +'\
                                        <p class="description">' + article.description + '</p>\
                                    </div>\
                                </div>';

                    articleHolder = "";
                });

                element.append(articles);

                //don't run jquery.nested if the browser size is below 640px. This prevents it from running on mobile, which would cause problems.
                var mq = window.matchMedia( "(min-width: 640px)" );

                if (mq.matches) {
                    // viewport width is at least 640px
                    element.nested(options);
                }
            };

            var append = function(newArticles){
                $log.info('Running append function...');
                var imageWidth = "", imageHeight = "", src = "";
                var articleHolder = "";
                newArticles.forEach(function (article) {
                    if(article.images[0]){
                        imageWidth = article.abstractImage.w;
                        imageHeight = article.abstractImage.h;
                        src = article.abstractImage.src;
                        articleHolder = '<div class="article-holder"><img width="'+ imageWidth +'" height="'+ imageHeight +'" src="'+ src +'"></div>';
                    }

                    articles += '<div id="'+ article._id +'" class="article '+ gridCombinations[article.layout].size+'">\
                                    <div>\
                                        <h4><a href="#/article/' + article._id + '">'+ article.title +'</a></h4><p class="description"><b>Score: </b><i>'+ article.score +'</i></p>'+ articleHolder +'\
                                        <p class="description">' + article.description + '</p>\
                                    </div>\
                                </div>';

                    articleHolder = "";
                });

                element.append(articles);

                //don't run jquery.nested if the browser size is below 640px. This prevents it from running on mobile, which would cause problems.
                var mq = window.matchMedia( "(min-width: 640px)" );

                if (mq.matches) {
                    // viewport width is at least 640px
                    element.append(articles).nested('append', articles);
                }
            }

            scope.$watch('articles', function (newValue, oldValue) {
                if (newValue.length > 0 && oldValue.length == 0){
                    setup();
                }else if(newValue.length > 0 && oldValue.length > 0){
                    append(scope.$parent.newArticles);
                }
            });
        }
    };
}]);

angular.module('ejs.directives').directive('feedImageSlider', ['$compile', '$log', function($compile, $log){
    return {
        compile: function(element, attrs, transclude){
            return function(scope, element, attrs) {
                scope.$watch('article', function(article){
                    if(article){
                        var html = angular.element('<div id="feed-images" class="feed-image-slider">\
                                    <div class="slides_container">');

                        var addImage = function(image) {
                            var imgEle = angular.element('<img/>')
                                .load(function(e){
                                    image.w = e.target.naturalWidth;
                                    image.h = e.target.naturalHeight;
                                }).attr('src', image.src)
                                .appendTo(html);
                        };

                        article.images.forEach(addImage);

                        element.html(html);
                    }
                });
            }
        }
    }
}]);

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