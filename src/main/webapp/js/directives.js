'use strict';

/* Directives */
angular.module('ejs.directives', []);

angular.module('ejs.directives').directive('isotope', ['truncate', '$timeout', '$log', function (truncate, $timeout, $log) {
    return {
        scope: {
            articles: '='
        },
        link: function (scope, element, attrs) {
            var grid = [
                [1, 1, 1],
                [2, 3, 4]
            ];

            var gridCombinations = {
                "1": {
                    "w": 'one-col',
                    "h": 'one-row'
                },
                "2": {
                    "w": 'one-col',
                    "h": 'two-row'
                },
                "3": {
                    "w": 'two-col',
                    "h": 'one-row'
                },
                "4": {
                    "w": 'three-col',
                    "h": 'one-row'
                },
                "5": {
                    "w": 'two-col',
                    "h": 'two-row'
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

            var generateGrid = function(){
                // grab a random grid combination
                var combo = gridCombinations[(Math.floor(Math.random() * 5) + 1).toString()];

                // this is article 1, assign values to the grid array
                /*grid[0][0] = 1;
                grid[0][1] = 1;
                grid[1][0] = 1;
                grid[1][1] = 1;*/
            };

            var setup = function () {
                var articles = '';
                var j = 0;
                var combos = ['4', '1', '1', '1'];
                var area = {};
                scope.articles.forEach(function (article) {
                    if(article.description === article.content){
                        article.description = truncate(article.description, 200);
                    }

                    articles += '<div class="article '+ gridCombinations[combos[j]].w +' '+ gridCombinations[combos[j]].h +'">\
                                    <h4>'+ article.title +'</h4>\
                                    <div class="article-holder"><img src="'+ article.images[0] +'"></div>\
                                    <p class="description">' + article.description + '</p>\
                                    <p class="stats clearfix">\
                                        <span class="likes-count">' + 0 + ' likes</span>\
                                        <span class="comment-count">' + 0 + ' comments</span>\
                                        <span class="reblog-count">' + 0 + ' reblogs</span>\
                                    </p>\
                                    <div class="convo clearfix">\
                                        <a href=""><div class="image-placeholder"></div></a>\
                                        <p>First comment here</p>\
                                    </div>\
                                    <div class="comments">\
                                        <div class="comment convo">\
                                            <a href=""><div class="image-placeholder"></div></a>\
                                            <p>Second comment here</p>\
                                        </div>\
                                    </div>\
                                </div>';
                    j++;
                });

                element.isotope('remove', element.find('article'));
                element.isotope('insert', $(articles));
            };

            scope.$watch('articles', function (newValue, oldValue) {
                //if (newValue.length == 0) init();
                if (newValue && newValue.length > 0){
                    generateGrid();
                    setup();
                }

                //element.isotope('reLayout');
            });

            init();
        }
    };
}]);

angular.module('ejs.directives').directive('feedImageSlider', ['$compile', function($compile){
    return {
        compile: function(element, attrs, transclude){
            return function(scope, element, attrs) {
                scope.$watch('article', function(article){
                    if(article){
                        var html = '<div id="feed-images" class="feed-image-slider">\
                                    <div class="slides_container">';


                        article.images.forEach(function(image){
                            html += '<img src="'+ image +'" alt=""><br><br>';
                        });

                        html += '</div>\
                                <div class="btn-group">\
                                    <button class="btn btn-mini prev-image"><i class="icon-step-backward"></i> Prev</button>\
                                    <button class="btn btn-mini next-image">Next <i class="icon-step-forward"></i></button>\
                                </div>\
                            </div>';

                        //element.html($compile(html)(scope));
                        element.html(html);

                        /*$('#feed-images').slides({
                            next: 'next-image',
                            prev: 'prev-image',
                            generatePagination: false
                        });*/
                    }
                });
               // $compile(element)(scope);
            }
        }
    }
}]);