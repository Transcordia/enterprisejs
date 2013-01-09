'use strict';

/* Directives */
angular.module('ejs.directives', []);

angular.module('ejs.directives', []).
    directive('isotope', function () {
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
                                    </div>'
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
