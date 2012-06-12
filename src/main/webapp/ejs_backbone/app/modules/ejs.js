/**
 * Created with IntelliJ IDEA.
 * User: james
 * Date: 6/11/12
 * Time: 4:36 PM
 * To change this template use File | Settings | File Templates.
 */
define([
    'app',
    'backbone',
    'modules/ejs/views'
],

    function(app, Backbone, Views) {
        // Create a new module
        var Ejs = app.module();

        // Attach the Views sub-module into this module.
        Ejs.Views = Views;

        // Required, return the module for AMD compliance
        return Ejs;
    });