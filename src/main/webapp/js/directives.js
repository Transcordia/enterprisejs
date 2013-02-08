'use strict';

/* Directives */
angular.module('ejs.directives', []);

angular.module('ejs.directives').directive('nested', ['truncate', '$timeout', '$log', function (truncate, $timeout, $log) {
    return {
        scope: {
            articles: '='
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

            //var minWidth = window.innerWidth / 3;
            var options = {
                selector: ".article",
                minWidth: 200,
                gutter: 10
            };

            var articles = '';

            var setup = function () {
                var j = 0;
                var combos = ['1', '8', '8', '1'];
                var area = {};
                var imageWidth = "", imageHeight = "", src = "";
                var articleHolder = "";
                scope.articles.forEach(function (article) {
                    if(article.images[0]){
                        imageWidth = article.images[0].w;
                        imageHeight = article.images[0].h;
                        src = article.images[0].src;
                        articleHolder = '<div class="article-holder"><img width="'+ imageWidth +'" height="'+ imageHeight +'" src="'+ src +'"></div>';
                    }

                    articles += '<div id="'+ article._id +'" class="article '+ gridCombinations[article.layout].size+'">\
                                    <div>\
                                        <h4>'+ article.title +'</h4>'+ articleHolder +'\
                                        <p class="description">' + article.description + '</p>\
                                    </div>\
                                </div>';
                    j++;

                    articleHolder = "";
                });

                element.append(articles);
                element.nested(options);
            };

            scope.$watch('articles', function (newValue, oldValue) {
                //if (newValue.length == 0) init();
                if (newValue && newValue.length > 0){
                    setup();
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
                                })
                                .attr('src', image.src)
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