# Unity Integration Guide for GBSDK

This guide shows how to integrate GBSDK into your Unity WebGL game using the provided C# bridge.

## 📦 Installation

### Method 1: Using GameBuster WebGL Template (Recommended - Easiest!)

1. **Copy the WebGL Template:**
   - Copy the entire `WebGLTemplates/GameBuster/` folder to your Unity project's `Assets/` directory
   - Result: `Assets/WebGLTemplates/GameBuster/`

2. **Select the Template:**
   - Go to `Edit → Project Settings → Player`
   - Select the `WebGL` tab
   - Under `Resolution and Presentation`, find `WebGL Template`
   - Select `GameBuster` from the dropdown

3. **Add GBSDK Scripts:**
   - Copy `GBSDK.cs` → `Assets/Scripts/` (or any Scripts folder)
   - Copy `GBSDK.jslib` → `Assets/Plugins/WebGL/`

4. **Done!** The template automatically includes the GBSDK script from CDN.

**Features:**
- ✅ Modern loading screen with GameBuster logo (from CDN)
- ✅ Animated progress bar with shimmer effect
- ✅ Real-time loading percentage display (0-100%)
- ✅ Dynamic loading status messages
- ✅ Smooth fade-out transition when loading completes
- ✅ Beautiful purple gradient background
- ✅ Pulsing logo animation
- ✅ Fullscreen support
- ✅ Mobile responsive
- ✅ GBSDK auto-loaded from CDN

---

### Method 2: Manual Installation (Custom Template)

If you want to use your own WebGL template:

1. **Add GBSDK Scripts:**
   - Copy `GBSDK.cs` → `Assets/Scripts/`
   - Copy `GBSDK.jslib` → `Assets/Plugins/WebGL/`

2. **Modify Your WebGL Template:**

   Add the GBSDK script to your template's `index.html` (BEFORE Unity loader):

   ```html
   <!DOCTYPE html>
   <html>
   <head>
       <!-- Your existing head content -->

       <!-- Add GBSDK script BEFORE Unity loader -->
       <script src="https://cdn.game-buster.com/gbsdk.js"></script>
   </head>
   <body>
       <!-- Your Unity content -->
       <script>
           // Unity WebGL loader code
       </script>
   </body>
   </html>
   ```

---

### Method 3: UPM Package (Unity Package Manager)

```
1. Open Unity Package Manager (Window → Package Manager)
2. Click the '+' button → Add package from git URL
3. Enter: https://github.com/mertmisirlioglu/gbsdk.git?path=/bridges/unity
4. Click 'Add'
```

The package includes:
- ✅ GBSDK.cs (C# wrapper)
- ✅ GBSDK.jslib (JavaScript bridge)
- ✅ WebGL Template (pre-configured)
- ✅ Example scripts

## 🚀 Basic Usage

### Initialize GBSDK

```csharp
using GameBuster;
using UnityEngine;

public class AdManager : MonoBehaviour
{
    [SerializeField] private string configUrl = "https://your-cdn.com/ads/config.json";
    [SerializeField] private bool debugMode = true;

    async void Start()
    {
        // Option 1: Auto-detection (Recommended - Zero Configuration!)
        bool success = await GBSDK.Initialize(debugMode);

        // Option 2: Custom configuration (Advanced usage)
        // bool success = await GBSDK.Initialize(configUrl, debugMode);

        if (success)
        {
            Debug.Log("GBSDK ready with auto-detected game info!");

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

## 🎯 Advanced Configuration

### Full Configuration Options

```csharp
var config = new GBSDK.Config
{
    configUrl = "https://your-cdn.com/ads/config.json",
    allowDomains = new string[] { "your-cdn.com" },
    cooldownSec = 90,
    sessionCap = 20,
    debug = true,
    
    // Fallback VAST tags (optional)
    interstitialTags = new string[]
    {
        "https://your-ad-server.com/vast/interstitial"
    },
    rewardedTags = new string[]
    {
        "https://your-ad-server.com/vast/rewarded"
    }
};

bool success = await GBSDK.Initialize(config);
```

### Event Handling

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
        // Analytics, session tracking, etc.
    }
    
    private void OnGameEnded()
    {
        Debug.Log("Game session ended");
        // Analytics, session tracking, etc.
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
    <script src="https://cdn.game-buster.com/gbsdk.js"></script>
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
- Verify cooldown periods and session caps
- Test with debug mode enabled
- Check browser console for errors

#### Async/Await Issues
- Make sure your methods are marked as `async`
- Use `await` when calling GBSDK methods
- Handle exceptions with try-catch blocks

#### Editor Testing
- GBSDK only works in WebGL builds
- Editor will simulate ad results for testing
- Always test in actual WebGL build

### Debug Mode

Enable debug logging to see detailed information:

```csharp
await GBSDK.Initialize(configUrl, debug: true);
```

This will show detailed logs in the browser console.

## 📱 Platform Support

- **WebGL**: Full support ✅
- **Standalone**: Not supported ❌
- **Mobile**: Not supported ❌
- **Editor**: Simulation only (for testing) ⚠️

## 🔗 Related Links

- [GBSDK Main Documentation](../../README.md)
- [Remote Configuration Guide](../../README.md#remote-configuration)
- [Troubleshooting Guide](../../README.md#troubleshooting)
