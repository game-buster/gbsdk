# Unity Integration Guide for GBSDK

This guide shows how to integrate GBSDK into your Unity WebGL game using the provided C# bridge.

## 📦 Installation

### Step 1: Download Files

Copy these files to your Unity project:

1. **GBSDK.cs** → `Assets/Scripts/` (or any Scripts folder)
2. **GBSDK.jslib** → `Assets/Plugins/WebGL/`

### Step 2: Include GBSDK Script in WebGL Template

Add the GBSDK script to your WebGL template's `index.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <!-- Your existing head content -->

    <!-- Add GBSDK script BEFORE Unity loader -->
    <script src="https://unpkg.com/@game-buster/gbsdk@latest/dist/gbsdk.js"></script>
</head>
<body>
    <!-- Your Unity content -->
    <script>
        // Unity WebGL loader code
    </script>
</body>
</html>
```

## 🚀 Basic Usage

### Initialize GBSDK

```csharp
using GameBuster;
using UnityEngine;

public class AdManager : MonoBehaviour
{
    async void Start()
    {
        // Initialize SDK (config automatically loaded from GameBuster)
        bool success = await GBSDK.Initialize();

        if (success)
        {
            Debug.Log("GBSDK ready!");

            // Track game session start
            GBSDK.GameStarted();

            // Subscribe to events
            GBSDK.OnInterstitialResult += OnInterstitialResult;
            GBSDK.OnRewardedResult += OnRewardedResult;
        }
        else
        {
            Debug.LogError("GBSDK initialization failed");
        }
    }

    void OnDestroy()
    {
        // Unsubscribe from events
        GBSDK.OnInterstitialResult -= OnInterstitialResult;
        GBSDK.OnRewardedResult -= OnRewardedResult;

        // Clean up
        GBSDK.Destroy();
    }

    private void OnInterstitialResult(GBSDK.AdResult result)
    {
        if (result.success)
        {
            Debug.Log("Interstitial completed");
        }
    }

    private void OnRewardedResult(GBSDK.AdResult result)
    {
        if (result.success)
        {
            Debug.Log("Player earned reward");
            // Grant reward
        }
    }
}
```

### Show Interstitial Ads

```csharp
public class LevelManager : MonoBehaviour
{
    public async void OnLevelComplete()
    {
        // Show interstitial ad between levels
        if (GBSDK.CanShow("interstitial"))
        {
            var result = await GBSDK.ShowInterstitial();

            if (result.success)
            {
                Debug.Log("Interstitial ad completed");
                LoadNextLevel();
            }
            else
            {
                Debug.Log($"Interstitial failed: {result.reason}");
                LoadNextLevel(); // Continue anyway
            }
        }
        else
        {
            LoadNextLevel(); // Skip ad if not available
        }
    }
}
```

### Show Rewarded Ads

```csharp
public class RewardSystem : MonoBehaviour
{
    [SerializeField] private int rewardCoins = 100;

    public async void WatchAdForReward()
    {
        if (!GBSDK.CanShow("rewarded"))
        {
            Debug.Log("Rewarded ad not available");
            return;
        }

        var result = await GBSDK.ShowRewarded();

        if (result.success)
        {
            // Grant reward only on successful completion
            GrantReward();
            Debug.Log("Reward granted!");
        }
        else
        {
            Debug.Log($"Rewarded ad failed: {result.reason}");
        }
    }

    private void GrantReward()
    {
        // Add coins, lives, power-ups, etc.
        PlayerData.coins += rewardCoins;

        // Update UI
        UIManager.Instance.UpdateCoinsDisplay();
    }
}
```

### Track Game Sessions

```csharp
public class GameController : MonoBehaviour
{
    void Start()
    {
        // Track when game starts
        GBSDK.GameStarted();
    }

    public void OnGameOver()
    {
        // Track when game ends
        GBSDK.GameEnded();

        // Show interstitial ad after game over
        ShowGameOverAd();
    }

    private async void ShowGameOverAd()
    {
        if (GBSDK.CanShow("interstitial"))
        {
            await GBSDK.ShowInterstitial();
        }
    }
}
```

## 🎯 Event Handling

```csharp
public class AdEventHandler : MonoBehaviour
{
    void Start()
    {
        // Subscribe to all GBSDK events
        GBSDK.OnInitialized += OnSDKInitialized;
        GBSDK.OnInterstitialResult += OnInterstitialResult;
        GBSDK.OnRewardedResult += OnRewardedResult;
        GBSDK.OnGameStarted += OnGameStarted;
        GBSDK.OnGameEnded += OnGameEnded;
    }

    private void OnSDKInitialized()
    {
        Debug.Log("GBSDK is ready to show ads");
    }

    private void OnInterstitialResult(GBSDK.AdResult result)
    {
        if (result.success)
        {
            Debug.Log("Interstitial ad completed successfully");
            // Continue game flow
        }
        else
        {
            Debug.Log($"Interstitial ad failed: {result.reason}");
            // Handle failure (usually continue anyway)
        }
    }

    private void OnRewardedResult(GBSDK.AdResult result)
    {
        if (result.success)
        {
            Debug.Log("User earned reward!");
            // Grant reward to player
            GrantReward();
        }
        else
        {
            Debug.Log($"Rewarded ad failed: {result.reason}");
            // Don't grant reward
        }
    }

    private void OnGameStarted()
    {
        Debug.Log("Game session started");
    }

    private void OnGameEnded()
    {
        Debug.Log("Game session ended");
    }
}
```

## 🛠️ Build Settings

### WebGL Build Configuration

1. **Platform**: Switch to WebGL platform
2. **Player Settings**:
   - **Data Caching**: Enable for better performance
   - **Compression Format**: Gzip (recommended)
   - **Code Optimization**: Master or Release
3. **Publishing Settings**:
   - Include GBSDK script in your WebGL template

### WebGL Template Setup

Create a custom WebGL template with GBSDK:

```html
<!DOCTYPE html>
<html lang="en-us">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>Unity WebGL Player | {{{ PRODUCT_NAME }}}</title>

    <!-- GBSDK Script -->
    <script src="https://unpkg.com/@game-buster/gbsdk@latest/dist/gbsdk.js"></script>
</head>
<body>
    <div id="unity-container">
        <canvas id="unity-canvas"></canvas>
        <div id="unity-loading-bar">
            <div id="unity-logo"></div>
            <div id="unity-progress-bar-empty">
                <div id="unity-progress-bar-full"></div>
            </div>
        </div>
    </div>

    <script>
        var container = document.querySelector("#unity-container");
        var canvas = document.querySelector("#unity-canvas");
        var loadingBar = document.querySelector("#unity-loading-bar");

        // Unity WebGL loader configuration
        var buildUrl = "Build";
        var loaderUrl = buildUrl + "/{{{ LOADER_FILENAME }}}";
        var config = {
            dataUrl: buildUrl + "/{{{ DATA_FILENAME }}}",
            frameworkUrl: buildUrl + "/{{{ FRAMEWORK_FILENAME }}}",
            codeUrl: buildUrl + "/{{{ CODE_FILENAME }}}",
#if MEMORY_FILENAME
            memoryUrl: buildUrl + "/{{{ MEMORY_FILENAME }}}",
#endif
#if SYMBOLS_FILENAME
            symbolsUrl: buildUrl + "/{{{ SYMBOLS_FILENAME }}}",
#endif
            streamingAssetsUrl: "StreamingAssets",
            companyName: "{{{ COMPANY_NAME }}}",
            productName: "{{{ PRODUCT_NAME }}}",
            productVersion: "{{{ PRODUCT_VERSION }}}",
        };

        // Load Unity
        var script = document.createElement("script");
        script.src = loaderUrl;
        script.onload = () => {
            createUnityInstance(canvas, config, (progress) => {
                // Loading progress
            }).then((unityInstance) => {
                loadingBar.style.display = "none";
            }).catch((message) => {
                alert(message);
            });
        };
        document.body.appendChild(script);
    </script>
</body>
</html>
```

## 🐛 Troubleshooting

### Common Issues

#### "GBSDK not found" Error
- Make sure GBSDK script is loaded before Unity
- Check browser console for script loading errors
- Verify CDN URL is accessible

#### Ads Not Showing
- Check if `GBSDK.CanShow()` returns true
- Verify cooldown periods (90 seconds default)
- Verify session caps (20 ads per session default)
- Check browser console for errors

#### Async/Await Issues
- Make sure your methods are marked as `async`
- Use `await` when calling GBSDK methods
- Handle exceptions with try-catch blocks

#### Editor Testing
- GBSDK only works in WebGL builds
- Editor will simulate ad results for testing
- Always test in actual WebGL build

## 📱 Platform Support

- **WebGL**: Full support ✅
- **Standalone**: Not supported ❌
- **Mobile**: Not supported ❌
- **Editor**: Simulation only (for testing) ⚠️

## Best Practices

### User Experience

1. **Always check `CanShow()` before showing ads**
   ```csharp
   if (GBSDK.CanShow("rewarded")) {
       await GBSDK.ShowRewarded();
   }
   ```

2. **Don't punish players for ad failures**
   ```csharp
   var result = await GBSDK.ShowInterstitial();
   LoadNextLevel(); // Continue regardless of ad result
   ```

3. **Show rewarded ads from user interaction**
   ```csharp
   public async void OnRewardButtonClick() {
       var result = await GBSDK.ShowRewarded();
       if (result.success) {
           GrantReward();
       }
   }
   ```

### Game Integration

1. **Track game sessions**
   ```csharp
   // When game starts
   GBSDK.GameStarted();

   // When game ends
   GBSDK.GameEnded();
   ```

2. **Show interstitials at natural breaks**
   - Between levels
   - After game over
   - When returning to menu

3. **Use rewarded ads for optional benefits**
   - Extra coins/lives
   - Power-ups
   - Unlocking content

## 🔗 Related Links

- [GBSDK Main Documentation](../../README.md)
- [GameBuster Platform](https://game-buster.com)
- [GitHub Repository](https://github.com/game-buster/gbsdk)
