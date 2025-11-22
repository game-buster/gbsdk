using System;
using UnityEngine;
using UnityEngine.UI;
using GameBuster;

namespace GameBuster.Examples
{
    /// <summary>
    /// Example AdManager showing how to integrate GBSDK into Unity
    /// This script demonstrates all core GBSDK functionality
    /// </summary>
    public class AdManager : MonoBehaviour
    {
        [Header("Configuration")]
        [SerializeField] private bool useAutoDetection = true;
        [SerializeField] private string customConfigUrl = "https://your-cdn.com/ads/config.json"; // Only used if auto-detection is disabled
        [SerializeField] private bool debugMode = true;
        [SerializeField] private bool initializeOnStart = true;

        [Header("UI References")]
        [SerializeField] private Button initButton;
        [SerializeField] private Button interstitialButton;
        [SerializeField] private Button rewardedButton;
        [SerializeField] private Button gameStartButton;
        [SerializeField] private Button gameEndButton;
        [SerializeField] private Text statusText;
        [SerializeField] private Text logText;

        [Header("Game Settings")]
        [SerializeField] private int rewardCoins = 100;
        [SerializeField] private int playerCoins = 0;

        private bool isInitialized = false;

        #region Unity Lifecycle

        void Start()
        {
            SetupUI();

            if (initializeOnStart)
            {
                InitializeSDK();
            }
        }

        void OnDestroy()
        {
            // Unsubscribe from events
            GBSDK.OnInitialized -= OnSDKInitialized;
            GBSDK.OnInterstitialResult -= OnInterstitialResult;
            GBSDK.OnRewardedResult -= OnRewardedResult;
            GBSDK.OnGameStarted -= OnGameStarted;
            GBSDK.OnGameEnded -= OnGameEnded;

            // Clean up GBSDK
            GBSDK.Destroy();
        }

        #endregion

        #region UI Setup

        private void SetupUI()
        {
            // Setup button listeners
            if (initButton) initButton.onClick.AddListener(InitializeSDK);
            if (interstitialButton) interstitialButton.onClick.AddListener(ShowInterstitialAd);
            if (rewardedButton) rewardedButton.onClick.AddListener(ShowRewardedAd);
            if (gameStartButton) gameStartButton.onClick.AddListener(StartGame);
            if (gameEndButton) gameEndButton.onClick.AddListener(EndGame);

            // Subscribe to GBSDK events
            GBSDK.OnInitialized += OnSDKInitialized;
            GBSDK.OnInterstitialResult += OnInterstitialResult;
            GBSDK.OnRewardedResult += OnRewardedResult;
            GBSDK.OnGameStarted += OnGameStarted;
            GBSDK.OnGameEnded += OnGameEnded;

            // Initial UI state
            UpdateUI();
            LogMessage("AdManager ready. Click Initialize to start.");
        }

        private void UpdateUI()
        {
            if (statusText)
            {
                statusText.text = isInitialized ? "GBSDK Ready" : "Not Initialized";
                statusText.color = isInitialized ? Color.green : Color.red;
            }

            // Update button states
            if (interstitialButton)
                interstitialButton.interactable = isInitialized && GBSDK.CanShow("interstitial");

            if (rewardedButton)
                rewardedButton.interactable = isInitialized && GBSDK.CanShow("rewarded");

            if (gameStartButton)
                gameStartButton.interactable = isInitialized;

            if (gameEndButton)
                gameEndButton.interactable = isInitialized;
        }

        private void LogMessage(string message)
        {
            string timestamp = DateTime.Now.ToString("HH:mm:ss");
            string logEntry = $"[{timestamp}] {message}";

            Debug.Log(logEntry);

            if (logText)
            {
                logText.text = logEntry + "\n" + logText.text;

                // Keep only last 10 lines
                string[] lines = logText.text.Split('\n');
                if (lines.Length > 10)
                {
                    logText.text = string.Join("\n", lines, 0, 10);
                }
            }
        }

        #endregion

        #region GBSDK Integration

        public async void InitializeSDK()
        {
            if (isInitialized)
            {
                LogMessage("GBSDK already initialized");
                return;
            }

            LogMessage("Initializing GBSDK...");

            if (initButton) initButton.interactable = false;

            try
            {
                bool success;

                if (useAutoDetection)
                {
                    LogMessage("Using auto-detection (zero configuration)...");
                    success = await GBSDK.Initialize(debugMode);
                }
                else
                {
                    LogMessage($"Using custom config URL: {customConfigUrl}");
                    success = await GBSDK.Initialize(customConfigUrl, debugMode);
                }

                if (success)
                {
                    LogMessage("GBSDK initialized successfully!");
                    isInitialized = true;
                }
                else
                {
                    LogMessage("GBSDK initialization failed");
                }
            }
            catch (Exception e)
            {
                LogMessage($"GBSDK initialization error: {e.Message}");
            }
            finally
            {
                if (initButton) initButton.interactable = !isInitialized;
                UpdateUI();
            }
        }

        public async void ShowInterstitialAd()
        {
            if (!isInitialized)
            {
                LogMessage("GBSDK not initialized");
                return;
            }

            if (!GBSDK.CanShow("interstitial"))
            {
                LogMessage("Interstitial ad not available (cooldown or cap reached)");
                return;
            }

            LogMessage("Showing interstitial ad...");

            if (interstitialButton) interstitialButton.interactable = false;

            try
            {
                var result = await GBSDK.ShowInterstitial();

                if (result.success)
                {
                    LogMessage("Interstitial ad completed successfully");
                }
                else
                {
                    LogMessage($"Interstitial ad failed: {result.reason}");
                }
            }
            catch (Exception e)
            {
                LogMessage($"Interstitial ad error: {e.Message}");
            }
            finally
            {
                UpdateUI();
            }
        }

        public async void ShowRewardedAd()
        {
            if (!isInitialized)
            {
                LogMessage("GBSDK not initialized");
                return;
            }

            if (!GBSDK.CanShow("rewarded"))
            {
                LogMessage("Rewarded ad not available (cooldown or cap reached)");
                return;
            }

            LogMessage("Showing rewarded ad...");

            if (rewardedButton) rewardedButton.interactable = false;

            try
            {
                var result = await GBSDK.ShowRewarded();

                if (result.success)
                {
                    LogMessage("Rewarded ad completed - granting reward!");
                    GrantReward();
                }
                else
                {
                    LogMessage($"Rewarded ad failed: {result.reason}");
                }
            }
            catch (Exception e)
            {
                LogMessage($"Rewarded ad error: {e.Message}");
            }
            finally
            {
                UpdateUI();
            }
        }

        public void StartGame()
        {
            if (!isInitialized)
            {
                LogMessage("GBSDK not initialized");
                return;
            }

            LogMessage("Starting game session...");
            GBSDK.GameStarted();
        }

        public void EndGame()
        {
            if (!isInitialized)
            {
                LogMessage("GBSDK not initialized");
                return;
            }

            LogMessage("Ending game session...");
            GBSDK.GameEnded();

            // Show interstitial ad after game ends
            ShowGameOverAd();
        }

        private async void ShowGameOverAd()
        {
            // Wait a bit before showing ad
            await System.Threading.Tasks.Task.Delay(1000);

            if (GBSDK.CanShow("interstitial"))
            {
                LogMessage("Showing game over interstitial...");
                await GBSDK.ShowInterstitial();
            }
        }

        private void GrantReward()
        {
            playerCoins += rewardCoins;
            LogMessage($"Granted {rewardCoins} coins! Total: {playerCoins}");

            // Update UI or save player data here
            // PlayerPrefs.SetInt("PlayerCoins", playerCoins);
        }

        #endregion

        #region GBSDK Event Handlers

        private void OnSDKInitialized()
        {
            LogMessage("GBSDK initialization complete - ready to show ads!");
            isInitialized = true;
            UpdateUI();
        }

        private void OnInterstitialResult(GBSDK.AdResult result)
        {
            if (result.success)
            {
                LogMessage("Interstitial ad event: Completed successfully");
            }
            else
            {
                LogMessage($"Interstitial ad event: Failed ({result.reason})");
            }
        }

        private void OnRewardedResult(GBSDK.AdResult result)
        {
            if (result.success)
            {
                LogMessage("Rewarded ad event: User earned reward!");
            }
            else
            {
                LogMessage($"Rewarded ad event: No reward ({result.reason})");
            }
        }

        private void OnGameStarted()
        {
            LogMessage("Game session started event received");
        }

        private void OnGameEnded()
        {
            LogMessage("Game session ended event received");
        }

        #endregion

        #region Public API for Other Scripts

        /// <summary>
        /// Check if GBSDK is ready to use
        /// </summary>
        public bool IsReady => isInitialized;

        /// <summary>
        /// Show interstitial ad from other scripts
        /// </summary>
        public async System.Threading.Tasks.Task<bool> RequestInterstitial()
        {
            if (!isInitialized || !GBSDK.CanShow("interstitial"))
                return false;

            var result = await GBSDK.ShowInterstitial();
            return result.success;
        }

        /// <summary>
        /// Show rewarded ad from other scripts
        /// </summary>
        public async System.Threading.Tasks.Task<bool> RequestRewarded()
        {
            if (!isInitialized || !GBSDK.CanShow("rewarded"))
                return false;

            var result = await GBSDK.ShowRewarded();
            return result.success;
        }

        /// <summary>
        /// Get current player coins (example)
        /// </summary>
        public int GetPlayerCoins() => playerCoins;

        #endregion
    }
}
