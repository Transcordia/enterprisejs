'use strict';

/* Controllers */

//
/*var tablet = window.matchMedia( "(max-width: 1024px)" );
var mobile = window.matchMedia( "(max-width: 640px)" );*/

var tablet = Modernizr.mq( "only screen and (max-width: 1024px)" );
var mobile = Modernizr.mq( "only screen and (max-width: 640px)" );

function is_touch_device() {
    return !!('ontouchstart' in window) // works on most browsers
        || !!('onmsgesturechange' in window); // works on ie10
}

function AppCtrl($rootScope, $scope, $http, $log, $location, $routeParams) {
    $scope.urlToCheck = '';
    $scope.articles = [];

    var page = 1;
    var numArticles = 20;
    var totalArticles = 10;
    var tabletMode = ((tablet) && !(mobile)) && (is_touch_device());

    if (tabletMode)
    {
        // viewport is tablet
        numArticles = 6;
    }

    $http.get('api/articles')
        .success(function(data, status, headers){
            page = 1;

            if(data.content.length == 0){
                generateRandomArticles(totalArticles, function(data) {
                    $http.post('api/articles', data)
                        .success(function(data, status, headers){
                            $log.info(data.articles);
                            $http.get('api/articles/score');
                        });
                }, $http);
            }else{
                $scope.articles = data.content;
            }
        });

    $rootScope.doLogin = function(){
        $http.post('api/login')
            .success(function(data, status){
                $log.info(data);
            })
    };
    //note: we should probably eventually switch to using start/size arguments for paging.
    //this will likely happen as a result of switching to Zocia
    //once this happens, we will need to listen to events to catch how many articles successfully get added to the grid
    //example code follows
    /*
     scope.$on('event:nextPageStart', function(event, nextStart) {
     pageStart += nextStart;
     });
     */

    $scope.$on('LOAD_MORE', function(){
        loadMoreArticles();
    });

    $scope.loadMore = function() {
        loadMoreArticles();
    };

    function loadMoreArticles(){
        page++;

        if(page * numArticles <= totalArticles){
            $log.info('Loading page ' + page);

            $http.get('api/articles/?page='+ page +'&numArticles='+ numArticles)
                .success(function(data){
                    if(!tabletMode)
                    {
                        $scope.newArticles = data.articles;

                        $scope.articles = $scope.articles.concat(data.articles);
                    } else { //if the user is on a tablet, then we want to replace the article list with the old articles + the new page of articles
                        $scope.articles = $scope.extraTabletArticles.concat(data.articles);
                        window.scrollTo(0, 0);
                    }
                    $log.info($scope.articles);
                    $scope.$emit('LOAD_MORE_COMPLETE');
                });
        }
    }

    $scope.$on('extraArticles', function(event, extras) {
        $scope.extraTabletArticles = extras;
    });
}
AppCtrl.$inject = ["$rootScope","$scope", "$http", "$log", "$location", "$routeParams"];

//Controller for adding articles. This is mostly for the pop-up modal windows when adding an article.
//the template for this is located in add-article.html
function addArticleCtrl($rootScope, $scope, $http, $log, $location, truncate) {
    $rootScope.showAddUrlModal = false;
    $scope.showAddArticleModal = false;

    //processes an URL that the user inputs, returning the result to us as a "proto-article" such that we can eventually add it to the database
    $scope.addArticle = function(url){
        $http.post('api/processurl', {
            url: url
        })
            .success(function(data, status, headers){
                $log.info(data);
                $rootScope.showAddUrlModal = false;
                $scope.showAddArticleModal = true;
                $scope.article = data.response;
                if($scope.article.images.length === 0)
                {
                    activeImage = -1;
                }

                $log.info($('.slides_container img'));
            });
    };

    var imagesLoaded = 0;
    var activeImage = 0;

    //this is a function in case there's eventually more to showing the currently selected image other than setting a variable to true
    function showActiveImage() {
        $scope.article.images[activeImage].show = true;
    }

    function stripSmallImages()
    {
        var largeImages = [];
        // loop through the images and remove any images that are too small
        // in this case, any images with a height less than 50px
        angular.forEach($scope.article.images, function(image, key){
            if(image.h > 49){
                image.show = false;
                largeImages.push(image);
            }
        });

        //overwrite the images with the "approved" list (those that are large enough to matter)
        $scope.article.images = largeImages;
        if($scope.article.images.length > 0)
        {
            showActiveImage();
        } else {
            activeImage = -1;
        }
    }

    //because we don't know the image sizes until they've been loaded, we need to wait til the Event:ImageLoaded event has been fired for ALL the images before we filter out the small ones
    //the Event:ImageLoaded event comes from the checkSize directive in directives.js
    $scope.$on('Event:ImageLoaded', function() {
        imagesLoaded++;
        if(imagesLoaded === $scope.article.images.length) {
            stripSmallImages();
        }
    });

    //the following functions are those that deal with choosing (or not) an image when everything is loaded
    $scope.previousImage = function() {
        $scope.article.images[activeImage].show = false;
        activeImage--;
        if(activeImage < 0) {
            activeImage = $scope.article.images.length - 1;
        }
        showActiveImage();
    };

    $scope.nextImage = function() {
        $scope.article.images[activeImage].show = false;
        activeImage++;
        if(activeImage >= $scope.article.images.length) {
            activeImage = 0;
        }
        showActiveImage();
    };

    //setting activeImage to -1 will let the "saveArticle" bit know not to include an image.
    //todo: this does not hide the next/previous image buttons, and can cause an out of bounds error if those are used after the image is hidden
    $scope.noImage = function() {
        $scope.article.images[activeImage].show = false;
        activeImage = -1;
    };

    //Once the user is OK with the parsed article, and has decided on an image to use, this does all the further processing needed to save said article.
    //todo: maybe move some of this processing server side?
    $scope.saveArticle = function(article){
        $scope.showAddArticleModal = false;

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

        if(activeImage >= 0)
        {
            article.images = $scope.article.images[activeImage];
        } else {
            article.images = [];
        }

        article.description = stripped;

        var data = {
            article: article
        };

        $http.post('api/articles', data)
            .success(function(data, status, headers){
                $log.info(data);

                $location.path('/article/edit/' + data.content._id);
            });
    };

    //strips html elements from content by wrapping it in a div and then getting the plaintext
    function strip(html)
    {
        var tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent||tmp.innerText;
    }

}
addArticleCtrl.$inject = ["$rootScope","$scope", "$http", "$log", "$location", "truncate"];

/**
 * For editing an article (mostly choosing layout after the article gets imported. This might not be needed, depending on how things go)
 */
function EditArticleCtrl($rootScope, $scope, $http, $log, $location, $routeParams, $timeout){
    //timeout added because there's a slight delay between initially saving an article and being able to load it from the server.
    //there's likely a few solutions for improving this issue, but for now, we'll leave it in
    $timeout(function(){
        $http.get('api/articles/' + $routeParams.id)
            .success(function(data, status, headers){
                $scope.article = data.content;
            });
    }, 1000);

    $scope.articleLayout = "one-col three-row";

    $scope.save = function() {
        $http.put('api/articles', { "article": $scope.article })
            .success(function(data, status, headers){
                $location.path('/article/' + data._id);
            });
    }
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

    $scope.articleLayout = "one-col three-row";
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
    };

    $scope.start = function()
    {
        $scope.pause = false;
        $timeout(update, 1000);
    };

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
    };
}

function MobileCtrl($scope, $http, $log, $routeParams){
    alert('page number ' + $routeParams.page);
}
MobileCtrl.$inject = ["$scope", "$http", "$log", "$routeParams"];
