'use strict';

/* Directives */
angular.module('ejs.directives', []);

angular.module('ejs.directives').directive('isotope', function () {
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
                    articles += '<div class="article">\
                                    <div class="article-holder"></div>\
                                    <p class="description">' + article.description + '</p>\
                                    <p class="stats clearfix">\
                                        <span class="likes-count">' + article.stats.likes + ' likes</span>\
                                        <span class="comment-count">' + article.stats.comments + ' comments</span>\
                                        <span class="reblog-count">' + article.stats.reblogs + ' reblogs</span>\
                                    </p>\
                                    <div class="convo clearfix">\
                                        <a href=""><div class="image-placeholder"></div></a>\
                                        <p>' + article.convoStarter.content + '</p>\
                                    </div>\
                                    <div class="comments">\
                                        <div class="comment convo">\
                                            <a href=""><div class="image-placeholder"></div></a>\
                                            <p>' + article.comments[0].content + '</p>\
                                        </div>\
                                    </div>\
                                </div>';
                });

                element.isotope('remove', element.find('article'));
                element.isotope('insert', $(articles));
            };

            scope.$watch('articles', function (newValue, oldValue) {
                //if (newValue.length == 0) init();
                if (newValue.length > 0) setup();
            });

            init();
        }
    };
});

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