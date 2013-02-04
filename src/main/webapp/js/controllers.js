'use strict';

/* Controllers */


function HomeCtrl($rootScope, $scope, $http, $log, $location, truncate) {
    $rootScope.showAddUrlModal = false;
    $scope.showAddArticleModal = false;

    $scope.urlToCheck = '';

    $http.get('api/articles')
        .success(function(data, status, headers){
            $scope.articles = data;
            //$scope.articles = $scope.articles.splice(1);
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
        var largeImages = [];

        // strip the html tags out of the description
        var stripped = $.trim(strip(article.description));

        // if the article has an empty content attribute and the description
        // is long enough, let's use the description
        /*if(article.content === "" && stripped.length > 200){
            article.content = article.description;
        }*/

        // truncate long descriptions
        if(stripped.split(" ").length > 100){
            article.description = truncate(stripped, 100);
        }

        // loop through the images and remove any images that are too small
        // in this case, any images with a height less than 50px
        angular.forEach(article.images, function(image, key){
            if(image.h > 49){
                largeImages.push(image);
            }
        });

        article.images = largeImages.slice(0);
        article.description = stripped;

        // assign this article a layout based on its content
        article.layout = assignLayout(article);
        $log.info('This article was assigned a layout of ' + article.layout);

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

    function assignLayout(article){
        var layout = 1;
        // an article can have a title, image, and description

        // if an article has no images assign a value of 1
        if(article.images.length === 0 && article.description !== ""){
            // if an article has no images and a long description
            if(article.description.split(" ").length > 70){
                return 4;
            }
            return 1;
        }

        // article has an image and a description
        if(article.images.length > 0 && article.description !== ""){
            // article has long description
            if(article.description.split(" ").length > 40){
                return 8;
            }

            if(article.description.split(" ").length < 20){
                return 1;
            }
        }else{
            return 1;
        }
        // if an article has an image but no description assign a value of 1
        // if an article has an image with an area of at least 80,000 px
        //  and a description assign a value of 4,5
        return layout;
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
