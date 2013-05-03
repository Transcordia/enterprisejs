'use strict';

var tablet = Modernizr.mq( "only screen and (max-width: 1024px) and (min-width: 641px)" );
var phone = Modernizr.mq( "only screen and (max-width: 640px)" );

var template = '<div id="article-container">' +
                    '<div ng-repeat="page in pages" ng-animate="\'page\'">' +
                        '<div class="article-page" grid-page articles="page.articles" page="$index"></div>' +
                    '</div>' +
               '</div>';

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
                    onSlideComplete: function(args){
                        if(args.data.numberOfSlides == args.currentSlideNumber){
                            directiveScope.$parent.loadMoreArticles();
                        }
                    },
                    onSliderResize: function(args){
                        directiveScope.$broadcast('event:tabletOrientationChange');
                    }
                });
            }

            return function(scope, elem, attr) {
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
                        image = " has-image";
                        imageOrientation = article.thumbnailOrientation;
                    }else if(article.thumbnail == "" && i < 3 && scope.page == 0){
                        image = " no-image";
                        thumbnail = '<div class="abstract-image-holder"><img src="img/images_ejsLogo_noImage.png"></div>';
                    }

                    if(i < 3 && scope.page == 0){
                        articleHtml += '<div class="article featured' + image + '">\
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
                                                    <div class="article-views"><p><img src="img/img_pageLikes16x11.png" /> '+ article.likes +'</p></div>\
                                                    <div class="article-views"><p><img src="img/img_pageView16x11.png" /> '+ article.views +'</p></div>\
                                                </div>\
                                            </div>\
                                        </div>';
                    }else{
                        articleHtml += '<div class="article ' + imageOrientation + image + '">\
                                        <div class="article-content">\
                                            <div class="title-description clearfix">\
                                                <h1><a href="#/article/' + article._id + '">'+ article.title +'</a></h1>'+ thumbnail +'\
                                                <p class="description">' + article.description + '</p>\
                                            </div>\
                                        </div>\
                                        <div class="article-abstract-meta">\
                                            <div class="clearfix">\
                                                <div class="time-posted"><p><i>'+ date +'</i></p></div>\
                                                <div class="article-views"><p><img src="img/img_pageLikes16x11.png" /> '+ article.likes +'</p></div>\
                                                <div class="article-views"><p><img src="img/img_pageView16x11.png" /> ' + article.views + '</p></div>\
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

                        //scope.$emit('event:loadMoreArticles');
                        scope.$parent.$parent.$parent.loadMoreArticles();
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
                    }else if(article.thumbnail == "" && y === 0 && scope.page == 0){
                        image = " no-image";
                        thumbnail = '<div class="abstract-image-holder"><img src="img/images_ejsLogo_noImage.png"></div>';
                    }

                    //feature the first row of articles, but only on the first page
                    if( (y === 0) && (scope.page === 0) ) {
                        articleHtml = '<div class="article featured ' + size + image + '">\
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
                                                <div class="article-views"><p><img src="img/img_pageLikes16x11.png" /> '+ article.likes +'</p></div>\
                                                <div class="article-views"><p><img src="img/img_pageView16x11.png" /> '+ article.views +'</p></div>\
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
                                                <div class="article-views"><p><img src="img/img_pageLikes16x11.png" /> '+ article.likes +'</p></div>\
                                                <div class="article-views"><p><img src="img/img_pageView16x11.png" /> ' + article.views + '</p></div>\
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
                    if(tablet){
                        $('#article-container').css({'width': '100%'});
                    }

                    $('.article.featured').each(function(){
                        var offset = $(this).height() - $(this).find('.article-abstract-image').outerHeight();
                        offset -= $(this).find('.article-abstract-meta p').first().outerHeight();
                        offset -= $(this).find('.article-abstract-meta').outerHeight() + 10;

                        $('.article.featured .description').css('height', '69px').ellipsis();
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
                if(newColumns !== gridSize.columns && !tablet)
                {
                    gridSize.columns = newColumns;
                    render(scope.articles, animationComplete);
                }

                if(!phone){
                    setArticleContainerWidth();
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

            function setArticleContainerWidth(){
                var totalWidth = 0;

                $(".featured").each(function(){
                    totalWidth += $(this).width();
                });

                if(totalWidth > 640){
                    $('.ejs-hero .abstract-image-container').css({'width': totalWidth + 'px'});
                    $('#article-container').css({'width': totalWidth});
                    $('.navbar-inner div').first().css({'width': totalWidth});
                }
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
                scope.$apply(attr.whenScrolled);
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
 * @param [article] {object} The article/resource that is being liked
 *        [liketext] {string} Optional: The text to display when the user has not yet "liked" the article
 *        [unliketext] {string} Optional: The text used display when the user has previously "liked" the article
 * @example <like article=id liketext="LIKE ME" unliketext="DON'T LIKE ME"></like>
 */
angular.module('ejs.directives').directive('like', ['$http', '$rootScope', function($http, $rootScope){
    return {
        restrict: 'E',
        template: '<a ng-click="like()"><i class="likes"></i> {{likeText}} ({{article.likes}})</a>',
        replace: true,
        scope: {
            article: '='
        },
        link: function(scope, elm, attrs){
            var likeText = attrs.liketext || "Like This";
            var unlikeText = attrs.unliketext || "Unlike";
            scope.likeText = likeText;
            scope.alreadyLiked = true;
            scope.$watch('article', function(article) {
                if( (article !== undefined) && ($rootScope.auth.isAuthenticated) ) {
                    $http.get("api/utility/like/" + article._id).success(function(data) {
                        var result = JSON.parse(data);
                        if(result) {
                            scope.likeText = unlikeText;
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
                    $http.post("api/utility/unlike/" + scope.article._id).success(function(data) {
                        scope.likeText = likeText;
                        scope.alreadyLiked = false;
                        scope.article.likes = data.likes;
                    });
                } else {
                    $http.post("api/utility/like/" + scope.article._id).success(function(data) {
                        scope.likeText = unlikeText;
                        scope.alreadyLiked = true;
                        scope.article.likes = data.likes;
                    });
                }
            }
        }
    }
}]);

angular.module('ejs.directives').directive('resizeNav', function(){
    return{
        restrict: 'A',
        link: function(scope, elm, attrs){
            scope.$on('event:viewArticleDetail', function(){
                elm.css('width', $('.article-view-container').width()+'px');
            });
        }
    }
});

angular.module('ejs.directives').directive('gears', function(){
    return{
        restrict: 'A',
        link: function(scope, elm, attrs){
            var largeGear = $(document.createElement('img'));
            largeGear.attr('src', 'img/EJS_loadingAnimation_GearLrg_600x600.png');
            largeGear.addClass('large med-clockwise');
            largeGear.css({
                'position': 'absolute',
                'top': '100px',
                'left': '100px'
            });
            largeGear.appendTo('.loading-gears');

            var medGear = $(document.createElement('img'));
            medGear.attr('src', 'img/EJS_loadingAnimation_GearLrg_600x600.png');
            medGear.addClass('medium fast-counter-clockwise');
            medGear.css({
                'position': 'absolute',
                'top': '376px',
                'left': '86px'
            });
            medGear.appendTo('.loading-gears');
            medGear.fadeTo(0, 0.5);

            var smallGear = $(document.createElement('img'));
            smallGear.attr('src', 'img/EJS_loadingAnimation_GearLrg_600x600.png');
            smallGear.addClass('small fast-counter-clockwise');
            smallGear.css({
                'position': 'absolute',
                'top': '36px',
                'left': '100px'
            });
            smallGear.appendTo('.loading-gears');
            smallGear.fadeTo(0, 0.25);

            var largeGearTwo = $(document.createElement('img'));
            largeGearTwo.attr('src', 'img/EJS_loadingAnimation_GearLrg_600x600.png');
            largeGearTwo.addClass('large med-clockwise');
            largeGearTwo.css({
                'position': 'absolute',
                'top': '200px',
                'left': '400px'
            });
            largeGearTwo.appendTo('.loading-gears');
            largeGearTwo.fadeTo(0, 0.65);

            var smallGearTwo = $(document.createElement('img'));
            smallGearTwo.attr('src', 'img/EJS_loadingAnimation_GearLrg_600x600.png');
            smallGearTwo.addClass('small fast-counter-clockwise');
            smallGearTwo.css({
                'position': 'absolute',
                'top': '473px',
                'left': '582px'
            });
            smallGearTwo.appendTo('.loading-gears');
            smallGearTwo.fadeTo(0, 0.25);


            var largeGearThree = $(document.createElement('img'));
            largeGearThree.attr('src', 'img/EJS_loadingAnimation_GearLrg_600x600.png');
            largeGearThree.addClass('large med-clockwise');
            largeGearThree.css({
                'position': 'absolute',
                'top': '550px',
                'left': '400px'
            });
            largeGearThree.appendTo('.loading-gears');
        }
    }
});