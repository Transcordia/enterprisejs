'use strict';


// Declare app level module which depends on filters, and services
angular.module('ejs', ['ejs.filters', 'ejs.services', 'ejs.directives', 'ui', 'pykl.security']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/home',
        {
            templateUrl: 'partials/home.html',
            controller: AppCtrl
        });

    $routeProvider.when('/article/edit/:id',
        {
            templateUrl: 'partials/edit-article.html',
            controller: EditArticleCtrl
        });

    $routeProvider.when('/article/add',
        {
            templateUrl: 'partials/add-article.html',
            controller: addArticleCtrl
        });

    $routeProvider.when('/article/:id',
        {
            templateUrl: 'partials/article.html',
            controller: ArticleCtrl
        });

    $routeProvider.when('/templates',
        {
            templateUrl: 'partials/templates.html',
            controller: EditArticleCtrl
        });

    $routeProvider.when('/sorttest',
        {
            controller: SortTest,
            templateUrl: 'partials/sorttest.html'
        });

    $routeProvider.when('/mobile/:page',
        {
            controller: MobileCtrl
        });

    $routeProvider.when('/login',
        {
            templateUrl: 'partials/login.html',
            controller: AppCtrl
        });

    $routeProvider.otherwise({redirectTo: '/home'});
  }]);

angular.module('ejs').value('ui.config', {
    tinymce: {
        theme: 'simple'
    }
});
