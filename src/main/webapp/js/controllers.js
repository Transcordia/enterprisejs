'use strict';

/* Controllers */


function HomeCtrl($rootScope, $scope, $http, $log, $location, MockArticle) {
    $rootScope.showAddUrlModal = false;
    $scope.showAddArticleModal = false;

    $scope.articles = [
        {
            description: 'Bicycle rights keffiyeh church-key farm-to-table, wolf freegan meggings food truck +1 helvetica craft beer hella. Bicycle rights keffiyeh church-key farm-to-table, wolf freegan meggings food truck +1 helvetica craft beer hella.',
            stats: {
                likes: 29,
                comments: 30,
                reblogs: 5
            },
            convoStarter: {
                content: 'Skateboard polaroid iphone butcher flexitarian aesthetic sriracha.'
            },
            comments: [
                {
                    content: 'This is a comment'
                }
            ]

        },
        {
            description: 'Portland stumptown ethical freegan, VHS church-key selvage ugh.',
            stats: {
                likes: 29,
                comments: 30,
                reblogs: 5
            },
            convoStarter: {
                content: 'Skateboard polaroid iphone butcher flexitarian aesthetic sriracha.'
            },
            comments: [
                {
                    content: 'This is a comment'
                }
            ]

        },
        {
            description: 'Salvia food truck trust fund, synth twee american apparel photo booth freegan squid marfa aesthetic hashtag craft beer mlkshk.',
            stats: {
                likes: 29,
                comments: 30,
                reblogs: 5
            },
            convoStarter: {
                content: 'Raw denim +1 truffaut keytar, squid polaroid next level mixtape american apparel pug try-hard retro wes anderson viral. Forage next level keytar echo park actually fingerstache banh mi cray plaid, squid locavore sartorial. Chillwave art party mustache sustainable, swag put a bird on it american apparel cosby sweater. Tattooed mustache chambray messenger bag, odd future typewriter banh mi portland whatever meggings raw denim hella ethical fingerstache.'
            },
            comments: [
                {
                    content: 'This is a comment'
                }
            ]

        },
        {
            description: 'Letterpress art party put a bird on it, pop-up typewriter authentic swag polaroid flannel whatever salvia biodiesel.',
            stats: {
                likes: 29,
                comments: 30,
                reblogs: 5
            },
            convoStarter: {
                content: 'Skateboard polaroid iphone butcher flexitarian aesthetic sriracha.'
            },
            comments: [
                {
                    content: 'This is a comment'
                }
            ]

        },
        {
            description: 'Austin intelligentsia bespoke, williamsburg disrupt beard VHS before they sold out farm-to-table. +1 echo park fashion axe, four loko plaid tattooed skateboard. Vice odd future post-ironic brunch sustainable pinterest.',
            stats: {
                likes: 29,
                comments: 30,
                reblogs: 5
            },
            convoStarter: {
                content: 'Skateboard polaroid iphone butcher flexitarian aesthetic sriracha.'
            },
            comments: [
                {
                    content: 'This is a comment'
                }
            ]

        },
        {
            description: "Fingerstache next level try-hard american apparel, skateboard ennui etsy banksy meggings locavore kale chips. High life typewriter organic polaroid try-hard mustache plaid, mumblecore pop-up fingerstache pork belly. Vinyl swag pug aesthetic, pork belly cred beard kale chips four loko quinoa godard next level flannel marfa. Occupy lomo mcsweeney's mumblecore, locavore intelligentsia pork belly brooklyn banksy.",
            stats: {
                likes: 29,
                comments: 30,
                reblogs: 5
            },
            convoStarter: {
                content: 'Skateboard polaroid iphone butcher flexitarian aesthetic sriracha.'
            },
            comments: [
                {
                    content: 'This is a comment'
                }
            ]

        },
        {
            description: 'Stumptown wes anderson literally banksy, bicycle rights food truck butcher craft beer ethical. Banksy bushwick 8-bit, DIY chillwave PBR typewriter. Carles tousled wayfarers, gentrify direct trade Austin small batch scenester irony yr vice. Ugh keytar viral, umami gluten-free banjo gentrify pop-up gastropub blue bottle direct trade. Tumblr bicycle rights cliche, terry richardson sartorial beard sustainable. Ethical viral chillwave sustainable wolf biodiesel.',
            stats: {
                likes: 29,
                comments: 30,
                reblogs: 5
            },
            convoStarter: {
                content: 'Skateboard polaroid iphone butcher flexitarian aesthetic sriracha.'
            },
            comments: [
                {
                    content: 'This is a comment'
                }
            ]

        }
    ];

    $scope.urlToCheck = '';

    $scope.addArticle = function(url){
        $rootScope.showAddUrlModal = false;

        var data = {
            url: url
        };

        $http.post('api/processurl', data)
            .success(function(data, status, headers){
                $log.info(data);
                $scope.showAddArticleModal = true;
                $scope.article = data.response;
            });
    };

    $scope.saveArticle = function(article){
        $scope.showAddArticleModal = false;
        $location.path('/new-article');
    };
}
HomeCtrl.$inject = ["$rootScope","$scope", "$http", "$log", "$location"];
