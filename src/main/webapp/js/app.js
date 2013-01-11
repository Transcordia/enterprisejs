'use strict';


// Declare app level module which depends on filters, and services
angular.module('ejs', ['ejs.filters', 'ejs.services', 'ejs.directives', 'ui', 'ui.bootstrap.carousel', 'ui.bootstrap.transition']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/home',
        {
            templateUrl: 'partials/home.html',
            controller: HomeCtrl
        });

    $routeProvider.otherwise({redirectTo: '/home'});
  }]);
