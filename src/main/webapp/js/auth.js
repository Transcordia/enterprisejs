var pykl = window.pykl || {};

(function (window, angular, undefined) {

    'use strict';

    var EVENT_INTERNAL_SIGNIN_CONFIRMED = 'event:int-signinConfirmed';
    var EVENT_INTERNAL_SIGNIN_FAILED = 'event:int-signinFailed';
    var EVENT_INTERNAL_SIGNOUT_CONFIRMED = 'event:int-signoutConfirmed';
    var EVENT_SIGNIN_REQUIRED = 'event:signinRequired';
    var EVENT_SIGNIN_REQUEST = 'event:signinRequest';
    var EVENT_SIGNIN_CONFIRMED = 'event:signinConfirmed';
    var EVENT_SIGNIN_FAILED = 'event:signinFailed';
    var EVENT_SIGNOUT_REQUEST = 'event:signoutRequest';
    var EVENT_SIGNOUT_CONFIRMED = 'event:signoutConfirmed';

    var pyklSecurity = angular.module('pykl.security', []);

    /**
     * @ngdoc object
     * @name pykl.$auth
     * @requires $http
     *
     * @description
     * A factory which creates an authentication object that lets you interact with a server-side
     * authentication mechanism.
     *
     * @returns {Object} An object that has properties and functions to provide insight into the
     * current user's authentication status and authorization roles.
     *
     * @example
     *
     * # Binding in Angular scope
     *
     * The
     */
    pyklSecurity.factory('$auth', ['$rootScope', '$http', '$timeout', '$log', function ($rootScope, $http, $timeout, $log) {
        var roles = [];

        function initAuth() {
            roles = [];
            $rootScope.auth = {
                isAuthenticated:false,
                id:0
            };
        }

        initAuth();
        function getAuth() {
            var random = 17 * Math.random() * Math.random();
            return $.ajax('api/auth?random=' + random)
                .done(function (data, status) {
                    $rootScope.auth.principal = data.principal;
                    $rootScope.auth.isAuthenticated =
                        (data && (data.username != null) && (data.username != 'anonymousUser'));
                    roles = data.roles;
                    $rootScope.auth.id = data.principal.id;
                    $rootScope.auth.username = data.principal.username;
                    $log.info('Received successful auth response:', data);
                    $rootScope.$apply();
                    $timeout(getAuth, 300000);
                })
                .fail(function (data, status) {
                    initAuth();
                    $log.warn('Failed to retrieve auth object:', status, data);
                });
        }

        var isUserInRole = $rootScope.auth.isUserInRole = function (role) {
            var checkRole = role.toLowerCase();
            for (var i = 0, c = roles.length; i < c; i++) {
                if (roles[i].localeCompare(checkRole) === 0) return true;
            }
            return false;
        };

        $rootScope.auth.isUser = function(id) {
            return ($rootScope.auth.id === id);
        };

        $rootScope.$on(EVENT_INTERNAL_SIGNIN_CONFIRMED, function () {
            getAuth();
        });
        $rootScope.$on(EVENT_INTERNAL_SIGNOUT_CONFIRMED, function () {
            getAuth();
        });

        getAuth();

        // Return the service object for direct invocations
        var result = {
            isUserInRole: isUserInRole,
            event:{
                signinRequired:EVENT_SIGNIN_REQUIRED,
                signinRequest:EVENT_SIGNIN_REQUEST,
                signinConfirmed:EVENT_SIGNIN_CONFIRMED,
                signinFailed:EVENT_SIGNIN_FAILED,
                signoutRequest:EVENT_SIGNOUT_REQUEST,
                signoutConfirmed:EVENT_SIGNOUT_CONFIRMED
            }
        };

        //IE8 doesn't support Object.defineProperty()
        try {
            Object.defineProperty(result, 'isAuthenticated', {
                get:function () {
                    return $rootScope.auth.isAuthenticated;
                }
            });
            Object.defineProperty(result, 'principal', {
                get:function () {
                    return $rootScope.auth.username;
                }
            });
            Object.defineProperty(result, 'id', {
                get:function () {
                    return $rootScope.auth.id;
                }
            });
        } catch(e) {
            result.isAuthenticated = function () {
                return $rootScope.auth.isAuthenticated;
            };
            result.principal = function () {
                return $rootScope.auth.username;
            };
            result.id = function () {
                return $rootScope.auth.id;
            };
        }

        return result;
    }]);


    function LoginCtrl($rootScope, $scope, $auth, $log) {
    }

    LoginCtrl.$inject = ['$rootScope', '$scope', '$auth', '$log'];
    window.pykl.LoginCtrl = LoginCtrl;

})(window, window.angular);

