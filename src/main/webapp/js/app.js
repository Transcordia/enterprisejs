'use strict';


// Declare app level module which depends on filters, and services
angular.module('ejs', ['ejs.filters', 'ejs.services', 'ejs.directives', 'ui']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/home',
        {
            templateUrl: 'partials/home.html',
            controller: HomeCtrl
        });

    $routeProvider.when('/new-article',
        {
            templateUrl: 'partials/new-article.html',
            controller: HomeCtrl
        });

    $routeProvider.otherwise({redirectTo: '/home'});
  }]);
