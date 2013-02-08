'use strict';


// Declare app level module which depends on filters, and services
angular.module('ejs', ['ejs.filters', 'ejs.services', 'ejs.directives', 'ui']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/home',
        {
            templateUrl: 'partials/home.html',
            controller: AppCtrl
        });

    $routeProvider.when('/article/:id',
        {
            templateUrl: 'partials/edit-article.html',
            controller: EditArticleCtrl
        });

    $routeProvider.when('/article/:id',
        {
            templateUrl: 'partials/article.html',
            controller: ArticleCtrl
        });

    $routeProvider.when('/templates',
        {
            templateUrl: 'partials/templates.html',
            controller: ArticleCtrl
        });

    $routeProvider.when('/sorttest',
        {
            controller: SortTest,
            templateUrl: 'partials/sorttest.html'
        });

    $routeProvider.otherwise({redirectTo: '/home'});
  }]);
