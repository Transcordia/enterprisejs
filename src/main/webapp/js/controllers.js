'use strict';

/* Controllers */


function AppCtrl($rootScope, $scope, $http, $log, $location, truncate, $routeParams) {
    $rootScope.showAddUrlModal = false;
    $scope.showAddArticleModal = false;

    $scope.urlToCheck = '';
    $scope.articles = [];

    var page = 1;
    var numArticles = 20;
    var totalArticles = 100;

    $http.get('api/articles/?page=' + page +'&numArticles='+ numArticles)
        .success(function(data, status, headers){
            page = 1;

            if(data.articles.length == 0){
                generateRandomArticles(totalArticles, function(data) {
                    $http.post('api/articles', data)
                        .success(function(data, status, headers){
                            $log.info(data.articles);
                            $http.get('api/articles/score');
                        });
                });
            }else{
                $scope.articles = data.articles;

                assignPreferredArea($scope.articles);
            }
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

                $location.path('/article/edit/' + data._id);
            });
    };

    function strip(html)
    {
        var tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent||tmp.innerText;
    }

    function assignPreferredArea(articles){
        // now that we have our articles we need to fit them into a layout
        for(var j = 0; j < articles.length; j++){
            if(articles[j].preferredArea == 5){
                articles[j].layout = "5";
            }

            if(articles[j].preferredArea == 4){
                articles[j].layout = "4"
            }

            if(articles[j].preferredArea == 3){
                articles[j].layout = "2"; // one cols two rows
            }

            if(articles[j].preferredArea == 2){
                articles[j].layout = "8"; // one cols two rows
            }

            if(articles[j].preferredArea == 1){
                articles[j].layout = "1"
            }
        }
    }

    $scope.loadMore = function() {
        page++;

        if(page * numArticles <= totalArticles){
            $log.info('Loading page ' + page);

            $http.get('api/articles/?page='+ page +'&numArticles='+ numArticles)
                .success(function(data){
                    $scope.newArticles = data.articles;

                    // now that we have our articles we need to fit them into a layout
                    assignPreferredArea($scope.newArticles);

                    $scope.articles = $scope.articles.concat(data.articles);
                    $log.info($scope.articles);
                });
        }
    };
}
AppCtrl.$inject = ["$rootScope","$scope", "$http", "$log", "$location", "truncate"];

/**
 * For editing an article (mostly choosing layout after the article gets imported. This might not be needed, depending on how things go
 */
function EditArticleCtrl($rootScope, $scope, $http, $log, $location, $routeParams, $timeout){
    $timeout(function(){
        $http.get('api/articles/' + $routeParams.id)
            .success(function(data, status, headers){
                $scope.article = data;
            });
    }, 1000);

    $scope.articleLayout = "one-col three-row"
}
EditArticleCtrl.$inject = ["$rootScope","$scope", "$http", "$log", "$location", "$routeParams", "$timeout"];


/**
 * Single article view
 *
 * @param $rootScope
 * @param $scope
 * @param $http
 * @param $log
 * @param $location
 * @param $routeParams
 */
function ArticleCtrl($rootScope, $scope, $http, $log, $location, $routeParams){
    var id = $routeParams.id;
    $http.get('api/articles/' + id)
        .success(function(data, status, headers){    console.log("RESULT: ",data);
            $scope.article = data;
            $http.get('api/article/view/'+ id)
                .success(function(data) {
                    $scope.article.views = data.views;
                });
        });

    $scope.articleLayout = "one-col three-row"
}
ArticleCtrl.$inject = ["$rootScope","$scope", "$http", "$log", "$location", "$routeParams"];



/**
 * Article sorting
 * This is mostly for testing the sorting algorithm and will likely be deleted or commented out in the future when things get more final
 */
function SortTest($rootScope, $scope, $timeout, $http)
{
    var MILISECONDS_IN_HOURS = 3600000;
    $scope.pause = true;
    $scope.articles = generateRandomArticles(10, false);

    function calculateScore(article, now)
    {
        var age = Math.floor((now - new Date(article.date).getTime())/MILISECONDS_IN_HOURS);
        var gravity = 2.2;
        article.score = (article.views) / (Math.pow(age + 2, gravity));
        article.age = age;
    }

    function changeScore(current_time)
    {
        console.log("OLD DATE: " + (new Date($scope.articles[0].date))+" NEW DATE: ",new Date(current_time));
        for(var i = 0; i < $scope.articles.length; i++)
        {
            $scope.articles[i].views += rand(5,10);

            calculateScore($scope.articles[i], current_time);
        }

        $scope.articles.sort(function(a, b) {
            //we actually want higher scores to move to the top, so this is the reverse the comparison on mdn
            if(a.score > b.score)
            {
                return -1;
            }
            if(a.score < b.score)
            {
                return 1;
            }

            return 0;
        });
    }

    //age is "difference in hours from article to now"
    function colorFromTime(age, index)
    {
        function pad(n) {
            n = Math.floor(n).toString(16);
            return n.length < 2 ? n + '0' : n
        }
               //R  G  B
        return '#' + pad(age) + pad(index) + pad(rand(0, 4));
    }

    function generateData(rank, time)
    {
        return { "x": time, "y": (22 - rank) };
    }

    function generateGraphData()
    {
        changeScore(0);
        var series = [];

        for(var i = 0; i < $scope.articles.length; i++)
        {
            var age = (Date.now() - new Date($scope.articles[i].date).getTime())/MILISECONDS_IN_HOURS;
            series.push({ "data": [], "color": colorFromTime(age, i) });
            series[i].data.push(generateData(i, 0));
        }

        return series;
    }

    var graph = new Rickshaw.Graph({
        element: document.querySelector("#chart"),
        width: 1000,
        height: 250,
        renderer: 'line',
        series: generateGraphData()
    });

    /*var hoverDetail = new Rickshaw.Graph.HoverDetail( {
        graph: graph,
        formatter: function(series, x, y) {
            return 'Time: '+x+ ' Rank: '+Math.floor(y + 22);
        }
    } );*/

    graph.render();

    $scope.stop = function()
    {
        $scope.pause = true;
    }

    $scope.start = function()
    {
        $scope.pause = false;
        $timeout(update, 1000);
    }

    var offset = 1;
    function update() {
        //gives us the time in the future
        var current_time = Date.now() + (MILISECONDS_IN_HOURS * offset);
        var id = $scope.articles.length + 1;
        $scope.articles.push({
            "id": id,
            "title": generateTitle(),
            "content": '',
            "date": standardizedNow(new Date(current_time)),
            "description": '',
            "likes": Math.floor(Math.random() * 100),
            "images": '',
            "layout": '',
            "url": '',
            "views": 0,//((Math.floor(Math.random() * 100) + 10))
            "age": offset
        });
        graph.series.push({ "data": [], "color": colorFromTime(offset, id) });
        graph.series[graph.series.length - 1].data.push(generateData(id, offset));

        changeScore(current_time);

        //generate the updated graph results
        for(var i = 0; i < $scope.articles.length; i++)
        {
            graph.series[$scope.articles[i].id - 1].data.push(generateData(i, offset));
        }
        graph.update();

        offset++;
        if(offset === 12)
        {
            $scope.pause = true;
        }
        if(!$scope.pause) {
            $timeout(update, 1000);
        }
    }

    $scope.cronSort = function()
    {
        $http.get('api/articles/score')
        .success(function(data, status, headers){
            console.log("SUCCESS OCCURED: "+data);
        }).error(function(data, status){
                console.log("ERROR OCCURED: "+status);
            });
    }
}