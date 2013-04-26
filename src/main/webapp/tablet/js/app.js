'use strict';


// Declare app level module which depends on filters, and services
angular.module('ejs-tablet', ['ejs.filters', 'ejs.services', 'ejs-tablet.directives', 'ui']).
    config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/home',
        {
            templateUrl: 'partials/home.html',
            controller: AppCtrl
        });

    $routeProvider.when('/article/:id',
        {
            templateUrl: '../partials/article.html',
            controller: ArticleCtrl
        });

    $routeProvider.otherwise({redirectTo: '/home'});
}]);
