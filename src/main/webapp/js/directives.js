'use strict';

var tablet = window.matchMedia( "(max-width: 1024px)" );

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

angular.module('ejs.directives').directive('nested', ['truncate', '$timeout', '$log', function (truncate, $timeout, $log) {
    return {
        scope: {
            articles: '=',
            newArticles: '='
        },
        link: function (scope, element, attrs) {
            var gridCombinations = {
                "1": {
                    "size": "size11"
                }, //1x1
                "2": {
                    "size": "size12"
                }, //1x2
                "8": {
                    "size": "size21"
                }, //2x1
                "4": {
                    "size": "size31"
                }, //3x1
                "5": {
                    "size": "size22"
                } //2x2
            };

            var articleHtml = '';

            function getNumLines(charsInLine, string){
                var lines = 1;

                var words = string.split(" ");

                while(words.join(" ").length > charsInLine){
                    var count = 0;

                    for(var i = 0; i < words.length; i++){
                        count += words[i].length + 1;

                        if(count > charsInLine){
                            lines++;

                            words = words.slice(i);

                            break;
                        }
                    }
                }

                return lines;
            }

            var renderArticles = function (articles, appending) {
                //tests to see if the browser window is ABOVE 640px
                var mq = window.matchMedia( "(min-width: 640px)" );

                if( (tablet.matches) && (mq.matches) )
                {
                    articles = tabletLayout(articles, scope);
                    element.html('');
                }

                var imageWidth = "", imageHeight = "", src = "";
                var abstractImage = "";
                var image = " ";
                var imageOrientation = " ";
                var i = 1;
                articles.forEach(function (article) {
                    if(Object.keys(article.abstractImage).length > 0){
                        imageWidth = article.abstractImage.w;
                        imageHeight = article.abstractImage.h;
                        src = article.abstractImage.src;
                        abstractImage = '<div class="abstract-image-holder"><img src="'+ src +'"></div>';
                        image = " has-image ";
                        imageOrientation = " " + article.abstractImageOrientation + " ";
                    }

                    var lines = getNumLines(40, "Cornua nisi sole orbem naturae carmen nulli postquam peragebant titan distinxit gentes origo moles");

                    if(i < 4 && !appending){
                        articleHtml += '<div class="article featured' + image + gridCombinations[article.layout].size+'">\
                                            <div class="abstract-title-holder"><h1><a href="#/article/' + article._id + '">'+ article.title +'</a></h1></div>\
                                            <div class="article-abstract-image">'+ abstractImage +'\
                                                <div class="article-abstract-title transparent"></div>\
                                            </div>\
                                            <div class="article-abstract-meta">\
                                                <p>' + article.description + '</p>\
                                                <div class="clearfix">\
                                                    <div class="time-posted"><p><i>1 hour ago</i></p></div>\
                                                    <div class="article-views"><p>10</p></div>\
                                                </div>\
                                            </div>\
                                        </div>';

                        image = " ";
                    }else{
                        articleHtml += '<div class="article' + image + imageOrientation + gridCombinations[article.layout].size +'">\
                                            <div class="article-content">\
                                                <div class="title-description clearfix">\
                                                    <h1><a href="#/article/' + article._id + '">'+ article.title +'</a></h1>'+ abstractImage +'\
                                                    <p class="description">' + article.description + '</p>\
                                                </div>\
                                            </div>\
                                        </div>';

                        abstractImage = "";
                        image = " no-image";
                        imageOrientation = " ";
                    }

                    i++;
                });

                //don't run jquery.nested if the browser size is below 640px. This prevents it from running on mobile, which would cause problems.
                if (mq.matches) {
                    // viewport width is at least 640px
                    if(!appending){
                        var nestedOptions = {
                            selector: ".article",
                            minWidth: (tablet.matches) ? 330 : 320,
                            minColumns: 2,
                            animate: true,
                            animationOptions: {
                                complete: function(){
                                    var parentWidth = 0;
                                    $('.article.featured').each(function(){
                                        var offset = $(this).height() - $(this).find('.article-abstract-image').outerHeight();
                                        offset -= $(this).find('.article-abstract-meta p').first().outerHeight();
                                        offset -= $(this).find('.article-abstract-meta .clearfix').outerHeight() + 10;

                                        $(this).find('.article-abstract-meta .clearfix').css('top', offset + 'px');

                                    });

                                    $('.article-content').each(function(index){
                                        $(this).width($(this).parent().width() - 40);
                                        $(this).height($(this).parent().height() - 40);

                                        if($(this).parent().hasClass('portrait size21')){
                                            parentWidth = $(this).parent().width();

                                            var img = $(this).find('img').removeAttr('width').css('height', '280px');
                                            var h1 = $(this).find('h1');
                                            var p = $(this).find('p');
                                            var abstractImageHolder = $(this).find('.abstract-image-holder');
                                            abstractImageHolder.css('width', img.css('width'));

                                            h1.width(parentWidth - abstractImageHolder.width() - 60);
                                            p.width(parentWidth - abstractImageHolder.width() - 60);
                                        }

                                        if($(this).parent().hasClass('landscape size21')){
                                            parentWidth = $(this).parent().width();

                                            var img = $(this).find('img').removeAttr('height').css('width', '300px');
                                            var p = $(this).find('p');
                                            var abstractImageHolder = $(this).find('.abstract-image-holder');

                                            abstractImageHolder.css('width', img.css('width'));
                                            p.width(parentWidth - abstractImageHolder.width() - 60);
                                            $(this).find('.title-description').css('-webkit-column-count', '2');
                                        }

                                        if($(this).parent().hasClass('landscape size12')){
                                            var img = $(this).find('img').removeAttr('height').css('width', '280px');
                                        }

                                        if($(this).parent().hasClass('nested-moved')){
                                            $(this).find('img').css('display', 'none');
                                            $(this).find('.title-description').removeAttr('style');
                                            $(this).find('.title-description p').css('width', '100%');
                                            $(this).find('.title-description h1').css('width', '100%');
                                        }
                                    });
                                }
                            }

                        };

                        element.append(articleHtml);
                        element.nested(nestedOptions);
                    }else{
                        element.append(articleHtml).nested('append', articleHtml);
                    }
                }else{
                    element.append(articleHtml);
                }

                articleHtml = "";
            };

            scope.$watch('articles', function (newValue, oldValue) {
                if(tablet.matches) {
                    oldValue.length = 0;
                }
                if (newValue.length > 0 && oldValue.length == 0){
                    renderArticles(scope.articles, false);
                }else if(newValue.length > 0 && oldValue.length > 0){
                    renderArticles(scope.$parent.newArticles, true);
                }
            });
        }
    };
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