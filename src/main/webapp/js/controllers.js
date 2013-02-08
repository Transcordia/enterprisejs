'use strict';

/* Controllers */


function AppCtrl($rootScope, $scope, $http, $log, $location, truncate, $routeParams) {
    $rootScope.showAddUrlModal = false;
    $scope.showAddArticleModal = false;

    $scope.urlToCheck = '';

    $http.get('api/articles')
        .success(function(data, status, headers){
            var totalArea = 0;
            var gridArea = 60;
            var i = 0;
            // we need a preferred area total of 6 for a page
            $scope.articles = [];

            if(data.length == 0){
                generateRandomArticles(50, function(data) {
                    $http.post('api/articles', data)
                        .success(function(data, status, headers){
                            $log.info(data);
                        });
                });
            }else{
                while(totalArea < gridArea){
                    // what is the preferred area of this article?
                    // add it to the total area
                    totalArea += data[i].preferredArea;
                    i++;

                    $scope.articles.push(data[i]);
                }

                // now that we have our articles we need to fit them into a layout
                var remainingArea = gridArea;
                for(var j = 0; j < $scope.articles.length; j++){
                    if($scope.articles[j].preferredArea > remainingArea){
                        $scope.articles[j].preferredArea = remainingArea == 0 ? 1 : remainingArea;
                    }

                    if($scope.articles[j].preferredArea == 4){
                        $scope.articles[j].layout = "5";
                    }

                    if($scope.articles[j].preferredArea == 3){
                        $scope.articles[j].layout = "4"
                    }

                    if($scope.articles[j].preferredArea == 2){
                        $scope.articles[j].layout = "2"; // one cols two rows
                        // how do i determine the orientation of an article with a preferredArea of 2
                        // $scope.articles[j].layout = "8"; // two cols one row
                    }

                    if($scope.articles[j].preferredArea == 1){
                        $scope.articles[j].layout = "1"
                    }

                    remainingArea -= $scope.articles[j].preferredArea;
                }

                $scope.articles[0].layout = "1";
                //$scope.articles[1].layout = "2";
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
}
AppCtrl.$inject = ["$rootScope","$scope", "$http", "$log", "$location", "truncate"];

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



/**
 * Article sorting
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