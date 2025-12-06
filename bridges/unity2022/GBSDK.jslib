/**
 * Unity WebGL JavaScript Plugin for GBSDK
 * This file should be placed in Assets/Plugins/WebGL/ folder in your Unity project
 */

var GBSDKPlugin = {
    // Global variables
    gbsdk: null,
    isInitialized: false,

    // Initialize GBSDK with auto-detection (zero configuration)
    GBSDKInitAuto: function(debug, callbackObjectPtr, callbackMethodPtr) {
        var debugMode = debug === 1;
        var callbackObject = UTF8ToString(callbackObjectPtr);
        var callbackMethod = UTF8ToString(callbackMethodPtr);

        console.log('GBSDK Unity Plugin: Auto-initializing with debug =', debugMode);

        try {
            // Create GBSDK instance
            if (typeof GBSDK === 'undefined' || typeof GBSDK.GBSDK === 'undefined') {
                console.error('GBSDK not found. Make sure to include the GBSDK script in your HTML.');
                SendMessage(callbackObject, callbackMethod, 'error');
                return;
            }

            GBSDKPlugin.gbsdk = new GBSDK.GBSDK();

            // Use auto-initialization (no config needed)
            var autoConfig = debugMode ? { debug: true } : {};

            GBSDKPlugin.gbsdk.init(autoConfig).then(function() {
                GBSDKPlugin.isInitialized = true;
                console.log('GBSDK auto-initialized successfully');
                SendMessage(callbackObject, callbackMethod, 'success');
            }).catch(function(error) {
                console.error('GBSDK auto-initialization failed:', error);
                SendMessage(callbackObject, callbackMethod, 'error');
            });

        } catch (error) {
            console.error('GBSDK auto-init error:', error);
            SendMessage(callbackObject, callbackMethod, 'error');
        }
    },

    // Initialize GBSDK with custom configuration (advanced usage)
    GBSDKInit: function(configJsonPtr, callbackObjectPtr, callbackMethodPtr) {
        var configJson = UTF8ToString(configJsonPtr);
        var callbackObject = UTF8ToString(callbackObjectPtr);
        var callbackMethod = UTF8ToString(callbackMethodPtr);

        try {
            // Parse configuration
            var config = JSON.parse(configJson);

            // Create GBSDK instance
            if (typeof GBSDK === 'undefined' || typeof GBSDK.GBSDK === 'undefined') {
                console.error('GBSDK not found. Make sure to include the GBSDK script in your HTML.');
                SendMessage(callbackObject, callbackMethod, 'error');
                return;
            }

            GBSDKPlugin.gbsdk = new GBSDK.GBSDK();

            // Initialize with custom config
            GBSDKPlugin.gbsdk.init(config).then(function() {
                GBSDKPlugin.isInitialized = true;
                console.log('GBSDK initialized successfully with custom config');
                SendMessage(callbackObject, callbackMethod, 'success');
            }).catch(function(error) {
                console.error('GBSDK initialization failed:', error);
                SendMessage(callbackObject, callbackMethod, 'error');
            });

        } catch (error) {
            console.error('GBSDK init error:', error);
            SendMessage(callbackObject, callbackMethod, 'error');
        }
    },

    // Show interstitial ad
    GBSDKShowInterstitial: function(callbackObjectPtr, callbackMethodPtr) {
        var callbackObject = UTF8ToString(callbackObjectPtr);
        var callbackMethod = UTF8ToString(callbackMethodPtr);

        if (!GBSDKPlugin.isInitialized || !GBSDKPlugin.gbsdk) {
            console.error('GBSDK not initialized');
            var errorResult = JSON.stringify({success: false, reason: 'not_initialized'});
            SendMessage(callbackObject, callbackMethod, errorResult);
            return;
        }

        try {
            GBSDKPlugin.gbsdk.showInterstitial().then(function(result) {
                var resultJson = JSON.stringify(result);
                SendMessage(callbackObject, callbackMethod, resultJson);
            }).catch(function(error) {
                console.error('Interstitial ad error:', error);
                var errorResult = JSON.stringify({success: false, reason: 'error'});
                SendMessage(callbackObject, callbackMethod, errorResult);
            });
        } catch (error) {
            console.error('Interstitial ad error:', error);
            var errorResult = JSON.stringify({success: false, reason: 'error'});
            SendMessage(callbackObject, callbackMethod, errorResult);
        }
    },

    // Show rewarded ad
    GBSDKShowRewarded: function(callbackObjectPtr, callbackMethodPtr) {
        var callbackObject = UTF8ToString(callbackObjectPtr);
        var callbackMethod = UTF8ToString(callbackMethodPtr);

        if (!GBSDKPlugin.isInitialized || !GBSDKPlugin.gbsdk) {
            console.error('GBSDK not initialized');
            var errorResult = JSON.stringify({success: false, reason: 'not_initialized'});
            SendMessage(callbackObject, callbackMethod, errorResult);
            return;
        }

        try {
            GBSDKPlugin.gbsdk.showRewarded().then(function(result) {
                var resultJson = JSON.stringify(result);
                SendMessage(callbackObject, callbackMethod, resultJson);
            }).catch(function(error) {
                console.error('Rewarded ad error:', error);
                var errorResult = JSON.stringify({success: false, reason: 'error'});
                SendMessage(callbackObject, callbackMethod, errorResult);
            });
        } catch (error) {
            console.error('Rewarded ad error:', error);
            var errorResult = JSON.stringify({success: false, reason: 'error'});
            SendMessage(callbackObject, callbackMethod, errorResult);
        }
    },

    // Track game started
    GBSDKGameStarted: function() {
        if (!GBSDKPlugin.isInitialized || !GBSDKPlugin.gbsdk) {
            console.warn('GBSDK not initialized, gameStarted() ignored');
            return;
        }

        try {
            GBSDKPlugin.gbsdk.gameStarted();
        } catch (error) {
            console.error('Game started error:', error);
        }
    },

    // Track game ended
    GBSDKGameEnded: function() {
        if (!GBSDKPlugin.isInitialized || !GBSDKPlugin.gbsdk) {
            console.warn('GBSDK not initialized, gameEnded() ignored');
            return;
        }

        try {
            GBSDKPlugin.gbsdk.gameEnded();
        } catch (error) {
            console.error('Game ended error:', error);
        }
    },

    // Check if ad can be shown
    GBSDKCanShow: function(adTypePtr) {
        var adType = UTF8ToString(adTypePtr);

        if (!GBSDKPlugin.isInitialized || !GBSDKPlugin.gbsdk) {
            return false;
        }

        try {
            return GBSDKPlugin.gbsdk.canShow(adType);
        } catch (error) {
            console.error('CanShow error:', error);
            return false;
        }
    },

    // Destroy GBSDK
    GBSDKDestroy: function() {
        if (!GBSDKPlugin.isInitialized || !GBSDKPlugin.gbsdk) {
            return;
        }

        try {
            GBSDKPlugin.gbsdk.destroy();
            GBSDKPlugin.gbsdk = null;
            GBSDKPlugin.isInitialized = false;
        } catch (error) {
            console.error('Destroy error:', error);
        }
    }
};

// Register the plugin
mergeInto(LibraryManager.library, GBSDKPlugin);
