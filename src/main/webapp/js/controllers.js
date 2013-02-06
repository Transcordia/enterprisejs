'use strict';

/* Controllers */


function AppCtrl($rootScope, $scope, $http, $log, $location, truncate, $routeParams) {
    $rootScope.showAddUrlModal = false;
    $scope.showAddArticleModal = false;

    $scope.urlToCheck = '';

    $http.get('api/articles')
        .success(function(data, status, headers){
            $scope.articles = data;

            if($scope.articles.length == 0){
                generateRandomArticles(20);
            }
            //$scope.articles = $scope.articles.splice(0,4);
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

    $rootScope.doLogin = function(){
        $http.post('api/login')
            .success(function(data, status){
                $log.info(data);
            })
    }

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
        //  and a description assign a value of 4,5
        return layout;
    }

    function generateRandomArticles(total){
        var articles = [];
        var article = {};
        var content = "";

        for(var i = 1; i <= total; i++){
            content = generateContent();
            article = {
                //"id": 1,
                "title": generateTitle(),
                "content": content,
                "date": generateDate(),
                "description": generateDescription(content),
                "likes": Math.floor(Math.random() * 100),
                "images": generateImages(),
                "layout": generateLayout(),
                "url": "somerandomwebsite.com"
            }

            // give the first article a layout of one... for now
            if(i === 1){
                article.layout = 1;
            }

            var data = {
                article: article
            };

            // persist each article
            $http.post('api/articles', data)
                .success(function(data, status, headers){
                    $log.info(data);
                });

            //articles.push(article);
        }

        return articles;
    }

    function generateTitle(){
        var title = "";
        var min = 5, max = 20;
        var numWords = Math.floor(Math.random() * (max - min + 1)) + min;
        title = toTitleCase(loremIpsumSentence(numWords));

        return title;
    }

    function toTitleCase(str){
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }

    function generateContent(){
        var content = "";
        var min = 100, max = 300;
        var numWords = Math.floor(Math.random() * (max - min + 1)) + min;
        content = loremIpsumSentence(numWords);

        return content;
    }

    function generateDate(){
        return standardizedNow();
    }

    function generateDescription(content){
        var description = "";
        var min = 10, max = content.split(" ").length;
        description = content.split(" ").splice(0, Math.floor(Math.random() * (max - min + 1)) + min).join(" ");

        return description;
    }

    function generateImages(){
        var numImages = Math.floor(Math.random() * 5);
        var images = [];
        var image = {};
        var width = 0, height = 0;

        if(numImages == 0){
            return images;
        }else{
            for(var i = 1; i <= numImages; i++){
                var min = 50, max = 600;
                width = Math.floor(Math.random() * (max - min + 1)) + min;
                height = Math.floor(Math.random() * (max - min + 1)) + min;

                image = {
                    "src": "http://placehold.it/" + width + "x" + height,
                    "w": width,
                    "h": height
                }
                images.push(image);
            }

            return images;
        }
    }

    function generateLayout(){
        var layouts = ["1", "2", "3", "4", "5", "8"];

        return layouts[Math.floor(Math.random() * 6)];
    }

    /**
     *  Returns time stamp as a string YYYY-mm-ddTHH:mm:ssZ
     */
    function standardizedNow(d) {
        if (!d) d = new Date();
        return dateToISO8601(d, '-', ':');
    }

    /**
     * Convert a JS date object to an ISO8601 string representation. Optional separator characters
     * for date and time can be supplied. Default values for separators are provided.
     *
     * @param {Date} d A JS date object to format
     * @param {String} dateSep Separator for date terms. Default is '-'.
     * @param {String} timeSep Separator for time terms. Default is ':'.
     * @return {String} The ISO8601 formatted date and time value.
     */
    function dateToISO8601(d, dateSep, timeSep) {
        function pad(n) {
            return n < 10 ? '0' + n : n
        }

        if (typeof dateSep !== 'string') dateSep = '-';
        if (typeof timeSep !== 'string') timeSep = ':';

        return d.getUTCFullYear() + dateSep
            + pad(d.getUTCMonth() + 1) + dateSep
            + pad(d.getUTCDate()) + 'T'
            + pad(d.getUTCHours()) + timeSep
            + pad(d.getUTCMinutes()) + timeSep
            + pad(d.getUTCSeconds());
    }
}
AppCtrl.$inject = ["$rootScope","$scope", "$http", "$log", "$location", "truncate"];

function UserStatusCtrl($scope, $http, $log){
    $log.info('UserStatusCtrl called!');

}
UserStatusCtrl.inject = ["$scope", "$http", "$log"];

function GITCtrl($scope, $http, $log){
    $log.info('GITCtrl called!');
}
GITCtrl.inject = ["$scope", "http", "$log"];

function ArticleCtrl($rootScope, $scope, $http, $log, $location, $routeParams, $timeout){
    $timeout(function(){
        $http.get('api/articles/' + $routeParams.id)
            .success(function(data, status, headers){
                $scope.article = data;
            });
    }, 1000);

    $scope.articleLayout = "one-col three-row"
}
ArticleCtrl.$inject = ["$rootScope","$scope", "$http", "$log", "$location", "$routeParams", "$timeout"];
