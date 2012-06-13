/**
 * Created with IntelliJ IDEA.
 * User: toddbarchok
 * Date: 6/12/12
 * Time: 1:02 PM
 */
(function() {
    if (typeof window.janrain !== 'object') window.janrain = {};
    if (typeof window.janrain.settings !== 'object') window.janrain.settings = {};

    /* _______________ can edit below this line _______________ */
    janrain.settings.tokenUrl = tokenURL;
    janrain.settings.type = 'embed';
    janrain.settings.appId = 'gnnpjnagggdcadkkfgeo';
    janrain.settings.appUrl = 'https://pykl-studios.rpxnow.com';
    janrain.settings.providers = ["facebook","google","twitter","linkedin"];
    janrain.settings.providersPerPage = '4';
    janrain.settings.format = 'two column';
    janrain.settings.actionText = ' ';
    janrain.settings.showAttribution = true;
    janrain.settings.fontColor = '#666666';
    janrain.settings.fontFamily = 'lucida grande, Helvetica, Verdana, sans-serif';
    janrain.settings.backgroundColor = '#ffffff';
    janrain.settings.width = '420';
    janrain.settings.borderColor = '#C0C0C0';
    janrain.settings.borderRadius = '5';    janrain.settings.buttonBorderColor = '#CCCCCC';
    janrain.settings.buttonBorderRadius = '5';
    janrain.settings.buttonBackgroundStyle = 'gradient';
    janrain.settings.language = 'en';
    janrain.settings.linkClass = 'janrainEngage';

    /* _______________ can edit above this line _______________ */

    function isReady() { janrain.ready = true; };
    if (document.addEventListener) {
        document.addEventListener("DOMContentLoaded", isReady, false);
    } else {
        window.attachEvent('onload', isReady);
    }

    var e = document.createElement('script');
    e.type = 'text/javascript';
    e.id = 'janrainAuthWidget';

    if (document.location.protocol === 'https:') {
        e.src = 'https://rpxnow.com/js/lib/pykl-studios/engage.js';
    } else {
        e.src = 'http://widget-cdn.rpxnow.com/js/lib/pykl-studios/engage.js';
    }

    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(e, s);
})();