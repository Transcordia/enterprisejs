'use strict';

var tablet = Modernizr.mq( "only screen and (max-width: 1024px) and (min-width: 641px)" );
var phone = Modernizr.mq( "only screen and (max-width: 640px)" );

var template = '<div id="article-container"><div ng-repeat="page in pages"><div class="article-page" grid-page articles="page.articles" page="$index"></div></div></div>';

if(tablet){
    template = '<div id="article-container">' +
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
}

function is_touch_device() {
    return !!('ontouchstart' in window) // works on most browsers
        || !!('onmsgesturechange' in window); // works on ie10
}

/* Directives */
angular.module('ejs.directives', []);

//note: the paging for the articles needs to ONLY handle ~6 articles at a time. this will likely change how the article paging works on the tablet, as we're just going to grab the "next" 6 articles and display them
//other note: the next 6 might not actually be 6, as we'll need to sort out which ones were displayed on the current page and change things around a bit
//this could result in some changes in how paging works when it comes to tablet
function tabletLayout(articles, scope)
{
    /* we know there's a finite set of full layouts for tablet
       so we establish a list of this set
       then we get the top 6 articles
       go through them and find out what each preferred layout is
       then we (randomly?) pick a possible full layout, and see if we can get all 6 articles in there (or really, we find out how many we can get)
       we do this until we find one which fits all 6 articles, or fits the highest number
       if needed, we change the remaining unfit articles to layouts that WILL work in the full layout, because that's how we roll
       :dealwithit:
    */
    //we are ignoring any variant that has 2x2 and 3x2 because the layout list in the directive (gridCombinations) doesn't include those yet.
    var variants = [
        [1,1,1,1,1,1],
        [1,1,1,1,8],
        [1,1,8,8],
        [1,1,8,2],
        [2,2,1,1],
        [4,1,1,1],
        [2,8,8],
        [4,8,1],
        [4,4]
    ];
    //we already have the list of articles
    var numericLayoutList = [];
    var indexStoredLayoutList = [];
    var i = 0;
    for(; i < articles.length; i++)
    {
        numericLayoutList.push(parseInt(articles[i].layout));
        indexStoredLayoutList.push({ "id": i, "_id": articles[i]._id, "layout": articles[i].layout, "shown": false });
    }

    //so we loop through and find which ones have the "best" matches
    //it might be best to count how many out of the variant DONT match
    //as this will give us the amount of articles we would need to change
    //any variant with a 0 result is instant success
    //otherwise, we take the lowest result found
    function countFailedMatches(variant) {
        //we're mutating layout, so we need a proper copy of the list of layouts so we don't mess it up
        var layout = numericLayoutList.slice(0);

        for(var i = 0; i < variant.length; i++)
        {
            var index = layout.indexOf(variant[i]);
            if(index != -1)
            {
                layout.splice(index, 1);
            }
        }
        return layout.length;
    }

    var bestChoice = -1;
    var bestResult = numericLayoutList.length;
    for(i = 0; i < variants.length; i++)
    {
        var result = countFailedMatches(variants[i]);

        if(result < bestResult)
        {
            bestResult = result;
            bestChoice = i;
        }
        //break early if we find a perfect match
        if(result === 0)
        {
            i = variants.length;
        }
    }
    //console.log("found best choice of: "+bestChoice+" resulting layout collection will be: ",variants[bestChoice]);

    //found the best full layout variant to use, so we'll now format the articles as required by the layout. this will be similar to the countFailedMatches
    //except this time we need to get rid of values from both variants (in any order) and layouts (in the first order)
    //this will leave us with the resulting matches where the layout needs changing
    //and then we'll go through and make those changes
    //copy the arrays
    var layout = numericLayoutList.slice(0);
    var variant = variants[bestChoice].slice(0);

    for(i = 0; i < variants[bestChoice].length; i++)
    {
        var index = layout.indexOf(variants[bestChoice][i]);
        if(index != -1)
        {
            layout.splice(index, 1);
            indexStoredLayoutList.splice(index, 1);
            variant.splice(variant.indexOf(variants[bestChoice][i]), 1);
        }
    }

    //now we have a filtered variant and article layout list.
    //we simply loop through the articles and set their layouts to the "required" ones
    //thus earning our desired design

    for(i = 0; i < variant.length; i++)
    {
        var articleIndex = indexStoredLayoutList[i].id;
        articles[articleIndex].layout = variant[i].toString();
        indexStoredLayoutList[i].shown = true;
    }

    //the last part of this is that we need to tell the paging stuff that THESE articles are the ones being used, and THOSE are the ones that are left over
    //then we need a way to handle the leftovers.
    //likely this means pulling in the next "set" of articles so that we, once again, have 6 articles
    //this is going to require an alternate take on the paging system as i don't know if it can really handle this set up
    indexStoredLayoutList = indexStoredLayoutList.filter(function(element) {
        return !element.shown;
    });

    var extras = [];

    articles = articles.filter(function(element, index) {
        for(i = 0; i < indexStoredLayoutList.length; i++)
        {
            if(indexStoredLayoutList[i]._id === element._id)
            {
                extras.push(element);
                return false;
            }
        }
        return true;
    });

    scope.$emit('extraArticles', extras);

    return articles;
}

//this keeps track of our article pages, by dividing them up into an array of objects, each of which simply contains a property "articles"
//it's worth pointing out that the article array gets split based on the index of the last article shown, and not loaded.
//because of this, there's probably going to have to be some changes in how the paging system on the backend works once zocia is implemented.
angular.module('ejs.directives').directive('grid', ["$log", function($log){
    return {
        restrict: 'A',
        scope: {
            articles: '=',
            pageSize: '='
        },
        template: template,
        replace: true,
        compile: function(element, attrs){
            var directiveScope;

            if(tablet){
                $('.iosSlider').iosSlider({
                    snapToChildren: true,
                    desktopClickDrag: true,
                    onSlideComplete: slideComplete,
                    onSliderResize: sliderResize
                });
            }

            function slideComplete(args){
                if(args.data.numberOfSlides == args.currentSlideNumber){
                    directiveScope.$emit('event:loadMoreArticles');
                }
            }

            function sliderResize(args){
                directiveScope.$broadcast('event:tabletOrientationChange');
            }

            return function(scope, elem, attr) {
                directiveScope = scope;

                scope.pages = [];
                var from = 0;

                //we watch the article scope property because the array is loaded in with AJAX, and we can't do any rendering until it's loaded from the server
                //because of this, we want to make sure array of articles is at least 0 before rendering, otherwise there's nothing to render and we'd get an error message
                scope.$watch('articles', function (newValue, oldValue) {
                    if(newValue.length > 0){
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
angular.module('ejs.directives').directive('gridPage', ['truncate', '$timeout', '$log', 'TimeAgo', '$window', function (truncate, $timeout, $log, TimeAgo, $window) {
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
            if(tablet){
                blockSize.w = $window.innerWidth / 3;
                blockSize.h = ($window.innerHeight - 30) / 2;
            }

            //these are the various properties that are passed into the grid object upon creation. Change these values when doing stuff like paging to dynamically resize the grid
            //max block width/height are for the maximum possible size of any single abstract in the grid
            var gridSize = {
                "columns": Math.floor(container.width()/blockSize.w),
                "rows": 6,
                "maxBlockWidth": 3,
                "maxBlockHeight": 2
            };

            if(tablet){
                gridSize.maxBlockWidth = 2;
            }

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

                        $(this).find('.title-description p.description').ellipsis();
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

                    //if(!phone){
                        //$('.abstract-title-holder span h1').ellipsis();
                    //}
                });

                if(tablet){
                    $('.iosSlider').iosSlider('update');
                }
            };

            function renderForPhones(articles, complete){
                var articleHtml;
                var thumbnail = "";
                var image = " no-image";
                var imageOrientation = " ";

                for(var i = 0; i < articles.length; i++){
                    var article = articles[i];
                    var date = TimeAgo(article.dateCreated);

                    if(article.thumbnail != ""){
                        var imageWidth = article.imageWidth;
                        var imageHeight = article.imageHeight;
                        var src = article.thumbnail;
                        thumbnail = '<div class="abstract-image-holder"><img width="'+ imageWidth +'" height="'+ imageHeight +'" src="'+ src +'"></div>';
                        image = " has-image ";
                        imageOrientation = article.thumbnailOrientation;
                    }

                    if(i < 3 && scope.page == 0){
                        articleHtml += '<div class="article featured">\
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
                                                    <div class="article-views"><p><img src="img/newIconPageViews.png" /> '+ article.views +'</p></div>\
                                                </div>\
                                            </div>\
                                        </div>';
                    }else{
                        articleHtml += '<div class="article' + image + imageOrientation +'">\
                                        <div class="article-content">\
                                            <div class="title-description clearfix">\
                                                <h1><a href="#/article/' + article._id + '">'+ article.title +'</a></h1>'+ thumbnail +'\
                                                <p class="description">' + article.description + '</p>\
                                            </div>\
                                        </div>\
                                        <div class="article-abstract-meta">\
                                            <div class="clearfix">\
                                                <div class="time-posted"><p><i>'+ date +'</i></p></div>\
                                                <div class="article-views"><p><img src="img/newIconPageViews.png" /> ' + article.views + '</p></div>\
                                            </div>\
                                        </div>\
                                    </div>';

                    }

                    image = " no-image";
                    imageOrientation = " "
                }

                scope.$emit('event:nextPageStart', 20);

                $(articleHtml).appendTo(container);

                $('#article-container').infiniteScroll({
                    threshold: 60,
                    onBottom: function(){
                        if($('.gears').length == 0){
                            var div = $(document.createElement('div'));
                            div.attr({
                                'class': 'gears'
                            }).css({
                                    'height': '70px',
                                    'width': '140px',
                                    'position': 'absolute',
                                    'left': '50%',
                                    'margin-left': '-70px',
                                    'overflow': 'hidden'
                                });

                            var bigGear = $(document.createElement('img'));
                            var smallGear = $(document.createElement('img'));

                            bigGear.attr({
                                'src': 'img/EJS_loadingAnimation_GearLrg.png',
                                'class': 'small-gear'
                            }).css({
                                    'position': 'absolute'
                                });

                            smallGear.attr({
                                'src': 'img/EJS_loadingAnimation_GearSml.png',
                                'class': 'big-gear'
                            }).css({
                                    'position': 'absolute'
                                });

                            bigGear.appendTo(div);
                            smallGear.appendTo(div);
                            div.appendTo('#article-container');
                        }

                        scope.$emit('event:loadMoreArticles');
                    }
                });

                complete();

                $('.has-image .article-content').css({
                    'width': 'auto',
                    'height': '185px'
                });

                $('.no-image .article-content').css({
                    'width': 'auto',
                    'height': '110px'
                });

            }

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
                                                <div class="article-views"><p><img src="img/newIconPageViews.png" /> '+ article.views +'</p></div>\
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
                                                <div class="article-views"><p><img src="img/newIconPageViews.png" /> ' + article.views + '</p></div>\
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
                gridSize.rows = Math.ceil(articles.length/gridSize.columns);

                if(tablet){
                    gridSize.rows = 2;
                }

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
                    var totalWidth = 0;

                    $(".featured").each(function(){
                        totalWidth += $(this).width();
                    });

                    if(tablet){
                        $('#article-container').css({'width': '100%'});
                    }

                    var wrapperOffset = ($(window).width() - $('#wrapper').width()) / 2;
                    $('.ejs-hero .abstract-image-container').css({'width': totalWidth + 'px', 'margin': '0 0 0 ' + wrapperOffset + 'px'});

                    $('.article.featured').each(function(){
                        var offset = $(this).height() - $(this).find('.article-abstract-image').outerHeight();
                        offset -= $(this).find('.article-abstract-meta p').first().outerHeight();
                        offset -= $(this).find('.article-abstract-meta').outerHeight() + 10;

                        //$(this).find('.description').css('height', '69px').ellipsis();
                    });
                }

                complete();
            }

            //re-renders the layout on window resize, but because some browsers will call this event DURING a resize,
            //we only want to render the page when the number of possible columns has changed
            $(window).resize(function() {
                var newColumns = Math.floor(container.width()/blockSize.w);
                if(newColumns !== gridSize.columns && !tablet)
                {
                    gridSize.columns = newColumns;
                    render(scope.articles, animationComplete);
                }
            });

            scope.$on('event:tabletOrientationChange', function(){
                blockSize.w = $window.innerWidth / 3;
                blockSize.h = ($window.innerHeight - 30) / 2;

                render(scope.articles, animationComplete, false);
            });

            if(!phone){
                render(scope.articles, animationComplete, true);
            }else{
                renderForPhones(scope.articles, animationComplete);
            }
        }
    }
}]);

/**
 * Loads an image, passing in the height and width to the provided scope, and emits an event that can be listened for
 * The sibling or parent scope can then decide what to do with that image, based on the size (since we don't know what size the image is until it's loaded)
 * In the EnterpriceJS project, this is used to filter out images that are deemed "too small"
 */
angular.module('ejs.directives').directive('checkSize', function(){
    return {
        restrict: 'A',
        link: function(scope, elem, attr) {
            elem.on('load', function() {
                scope.image.w = elem[0].naturalWidth;
                scope.image.h = elem[0].naturalHeight;
                scope.$emit('Event:ImageLoaded');
            });
        }
    };
});

/**
 * Runs a function when the user reaches the bottom of the page. The individual function that is run is passed in as an argument.
 *
 * @param [options] {function} This should be a function that is passed into the directive. The function would then load more objects and add them to the list
 * @example <div when-scrolled="loadMore()" offset="90">
 */
angular.module('ejs.directives').directive('whenScrolled', function() {
    return function(scope, elm, attr) {
        var raw = elm[0];
        var offset = attr.offset || 0;

        angular.element(window).bind('scroll', function() {
            var rectObject = raw.getBoundingClientRect();
            //the number being subtracted from window.height() is the static height of any footers or other elements that are on all the pages.
            //offset is passed in as an option and is the height of any padding or margins that might occur as part of the element this directive is used on
            //
            //WARNING: if there's any changes in that collection of elements (mostly in terms of changing the CSS), these numbers needs to be changed. this also prevents use of 'ems' as they don't translate consistently to pixel values
            //there might be a way to handle this without using static numbers. if so, please do, as this current solution isn't as flexible and reusable as it could be
            if (Math.floor(rectObject.bottom) === $(window).height() - 0 - offset) {
                //scope.$apply(attr.whenScrolled);
                scope.$emit('event:loadMoreArticles');
            }
            //console.log("compare: "+(Math.floor(rectObject.bottom) + " = " + ($(window).height() - 0 - offset)));  //if there's any problems with this whenScrolled method, uncomment this to debug
        });
    };
});

/**
 * Reloads the twitter buttons. Without this, twitter buttons show up as unstyled "Tweet" links, which are boring and ugly.
 *
 * @example <div class="article-tweet-button" reload-twitter-btns>
 <a href="https://twitter.com/share" class="twitter-share-button" data-lang="en">Tweet</a>
 </div>
 */
angular.module('ejs.directives').directive('reloadTwitterBtns', function(){
    return {
        compile: function compile() {
            return {
                post: function(){
                    if(twttr !== undefined) {
                        twttr.widgets.load();
                    }
                }
            }
        }
    }
});

/**
 * Used for liking, and unliking and object
 * This directive assumes the existence of a $rootScope.auth property, which comes from auth.js in the BabsonGC project.
 * The backend code for liking/unliking objects in zocia requires 2 id values, one for the object that is BEING liked, and one for the object DOING the liking
 * Thus at the very least, there needs to be some sort of way to get the zocia/database ID of the user.
 *
 * @param [id] {string} The ID of the object to be liked
 * @example <like id="{{id}}"></like>
 */
angular.module('ejs.directives').directive('like', ['$http', '$rootScope', function($http, $rootScope){
    return {
        restrict: 'E',
        template: '<a ng-click="like()"><i class="likes"></i> {{likeText}}</a>',
        replace: true,
        link: function(scope, elm, attrs){
            scope.likeText = "Like This";
            scope.alreadyLiked = true;
            /*
            attrs.$observe('objectid', function(object_id) {
                if( (object_id !== '') && ($rootScope.auth.isAuthenticated) ) {
                    $http.get("api/utility/like/" + object_id).success(function(data) {
                        var result = JSON.parse(data);
                        if(result) {
                            scope.likeText = "Unlike";
                        }
                        scope.alreadyLiked = result;
                    });
                }
            });

            scope.like = function() {
                if(!$rootScope.auth.isAuthenticated) {
                    return;
                }
                if(scope.alreadyLiked) {
                    $http.post("api/utility/unlike/" + attrs.objectid).success(function(data) {
                        scope.likeText = "Like This";
                        scope.alreadyLiked = false;
                        if(scope.increaseLikes !== undefined) {
                            scope.increaseLikes(data.likes);
                        }
                    });
                } else {
                    $http.post("api/utility/like/" + attrs.objectid).success(function(data) {
                        scope.likeText = "Unlike";
                        scope.alreadyLiked = true;
                        if(scope.increaseLikes !== undefined) {
                            scope.increaseLikes(data.likes);
                        }
                    });
                }
            }  */
        }
    }
}]);