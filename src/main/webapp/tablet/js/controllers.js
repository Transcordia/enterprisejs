/**
 * Created with IntelliJ IDEA.
 * User: james
 * Date: 4/23/13
 * Time: 12:25 PM
 * To change this template use File | Settings | File Templates.
 */

function AppCtrl($rootScope, $scope, $http, $log, $location, $routeParams, $timeout, $window) {
    $scope.urlToCheck = '';
    $scope.articles = [];
    $scope.loading = true;
    $scope.showGears = "";

    var from = 0;
    var size = 6;
    var lastPage = false;
    var totalArticles = 51;

    /**
     * If you need to generate random articles in order to seed elasticsearch, run this xhr AFTER all articles have
     * been generated and indexed
     * $http.get('api/articles/score');
     */

    $log.info('scope id in controller: ' + $scope.$id);

    $http.get('/ejs/api/articles/?from=' + from + '&size=' + size)
        .success(function(data, status, headers){
            if(data.content.length == 0){
                generateRandomArticles(totalArticles, function(data) {
                    $http.post('api/articles', data)
                        .success(function(data, status, headers){
                            $log.info(data.content);
                        });
                });
            }else{
                $scope.showGears = "fadeout";

                $scope.articles = data.content;

                $scope.loading = false;
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
    $scope.$on('event:nextPageStart', function(event, nextStart) {
        from += nextStart;

        $log.info('total number of articles placed on the page: ' + from);
    });

    $scope.$on('event:loadMoreArticles', function(){
        /*$http.get('/ejs/api/articles/?from='+ from +'&size='+ size)
            .success(function(data){
                if(data.content.length != 1) {
                    $scope.articles = data.content;
                }else{
                    lastPage = true;
                    $scope.$broadcast('event:lastPage');
                }
            });*/

        var jqxhr = $.ajax('/ejs/api/articles/?from='+ from +'&size='+ size)
            .done(function(data){
                //$log.info(data.content.length);
                if(data.content.length != 1) {
                    $scope.articles = data.content;
                }else{
                    lastPage = true;
                    $scope.$broadcast('event:lastPage');
                }
            })
            .fail(function(){ $log.info('The call failed!')});
    });


}
AppCtrl.$inject = ["$rootScope","$scope", "$http", "$log", "$location", "$routeParams", "$timeout", "$window"];

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
function ArticleCtrl($rootScope, $scope, $http, $log, $location, $routeParams, $window){
    var id = $routeParams.id;
    $http.get('/ejs/api/articles/' + id)
        .success(function(data, status, headers){
            $scope.article = data.content;

            $http.post('/ejs/api/articles/views/'+ id)
                .success(function(data) {
                    $scope.article.views = data.content.views;
                });
        });

    var marginLeft = 'margin-left:-' + (($window.innerWidth * 0.96) / 2) + 'px';

    $scope.marginLeft = marginLeft;
    //we need to know the full URL for twitter/facebook sharing, and when we get it, we need to url encode the # so it doesn't break things
    $scope.fullUrl = $location.absUrl().replace('#', '%23');

    $scope.showArticle = setModal;

    function setModal(value)
    {
        $scope.showFullArticle = value;
    }

    setModal(false);
}
ArticleCtrl.$inject = ["$rootScope","$scope", "$http", "$log", "$location", "$routeParams", "$window"];
