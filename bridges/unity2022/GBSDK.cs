using System;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using UnityEngine;

namespace GameBuster
{
    /// <summary>
    /// Unity C# bridge for GBSDK - GameBuster Core Ads SDK
    /// Provides a clean C# API for Unity developers to integrate video ads
    /// </summary>
    public static class GBSDK
    {
        #region JavaScript Interop

#if UNITY_WEBGL && !UNITY_EDITOR
        [DllImport("__Internal")]
        private static extern void GBSDKInitAuto(bool debug, string callbackObjectName, string callbackMethodName);

        [DllImport("__Internal")]
        private static extern void GBSDKInit(string configJson, string callbackObjectName, string callbackMethodName);

        [DllImport("__Internal")]
        private static extern void GBSDKShowInterstitial(string callbackObjectName, string callbackMethodName);

        [DllImport("__Internal")]
        private static extern void GBSDKShowRewarded(string callbackObjectName, string callbackMethodName);

        [DllImport("__Internal")]
        private static extern void GBSDKGameStarted();

        [DllImport("__Internal")]
        private static extern void GBSDKGameEnded();

        [DllImport("__Internal")]
        private static extern bool GBSDKCanShow(string adType);

        [DllImport("__Internal")]
        private static extern void GBSDKDestroy();
#endif

        #endregion

        #region Public API

        /// <summary>
        /// Result of an ad show operation
        /// </summary>
        [Serializable]
        public class AdResult
        {
            public bool success;
            public string reason;
            public string type;

            public AdResult(bool success, string reason = null, string type = null)
            {
                this.success = success;
                this.reason = reason;
                this.type = type;
            }
        }

        /// <summary>
        /// Configuration for GBSDK initialization
        /// </summary>
        [Serializable]
        public class Config
        {
            public string configUrl;
            public string[] allowDomains;
            public string[] interstitialTags;
            public string[] rewardedTags;
            public int cooldownSec = 90;
            public int sessionCap = 20;
            public bool debug = false;
        }

        /// <summary>
        /// Events for ad lifecycle
        /// </summary>
        public static event Action OnInitialized;
        public static event Action<AdResult> OnInterstitialResult;
        public static event Action<AdResult> OnRewardedResult;
        public static event Action OnGameStarted;
        public static event Action OnGameEnded;

        private static bool _isInitialized = false;
        private static TaskCompletionSource<bool> _initTcs;
        private static TaskCompletionSource<AdResult> _interstitialTcs;
        private static TaskCompletionSource<AdResult> _rewardedTcs;

        /// <summary>
        /// Initialize GBSDK with automatic game detection (zero configuration)
        /// </summary>
        /// <param name="debug">Enable debug logging (optional)</param>
        /// <returns>Task that completes when initialization is done</returns>
        public static async Task<bool> Initialize(bool debug = false)
        {
            if (_isInitialized)
            {
                Debug.LogWarning("GBSDK is already initialized");
                return true;
            }

#if UNITY_WEBGL && !UNITY_EDITOR
            try
            {
                _initTcs = new TaskCompletionSource<bool>();

                // Use auto-initialization (no config needed)
                GBSDKInitAuto(debug, "GBSDKBridge", "OnInitComplete");

                bool result = await _initTcs.Task;
                _isInitialized = result;

                if (result)
                {
                    Debug.Log("GBSDK initialized successfully with auto-detection");
                    OnInitialized?.Invoke();
                }
                else
                {
                    Debug.LogError("GBSDK auto-initialization failed");
                }

                return result;
            }
            catch (System.Exception e)
            {
                Debug.LogError($"GBSDK auto-initialization error: {e.Message}");
                return false;
            }
#else
            // Simulate initialization in editor
            Debug.Log("GBSDK: Simulating auto-initialization in editor");
            await Task.Delay(500);
            _isInitialized = true;
            OnInitialized?.Invoke();
            return true;
#endif
        }

        /// <summary>
        /// Initialize GBSDK with custom configuration (advanced usage)
        /// </summary>
        /// <param name="configUrl">Remote configuration URL</param>
        /// <param name="debug">Enable debug logging</param>
        /// <returns>Task that completes when initialization is done</returns>
        public static async Task<bool> Initialize(string configUrl, bool debug = false)
        {
            var config = new Config
            {
                configUrl = configUrl,
                debug = debug
            };
            return await Initialize(config);
        }

        /// <summary>
        /// Initialize GBSDK with full configuration
        /// </summary>
        /// <param name="config">GBSDK configuration</param>
        /// <returns>Task that completes when initialization is done</returns>
        public static async Task<bool> Initialize(Config config)
        {
            if (_isInitialized)
            {
                Debug.LogWarning("GBSDK is already initialized");
                return true;
            }

#if UNITY_WEBGL && !UNITY_EDITOR
            try
            {
                _initTcs = new TaskCompletionSource<bool>();

                string configJson = JsonUtility.ToJson(config);
                GBSDKInit(configJson, "GBSDKBridge", "OnInitComplete");

                bool result = await _initTcs.Task;
                _isInitialized = result;

                if (result)
                {
                    OnInitialized?.Invoke();
                    Debug.Log("GBSDK initialized successfully");
                }
                else
                {
                    Debug.LogError("GBSDK initialization failed");
                }

                return result;
            }
            catch (Exception e)
            {
                Debug.LogError($"GBSDK initialization error: {e.Message}");
                return false;
            }
#else
            Debug.LogWarning("GBSDK only works in WebGL builds. Initialization skipped.");
            _isInitialized = true;
            OnInitialized?.Invoke();
            return true;
#endif
        }

        /// <summary>
        /// Show an interstitial ad
        /// </summary>
        /// <returns>Task with ad result</returns>
        public static async Task<AdResult> ShowInterstitial()
        {
            if (!_isInitialized)
            {
                Debug.LogError("GBSDK not initialized. Call Initialize() first.");
                return new AdResult(false, "not_initialized");
            }

#if UNITY_WEBGL && !UNITY_EDITOR
            try
            {
                _interstitialTcs = new TaskCompletionSource<AdResult>();
                GBSDKShowInterstitial("GBSDKBridge", "OnInterstitialComplete");

                var result = await _interstitialTcs.Task;
                OnInterstitialResult?.Invoke(result);

                return result;
            }
            catch (Exception e)
            {
                Debug.LogError($"GBSDK interstitial error: {e.Message}");
                var errorResult = new AdResult(false, "error");
                OnInterstitialResult?.Invoke(errorResult);
                return errorResult;
            }
#else
            Debug.Log("GBSDK: Simulating interstitial ad in editor");
            await Task.Delay(1000); // Simulate ad duration
            var result = new AdResult(true, null, "interstitial");
            OnInterstitialResult?.Invoke(result);
            return result;
#endif
        }

        /// <summary>
        /// Show a rewarded ad
        /// </summary>
        /// <returns>Task with ad result (success only if user watched to completion)</returns>
        public static async Task<AdResult> ShowRewarded()
        {
            if (!_isInitialized)
            {
                Debug.LogError("GBSDK not initialized. Call Initialize() first.");
                return new AdResult(false, "not_initialized");
            }

#if UNITY_WEBGL && !UNITY_EDITOR
            try
            {
                _rewardedTcs = new TaskCompletionSource<AdResult>();
                GBSDKShowRewarded("GBSDKBridge", "OnRewardedComplete");

                var result = await _rewardedTcs.Task;
                OnRewardedResult?.Invoke(result);

                return result;
            }
            catch (Exception e)
            {
                Debug.LogError($"GBSDK rewarded error: {e.Message}");
                var errorResult = new AdResult(false, "error");
                OnRewardedResult?.Invoke(errorResult);
                return errorResult;
            }
#else
            Debug.Log("GBSDK: Simulating rewarded ad in editor");
            await Task.Delay(2000); // Simulate ad duration
            var result = new AdResult(true, null, "rewarded");
            OnRewardedResult?.Invoke(result);
            return result;
#endif
        }

        /// <summary>
        /// Track game session start
        /// </summary>
        public static void GameStarted()
        {
            if (!_isInitialized)
            {
                Debug.LogWarning("GBSDK not initialized. GameStarted() call ignored.");
                return;
            }

#if UNITY_WEBGL && !UNITY_EDITOR
            GBSDKGameStarted();
#else
            Debug.Log("GBSDK: Game started (editor simulation)");
#endif
            OnGameStarted?.Invoke();
        }

        /// <summary>
        /// Track game session end
        /// </summary>
        public static void GameEnded()
        {
            if (!_isInitialized)
            {
                Debug.LogWarning("GBSDK not initialized. GameEnded() call ignored.");
                return;
            }

#if UNITY_WEBGL && !UNITY_EDITOR
            GBSDKGameEnded();
#else
            Debug.Log("GBSDK: Game ended (editor simulation)");
#endif
            OnGameEnded?.Invoke();
        }

        /// <summary>
        /// Check if an ad can be shown (respects cooldown and session caps)
        /// </summary>
        /// <param name="adType">"interstitial" or "rewarded"</param>
        /// <returns>True if ad can be shown</returns>
        public static bool CanShow(string adType)
        {
            if (!_isInitialized)
            {
                return false;
            }

#if UNITY_WEBGL && !UNITY_EDITOR
            return GBSDKCanShow(adType);
#else
            return true; // Always return true in editor
#endif
        }

        /// <summary>
        /// Clean up GBSDK resources
        /// </summary>
        public static void Destroy()
        {
            if (!_isInitialized)
            {
                return;
            }

#if UNITY_WEBGL && !UNITY_EDITOR
            GBSDKDestroy();
#endif
            _isInitialized = false;
            Debug.Log("GBSDK destroyed");
        }

        #endregion

        #region JavaScript Callbacks

        /// <summary>
        /// Internal callback handler - do not call directly
        /// </summary>
        public static void OnInitComplete(string result)
        {
            bool success = result == "success";
            _initTcs?.SetResult(success);
        }

        /// <summary>
        /// Internal callback handler - do not call directly
        /// </summary>
        public static void OnInterstitialComplete(string resultJson)
        {
            try
            {
                var result = JsonUtility.FromJson<AdResult>(resultJson);
                _interstitialTcs?.SetResult(result);
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to parse interstitial result: {e.Message}");
                _interstitialTcs?.SetResult(new AdResult(false, "parse_error"));
            }
        }

        /// <summary>
        /// Internal callback handler - do not call directly
        /// </summary>
        public static void OnRewardedComplete(string resultJson)
        {
            try
            {
                var result = JsonUtility.FromJson<AdResult>(resultJson);
                _rewardedTcs?.SetResult(result);
            }
            catch (Exception e)
            {
                Debug.LogError($"Failed to parse rewarded result: {e.Message}");
                _rewardedTcs?.SetResult(new AdResult(false, "parse_error"));
            }
        }

        #endregion
    }

    /// <summary>
    /// MonoBehaviour bridge for handling JavaScript callbacks
    /// Add this to a GameObject in your scene
    /// </summary>
    public class GBSDKBridge : MonoBehaviour
    {
        private static GBSDKBridge _instance;

        void Awake()
        {
            if (_instance == null)
            {
                _instance = this;
                DontDestroyOnLoad(gameObject);
                gameObject.name = "GBSDKBridge";
            }
            else
            {
                Destroy(gameObject);
            }
        }

        // JavaScript callback methods
        public void OnInitComplete(string result) => GBSDK.OnInitComplete(result);
        public void OnInterstitialComplete(string result) => GBSDK.OnInterstitialComplete(result);
        public void OnRewardedComplete(string result) => GBSDK.OnRewardedComplete(result);
    }
}
