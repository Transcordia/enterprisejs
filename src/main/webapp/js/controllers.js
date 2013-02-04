'use strict';

/* Controllers */


function HomeCtrl($rootScope, $scope, $http, $log, $location, truncate) {
    $rootScope.showAddUrlModal = false;
    $scope.showAddArticleModal = false;

    $scope.urlToCheck = '';

    $http.get('api/articles').
        success(function(data, status, headers){
            $scope.articles = data;
            $scope.articles = $scope.articles.splice(6,5);
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

                $log.info($('.slides_container img'));
            });
    };

    $scope.saveArticle = function(article){
        $scope.showAddArticleModal = false;

        // strip the html tags out of the description
        var stripped = $.trim(strip(article.description));

        // if the article has an empty content attribute and the description
        // is long enough, let's use the description
        if(article.content === '' && stripped.length > 200){
            article.content = article.description;
        }

        // truncate long descriptions
        if(stripped.length > 200){
            article.description = truncate(stripped, 30);
        }

        var data = {
            article: article
        };

        $http.post('api/articles', data)
            .success(function(data, status, headers){
                $log.info(data);

                $location.path('/article/' + data._id);
            });
    };

    function strip(html)
    {
        var tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent||tmp.innerText;
    }

    function assignAreaRating(article){
        // an article can have a title, image, and description
        // if an article has no image assign a value of 1
        // if an article has an image but no description assign a value of 1
        // if an article has an image and a description assign a value of 2,3
        // if an article has an image with an area of at least 80,000 px
        //  and a description assign a value of 4,5
        return article;
    }
}
HomeCtrl.$inject = ["$rootScope","$scope", "$http", "$log", "$location", "truncate"];

function ArticleCtrl($rootScope, $scope, $http, $log, $location, $routeParams, $timeout){
    $timeout(function(){
        $http.get('api/articles/' + $routeParams.id)
            .success(function(data, status, headers){
                $scope.article = data;
            });
    }, 1000);
}
ArticleCtrl.$inject = ["$rootScope","$scope", "$http", "$log", "$location", "$routeParams", "$timeout"];
