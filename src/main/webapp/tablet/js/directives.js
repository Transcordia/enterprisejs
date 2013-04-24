/**
 * Created with IntelliJ IDEA.
 * User: james
 * Date: 4/23/13
 * Time: 12:01 PM
 * To change this template use File | Settings | File Templates.
 */

/* Directives */
angular.module('ejs-tablet.directives', []);

var template = '<div id="article-container">' +
                    '<div class="sliderContainer">' +
                        '<div class="iosSlider">' +
                            '<div class="slider">' +
                                '<div class="slide" ng-repeat="page in pages">' +
                                    '<div class="article-page" grid-page articles="page.articles" page="$index"></div>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';

//this keeps track of our article pages, by dividing them up into an array of objects, each of which simply contains a property "articles"
//it's worth pointing out that the article array gets split based on the index of the last article shown, and not loaded.
//because of this, there's probably going to have to be some changes in how the paging system on the backend works once zocia is implemented.
angular.module('ejs-tablet.directives').directive('grid', ["$log", "$http", "$timeout", function($log, $http, $timeout){
    return {
        restrict: 'A',
        scope: {
            articles: '='
        },
        template: template,
        replace: true,
        compile: function(element, attrs){
            var directiveScope;

            $('.iosSlider').iosSlider({
                snapToChildren: true,
                desktopClickDrag: true,
                onSlideStart: function(args){
                    if(args.data.numberOfSlides == args.currentSlideNumber){
                        directiveScope.$emit('event:loadMoreArticles');
                    }
                },
                onSliderResize: function(args){
                    directiveScope.$broadcast('event:tabletOrientationChange');
                }
            });

            return function(scope, elem, attr) {
                $log.info('scope id: ' + scope.$id);
                directiveScope = scope;

                scope.pages = [];
                var from = 0;

                //we watch the article scope property because the array is loaded in with AJAX, and we can't do any rendering until it's loaded from the server
                //because of this, we want to make sure array of articles is at least 0 before rendering, otherwise there's nothing to render and we'd get an error message
                scope.$watch('articles', function (newValue, oldValue) {
                    if(newValue && newValue.length > 0){
                        scope.pages.push({"articles": newValue});
                    }
                });

                scope.$on('event:nextPageStart', function(event, nextStart) {
                    from += nextStart;
                });
            }
        }
    };
}]);

//this creates a single page of a grid based layout, using reservations.grid to handle the decision of where to place various abstracts in the layout.
//overall, this code isn't that much different from the nested directive, though a few bits have been moved around for speed and
//the actual process of attaching the html element to the DOM is here, instead of in the nested code
//this directive is used in conjunction with the more generic 'grid' directive, and probably never needs to be used in an actual template outside of that
angular.module('ejs-tablet.directives').directive('gridPage', ['truncate', '$timeout', '$log', 'TimeAgo', '$window', function (truncate, $timeout, $log, TimeAgo, $window) {
    return {
        scope: {
            articles: '=',
            page: '='
        },
        link:  function(scope, element, attrs) {
            //this is for converting our single digit layout property on the article to a width and height value when using the grid
            scope.$on('event:lastPage', function(){
                $('.gears').css('display', 'none');
                $('#article-container').css('margin-bottom', '0px');
            });

            //grid width and height of various combinations.
            //these are calculated in /api/utility/parse.js, preferredArea()
            var gridCombinations = {
                "1": {
                    "w": 1,
                    "h": 1
                },
                "2": {
                    "w": 1,
                    "h": 2
                },
                "3": {
                    "w": 2,
                    "h": 1
                },
                "4": {
                    "w": 3,
                    "h": 1
                },
                "5": {
                    "w": 2,
                    "h": 2
                }
            };

            var container = $(element);
            var count = 0;

            //the size of a single block (1x1) in pixels
            var blockSize = {
                "w": 320,
                "h": 320
            };

            //if we're on a tablet, the block height/width in pixels are going to be different
            blockSize.w = $window.innerWidth / 3;
            blockSize.h = ($window.innerHeight - 30) / 2;

            //these are the various properties that are passed into the grid object upon creation. Change these values when doing stuff like paging to dynamically resize the grid
            //max block width/height are for the maximum possible size of any single abstract in the grid
            var gridSize = {
                "columns": Math.floor(container.width()/blockSize.w),
                "rows": 6,
                "maxBlockWidth": 3,
                "maxBlockHeight": 2
            };

            gridSize.maxBlockWidth = 2;

            //the function that runs after all the articles are in place
            //this is still rather slow, and cause take upwards of 800-1000 ms to run

            // could not recreate the conditions that caused > 800 ms of runtime for this callback,
            // but removing the ellipsis plugin decreases the runtime by a factor of 10
            var animationComplete = function(){
                var parentWidth = 0;

                container.find('.article-content').each(function(){
                    $(this).width($(this).parent().width() - 40);
                    $(this).height($(this).parent().height() - 65);

                    if($(this).parent().hasClass('size21') ||
                        $(this).parent().hasClass('size11')){
                        var h1Height = $(this).find('.title-description h1').outerHeight();

                        $(this).find('.title-description p.description').css('height', (225 - h1Height) + 'px');

                        //$(this).find('.title-description p.description').ellipsis();
                    }

                    if($(this).parent().hasClass('portrait size21')){
                        parentWidth = $(this).parent().width();

                        var img = $(this).find('.abstract-image-holder img').removeAttr('width').css('height', '280px');
                        var h1 = $(this).find('h1');
                        var p = $(this).find('p.description');
                        var thumbnailHolder = $(this).find('.abstract-image-holder');
                        thumbnailHolder.css('width', img.css('width'));

                        h1.width(parentWidth - thumbnailHolder.width() - 60);
                        p.width(parentWidth - thumbnailHolder.width() - 60);
                    }

                    if($(this).parent().hasClass('landscape size21')){
                        parentWidth = $(this).parent().width();

                        var img = $(this).find('.abstract-image-holder img').removeAttr('height').css('width', '300px');
                        var p = $(this).find('p');
                        var thumbnailHolder = $(this).find('.abstract-image-holder');

                        thumbnailHolder.css('width', img.css('width'));
                        p.width(parentWidth - thumbnailHolder.width() - 60);
                        $(this).find('.title-description').css({
                            '-webkit-column-count': '2',
                            'column-gap': '40px'
                        });
                    }

                    if($(this).parent().hasClass('landscape size12')){
                        var img = $(this).find('.abstract-image-holder img').removeAttr('height').css('width', '280px');
                    }
                });
            };

            //this goes through all the articles, and renders them.
            function render(articles, complete, loadArticles) {
                //generates HTML of an article, and then appends it to the container div
                //NOTE: the x, y, w, h arguments are all in column and row positions, and NOT in pixels. these values are multiplied by the blockSize height and width to get the CSS values needed
                function create(x, y, w, h, article) {
                    var articleHtml;
                    var thumbnail = "";
                    var image = " no-image";
                    var imageOrientation = " ";
                    var date = TimeAgo(article.dateCreated);
                    var size = "size" + w + h;

                    if(article.thumbnail != ""){
                        var imageWidth = article.imageWidth;
                        var imageHeight = article.imageHeight;
                        var src = article.thumbnail;
                        thumbnail = '<div class="abstract-image-holder"><img width="'+ imageWidth +'" height="'+ imageHeight +'" src="'+ src +'"></div>';
                        image = " has-image ";
                        imageOrientation = " " + article.thumbnailOrientation + " ";
                    }

                    //feature the first row of articles, but only on the first page
                    if( (y === 0) && (scope.page === 0) ) {
                        articleHtml = '<div class="article featured ' + size+'">\
                                        <div class="abstract-title-holder">\
                                            <span>\
                                                <h1><a href="#/article/' + article._id + '">'+ article.title +'</a></h1>\
                                            </span>\
                                        </div>\
                                        <div class="article-abstract-image">'+ thumbnail +'</div>\
                                        <p class="description">' + article.description + '</p>\
                                        <div class="article-abstract-meta">\
                                            <div class="clearfix">\
                                                <div class="time-posted"><p><i>'+ date +'</i></p></div>\
                                                <div class="article-views"><p><img src="../img/newIconPageViews.png" /> '+ article.views +'</p></div>\
                                            </div>\
                                        </div>\
                                    </div>';
                    }else{
                        articleHtml = '<div class="article' + image + imageOrientation + size +'">\
                                        <div class="article-content">\
                                            <div class="title-description clearfix">\
                                                <h1><a href="#/article/' + article._id + '">'+ article.title +'</a></h1>'+ thumbnail +'\
                                                <p class="description">' + article.description + '</p>\
                                            </div>\
                                        </div>\
                                        <div class="article-abstract-meta">\
                                            <div class="clearfix">\
                                                <div class="time-posted"><p><i>'+ date +'</i></p></div>\
                                                <div class="article-views"><p><img src="../img/newIconPageViews.png" /> ' + article.views + '</p></div>\
                                            </div>\
                                        </div>\
                                    </div>';
                    }

                    $(articleHtml)
                        .width(w * blockSize.w)
                        .height(h * blockSize.h)
                        .css({
                            left: (x * blockSize.w) + 'px',
                            top: (y * blockSize.h) + 'px'
                        })
                        .appendTo(container);

                }

                //grid rows is overwritten, which gives us a nice page style and prevents "hanging chads"
                //gridSize.rows = Math.ceil(articles.length/gridSize.columns);

                gridSize.rows = 2;

                //this creates a new reservation grid of the specified height and width
                var grid = new ReservationGrid(gridSize.columns, gridSize.rows, gridSize.maxBlockWidth, gridSize.maxBlockHeight);

                grid.clear();

                count = 0;

                container.empty();
                //exit the loop if there's no more space or no more articles to place. this ensures that all articles are placed if there's room in the grid but not enough articles, while preventing hanging chads otherwise
                do {
                    //reserves a slot in the grid. this returns an object if a spot is found, which allows us to actually create the block
                    //if there isn't any room in the grid, then rez is null. at this point, the grid is likely full, and we'll have to wait for the next page for success
                    var rez = grid.reserve(gridCombinations[articles[count].layout].w, gridCombinations[articles[count].layout].h);
                    if (rez) {
                        create(rez.x, rez.y, rez.w, rez.h, articles[count]);
                    }
                    count++;
                } while ( (rez) && (count < articles.length) );

                //lets other directives/controllers know how many articles we successfully used on this page
                if(loadArticles){
                    scope.$emit('event:nextPageStart', count - 1);
                }

                //changes the container height. this is important because otherwise our infinite scroll won't work since the container height will be 0 (everything inside it is absolutely positioned)
                container.height(gridSize.rows * blockSize.h);

                //if it's the first page, then we set stuff like the hero and the featured articles. we don't have these for every page, so doing them more than once would be pointless
                if(scope.page === 0) {
                    $('#article-container').css({'width': '100%'});

                    $('.article.featured').each(function(){
                        var offset = $(this).height() - $(this).find('.article-abstract-image').outerHeight();
                        offset -= $(this).find('.article-abstract-meta p').first().outerHeight();
                        offset -= $(this).find('.article-abstract-meta').outerHeight() + 10;
                    });
                }

                setArticleContainerWidth();

                complete();
            }

            //re-renders the layout on window resize, but because some browsers will call this event DURING a resize,
            //we only want to render the page when the number of possible columns has changed
            $(window).resize(function() {
                $('#article-container').css({'width': 'auto'});
                var newColumns = Math.floor(container.width()/blockSize.w);
                if(newColumns !== gridSize.columns)
                {
                    gridSize.columns = newColumns;
                    render(scope.articles, animationComplete);
                }

                setArticleContainerWidth();
            });

            scope.$on('event:tabletOrientationChange', function(){
                blockSize.w = $window.innerWidth / 3;
                blockSize.h = ($window.innerHeight - 30) / 2;

                render(scope.articles, animationComplete, false);
            });

            render(scope.articles, animationComplete, true);

            function setArticleContainerWidth(){
                var totalWidth = 0;

                $(".featured").each(function(){
                    totalWidth += $(this).width();
                });

                var wrapperOffset = ($(window).width() - $('#wrapper').width()) / 2;
                $('.ejs-hero .abstract-image-container').css({'width': totalWidth + 'px'});

                $('#article-container').css({'width': totalWidth});
            }
        }
    }
}]);