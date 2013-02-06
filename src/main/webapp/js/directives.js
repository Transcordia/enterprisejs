'use strict';

/* Directives */
angular.module('ejs.directives', []);

angular.module('ejs.directives').directive('isotope', ['truncate', '$timeout', '$log', function (truncate, $timeout, $log) {
    return {
        scope: {
            articles: '='
        },
        link: function (scope, element, attrs) {
            /*var grid = [
                [1, 2, 2],
                [3, 3, 4]
            ];*/

            var gridCombinations = {
                "1": {
                    "w": 'one-col', // 1
                    "h": 'one-row'
                },
                "2": {
                    "w": 'one-col', // 2
                    "h": 'two-row'
                },
                "3": {
                    "w": 'one-col', // 3
                    "h": 'three-row'
                },
                "4": {
                    "w": 'three-col', // 3
                    "h": 'one-row'
                },
                "5": {
                    "w": 'two-col', // 4
                    "h": 'two-row'
                },
                "6": {
                    "w": 'two-col',  // 5
                    "h": 'three-row'
                },
                "7": {
                    "w": 'three-col', // 5
                    "h": 'two-row'
                },
                "8": {
                    "w": 'two-col', // 2
                    "h": 'one-row'
                }
            };

            var options = {
                animationEngine : 'best-available',
                itemSelector: '.article',
                layoutMode: 'masonry'
            };

            var init = function() {
                element.isotope(options);
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

                    articles += '<div id="'+ article._id +'" class="article '+ gridCombinations[article.layout].w +' '+ gridCombinations[article.layout].h +'">\
                                    <h4>'+ article.title +'</h4>'+ articleHolder +'\
                                    <p class="description">' + article.description + '</p>\
                                </div>';
                    j++;

                    articleHolder = "";
                });

                element.isotope('remove', element.find('article'));
                element.isotope('insert', $(articles));
            };

            scope.$watch('articles', function (newValue, oldValue) {
                //if (newValue.length == 0) init();
                if (newValue && newValue.length > 0){
                    setup();
                }

                element.isotope('reLayout');
            });

            init();
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