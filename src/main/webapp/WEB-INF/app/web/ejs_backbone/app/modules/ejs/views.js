/**
 * Created with IntelliJ IDEA.
 * User: james
 * Date: 6/11/12
 * Time: 4:37 PM
 * To change this template use File | Settings | File Templates.
 */
define([
    "app",

    // Libs
    "ejs_backbone"
],

    function(app, Backbone) {

        var Views = {};

        Views.Home = Backbone.View.extend({
            template: 'ejs/home'
        });

        Views.About = Backbone.View.extend({
            template: 'ejs/about'
        });

        Views.Contact = Backbone.View.extend({
            template: 'ejs/contact'
        });

        return Views;
    });
