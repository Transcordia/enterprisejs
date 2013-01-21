'use strict';

/* Directives */
angular.module('ejs.directives', []);

angular.module('ejs.directives').directive('isotope', ['truncate', '$timeout', function (truncate, $timeout) {
    return {
        scope: {
            articles: '='
        },
        link: function (scope, element, attrs) {
            var options = {
                animationEngine : 'best-available',
                itemSelector: '.article',
                layoutMode: 'masonry'
            };

            var init = function() {
                element.isotope(options);
            };

            var setup = function () {
                var articles = '';
                scope.articles.forEach(function (article) {
                    if(article.description === article.content){
                        article.description = truncate(article.description, 150);
                    }

                    articles += '<div class="article">\
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
                });

                element.isotope('remove', element.find('article'));
                element.isotope('insert', $(articles));
            };

            scope.$watch('articles', function (newValue, oldValue) {
                //if (newValue.length == 0) init();
                if (newValue && newValue.length > 0) setup();

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