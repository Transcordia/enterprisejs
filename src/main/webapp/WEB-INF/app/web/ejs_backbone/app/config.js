// Set the require.js configuration for your application.
require.config({
  // Initialize the application with the main application file
  deps: ["main"],

  paths: {
    // JavaScript folders
    libs: "../assets/js/app.web.ejs_backbone.assets.js",
    plugins: "../assets/js/plugins",

    // Libraries
    jquery: "../assets/js/app.web.ejs_backbone.assets.js/jquery",
    lodash: "../assets/js/app.web.ejs_backbone.assets.js/lodash",
    backbone: "../assets/js/app.web.ejs_backbone.assets.js/ejs_backbone"
  },

  shim: {
    backbone: {
      deps: ["lodash", "jquery"],
      exports: "Backbone"
    },

      'plugins/backbone.layoutmanager': {
          deps: ['ejs_backbone']
      }
  }
});
