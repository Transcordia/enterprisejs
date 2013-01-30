'use strict';

/* Controllers */


function HomeCtrl($rootScope, $scope, $http, $log, $location) {
    $rootScope.showAddUrlModal = false;
    $scope.showAddArticleModal = false;

    $scope.urlToCheck = '';

    $http.get('api/articles').
        success(function(data, status, headers){
            $scope.articles = data;

        });

    $scope.addArticle = function(url){
        var data = {
            url: url
        };

        $http.post('api/processurl', data)
            .success(function(data, status, headers){
                $log.info(data);
                $rootScope.showAddUrlModal = false;
                $scope.showAddArticleModal = true;
                $scope.article = data.response;
            });
    };

    $scope.saveArticle = function(article){
        $scope.showAddArticleModal = false;
        var data = {
            article: article
        };

        $http.post('api/articles', data)
            .success(function(data, status, headers){
                $log.info(data);

                $location.path('/article/' + data._id);
            });
    };
}
HomeCtrl.$inject = ["$rootScope","$scope", "$http", "$log", "$location"];

function ArticleCtrl($rootScope, $scope, $http, $log, $location, $routeParams, $timeout, truncate){
    $timeout(function(){
        $http.get('api/articles/' + $routeParams.id)
            .success(function(data, status, headers){
                var content = '';

                if(!data.content){
                    data.content = data.description;
                }

                if(data.content === data.description){
                    // truncate the description
                    data.description = truncate(data.content, 200);
                }

                $scope.article = data;
            });
    }, 1000);
}
ArticleCtrl.$inject = ["$rootScope","$scope", "$http", "$log", "$location", "$routeParams", "$timeout", "truncate"];
