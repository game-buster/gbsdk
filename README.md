# GBSDK - GameBuster Core Ads SDK

A lightweight, zero-dependency in-game ads SDK for web games with VAST 4.x + Google IMA HTML5 support. Simplified to 5 core methods for maximum ease of integration.

[![npm version](https://badge.fury.io/js/%40gamebuster%2Fgbsdk.svg)](https://badge.fury.io/js/%40gamebuster%2Fgbsdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 Core Features

- **Ultra-lightweight** - Only 17KB minified (60% smaller than full version)
- **5 simple methods** - `init()`, `showInterstitial()`, `showRewarded()`, `gameStarted()`, `gameEnded()`
- **Zero runtime dependencies** - Pure JavaScript, no external libs
- **VAST 4.x + Google IMA HTML5** - Industry standard video ads
- **Google Ad Manager (GAM)** - Full programmatic ads support
- **Prebid.js Integration** - Header bidding for maximum revenue
- **Smart Waterfall** - Prebid → GAM → VAST automatic fallback
- **Remote configuration** - Update ad tags without code changes
- **Cross-platform** - Works in Unity WebGL, HTML5 games, and all major game engines
- **TypeScript support** - Full type definitions included
- **Multiple formats** - ESM, CJS, and UMD builds

## 📦 Installation

### CDN (Recommended for most games)

```html
<!-- Single file - 30KB minified -->
<script src="https://unpkg.com/@gamebuster/gbsdk@latest/dist/index.js"></script>
```

### NPM/Yarn (For bundled projects)

```bash
npm install @gamebuster/gbsdk
# or
yarn add @gamebuster/gbsdk
```

## 🚀 Quick Start

```javascript
// Create SDK instance
const gbsdk = new GBSDK.GBSDK(); // UMD
// or: import { GBSDK } from '@gamebuster/gbsdk'; const gbsdk = new GBSDK(); // ESM

// 1. Initialize SDK
await gbsdk.init({
  configUrl: 'https://cdn.gamebuster.gg/ads/config.json?game_id=your_game',
  debug: true
});

// 2. Track game session
gbsdk.gameStarted();

// 3. Show ads
await gbsdk.showInterstitial(); // Between levels
const reward = await gbsdk.showRewarded(); // For rewards
if (reward.success) {
  // Grant reward to player
}

// 4. Track game end
gbsdk.gameEnded();
```

## 🎯 Ad Network Support

GBSDK supports multiple ad networks with automatic waterfall:

### 1. Google Ad Manager (GAM) + Prebid (Recommended)

Maximum revenue with header bidding + programmatic ads:

```json
{
  "version": "1.0.0",
  "interstitial": {
    "sources": [
      {
        "type": "prebid",
        "prebid": {
          "enabled": true,
          "timeout": 2000,
          "bidders": [
            { "name": "appnexus", "params": { "placementId": "YOUR_ID" } },
            { "name": "rubicon", "params": { "accountId": "YOUR_ID", "siteId": "YOUR_ID", "zoneId": "YOUR_ID" } }
          ]
        }
      },
      {
        "type": "gam",
        "gam": {
          "enabled": true,
          "networkCode": "YOUR_NETWORK_CODE",
          "adUnitPath": "interstitial_video",
          "sizes": [[640, 480], [1280, 720]]
        }
      },
      {
        "type": "vast",
        "vastTags": ["https://api.applixi.com/v1/vast?apiKey=YOUR_KEY&type=interstitial"]
      }
    ]
  }
}
```

**📖 [Complete GAM + Prebid Setup Guide](./GAM-PREBID-SETUP.md)**

### 2. Applixi Integration

Simple VAST-based integration:

```json
{
  "version": "1.0.0",
  "cooldownSec": 90,
  "sessionCap": 20,
  "interstitial": {
    "tags": [
      "https://api.applixi.com/v1/vast?apiKey=YOUR_API_KEY&type=interstitial"
    ]
  },
  "rewarded": {
    "tags": [
      "https://api.applixi.com/v1/vast?apiKey=YOUR_API_KEY&type=rewarded"
    ]
  }
}
```

### Quick Test with Applixi

```javascript
const gbsdk = new GBSDK.GBSDK();

await gbsdk.init({
  configUrl: 'https://your-cdn.com/ads/config.json',
  debug: true
});

// Show Applixi interstitial ad
const interstitialResult = await gbsdk.showInterstitial();
if (interstitialResult.success) {
  console.log('Applixi interstitial completed!');
}

// Show Applixi rewarded ad
const rewardedResult = await gbsdk.showRewarded();
if (rewardedResult.success) {
  console.log('User earned reward from Applixi ad!');
  // Grant reward to player
}
```

### Test Page

A complete Applixi test page is included in `example/test-applixi.html` with:
- ✅ Beautiful UI with real-time status updates
- ✅ Pre-configured Applixi API key for testing
- ✅ Console logging for debugging
- ✅ Session tracking and cooldown visualization

**Try it now:** `http://localhost:8080/example/test-applixi.html`

## 📚 API Reference

### Core Methods

#### `init(config: GBInit): Promise<void>`
Initialize the SDK with configuration.

#### `showInterstitial(): Promise<ShowResult>`
Show an interstitial ad. Returns `{success: true/false, reason?: string}`.

#### `showRewarded(): Promise<ShowResult>`
Show a rewarded ad. Only returns success if user watches to completion.

#### `gameStarted(): void`
Track when a game session starts.

#### `gameEnded(): void`
Track when a game session ends.

### Configuration Options

```typescript
interface GBInit {
  configUrl?: string;           // Remote config URL
  allowDomains?: string[];      // Allowed domains for config
  interstitialTags?: string[];  // Fallback interstitial VAST tags
  rewardedTags?: string[];      // Fallback rewarded VAST tags
  cooldownSec?: number;         // Cooldown between ads (default: 90)
  sessionCap?: number;          // Max ads per session (default: 20)
  debug?: boolean;              // Enable debug logging (default: false)
}
```

## 🎮 Game Engine Integration Guides

### Unity WebGL

See [Unity Integration Guide](./bridges/unity/README.md) for complete C# bridge implementation.

```csharp
// Unity C# example
using GameBuster;

public class AdManager : MonoBehaviour 
{
    async void Start() 
    {
        await GBSDK.Initialize("https://your-config-url.json");
        GBSDK.GameStarted();
    }
    
    public async void ShowRewardedAd() 
    {
        var result = await GBSDK.ShowRewarded();
        if (result.success) {
            // Grant reward
        }
    }
}
```

### Phaser 3

```javascript
class GameScene extends Phaser.Scene {
    async create() {
        // Initialize GBSDK
        this.gbsdk = new GBSDK.GBSDK();
        await this.gbsdk.init({
            configUrl: 'https://your-config-url.json'
        });
        
        this.gbsdk.gameStarted();
    }
    
    async showInterstitial() {
        const result = await this.gbsdk.showInterstitial();
        if (result.success) {
            // Continue game
        }
    }
    
    async showRewardedAd() {
        const result = await this.gbsdk.showRewarded();
        if (result.success) {
            // Grant reward
            this.player.addCoins(100);
        }
    }
}
```

### Pixi.js

```javascript
class Game extends PIXI.Application {
    async init() {
        // Initialize GBSDK
        this.gbsdk = new GBSDK.GBSDK();
        await this.gbsdk.init({
            configUrl: 'https://your-config-url.json'
        });
        
        this.gbsdk.gameStarted();
        
        // Setup game
        this.setupGame();
    }
    
    async levelComplete() {
        // Show interstitial between levels
        await this.gbsdk.showInterstitial();
        this.nextLevel();
    }
    
    async watchAdForReward() {
        const result = await this.gbsdk.showRewarded();
        if (result.success) {
            this.grantReward();
        }
    }
}
```

### HTML5 Games (Vanilla JS)

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/@gamebuster/gbsdk@latest/dist/index.umd.js"></script>
</head>
<body>
    <button onclick="showRewardedAd()">Watch Ad for Coins</button>
    
    <script>
        let gbsdk;
        
        async function initGame() {
            gbsdk = new GBSDK.GBSDK();
            await gbsdk.init({
                configUrl: 'https://your-config-url.json'
            });
            gbsdk.gameStarted();
        }
        
        async function showRewardedAd() {
            const result = await gbsdk.showRewarded();
            if (result.success) {
                addCoins(100);
            }
        }
        
        // Initialize when page loads
        window.addEventListener('load', initGame);
    </script>
</body>
</html>
```

### Godot (HTML5 Export)

```gdscript
# AdManager.gd
extends Node

var gbsdk_initialized = false

func _ready():
    if OS.get_name() == "HTML5":
        initialize_gbsdk()

func initialize_gbsdk():
    JavaScript.eval("""
        window.gbsdk = new GBSDK.GBSDK();
        window.gbsdk.init({
            configUrl: 'https://your-config-url.json'
        }).then(() => {
            window.gbsdk.gameStarted();
            window.gbsdk_ready = true;
        });
    """)

func show_interstitial():
    if OS.get_name() == "HTML5":
        JavaScript.eval("""
            window.gbsdk.showInterstitial().then(result => {
                if (result.success) {
                    console.log('Interstitial completed');
                }
            });
        """)

func show_rewarded():
    if OS.get_name() == "HTML5":
        JavaScript.eval("""
            window.gbsdk.showRewarded().then(result => {
                if (result.success) {
                    // Call back to Godot
                    window.godot_reward_granted = true;
                }
            });
        """)
```

### Construct 3

1. Add the GBSDK script to your project:
   - Right-click in Project panel → "Add script"
   - Choose "JavaScript file in project"
   - Add: `https://unpkg.com/@gamebuster/gbsdk@latest/dist/index.umd.js`

2. Create event sheet actions:

```javascript
// On start of layout
const gbsdk = new GBSDK.GBSDK();
await gbsdk.init({
    configUrl: 'https://your-config-url.json'
});
gbsdk.gameStarted();
runtime.globalVars.gbsdk = gbsdk;

// Show interstitial ad
const result = await runtime.globalVars.gbsdk.showInterstitial();
if (result.success) {
    // Continue to next level
}

// Show rewarded ad
const result = await runtime.globalVars.gbsdk.showRewarded();
if (result.success) {
    // Add coins or lives
    runtime.globalVars.coins += 100;
}
```

### GameMaker Studio (HTML5)

```javascript
// Create Script: scr_gbsdk_init
if (os_browser != browser_not_a_browser) {
    gml_Script_gmcallback_create_function("gbsdk_init", "
        window.gbsdk = new GBSDK.GBSDK();
        window.gbsdk.init({
            configUrl: 'https://your-config-url.json'
        }).then(() => {
            window.gbsdk.gameStarted();
            window.gbsdk_ready = true;
        });
    ");
    
    gml_Script_gmcallback_create_function("gbsdk_show_interstitial", "
        if (window.gbsdk_ready) {
            window.gbsdk.showInterstitial().then(result => {
                if (result.success) {
                    window.interstitial_completed = true;
                }
            });
        }
    ");
    
    gml_Script_gmcallback_create_function("gbsdk_show_rewarded", "
        if (window.gbsdk_ready) {
            window.gbsdk.showRewarded().then(result => {
                if (result.success) {
                    window.reward_granted = true;
                }
            });
        }
    ");
}

// Usage in GML:
// scr_gbsdk_init(); // Call in Game Start event
// gmcallback_call_function("gbsdk_show_interstitial"); // Show interstitial
// gmcallback_call_function("gbsdk_show_rewarded"); // Show rewarded
```

## 🔧 Platform-Specific Considerations

### Unity WebGL
- **WebGL Only**: GBSDK only works in WebGL builds, not standalone/mobile
- **User Gesture**: First ad call must be from user interaction (button click)
- **Async/Await**: Use Unity's async/await with proper error handling
- **Build Settings**: Ensure "Data Caching" is enabled for better performance

### Mobile Web Games
- **Autoplay Policies**: First ad requires user gesture on iOS Safari
- **Viewport**: Ads automatically scale to fit mobile screens
- **Performance**: Consider showing ads only on WiFi for better UX

### Game Portals (Poki, CrazyGames, etc.)
- **Portal Integration**: Some portals provide their own ad systems
- **Revenue Share**: Check portal policies for external ad networks
- **Testing**: Always test on actual portal environment

## 🛠️ Remote Configuration

Create a JSON config file on your CDN:

```json
{
  "version": "1.0.0",
  "interstitial": {
    "tags": [
      "https://your-ad-server.com/vast/interstitial/1",
      "https://your-ad-server.com/vast/interstitial/2"
    ],
    "cooldownSec": 90,
    "sessionCap": 10
  },
  "rewarded": {
    "tags": [
      "https://your-ad-server.com/vast/rewarded/1",
      "https://your-ad-server.com/vast/rewarded/2"
    ],
    "cooldownSec": 60,
    "sessionCap": 5
  }
}
```

### CDN Setup Tips
- **ETag Support**: Enable ETag headers for efficient caching
- **CORS**: Configure CORS if serving from different domain
- **Cache Headers**: Set appropriate `Cache-Control` headers
- **HTTPS**: Always serve config over HTTPS

## 🐛 Troubleshooting

### Common Issues

#### "Ad failed to load"
- Check if VAST tags are valid and accessible
- Verify network connectivity
- Test with Google's sample VAST tags first

#### "User gesture required"
- First ad call must be from user interaction (button click)
- Don't call ads automatically on page load

#### "Cooldown active"
- Respect cooldown periods between ads
- Use `gbsdk.canShow('interstitial')` to check availability

#### "Session cap reached"
- Don't exceed session limits
- Consider resetting on new game sessions

### Debug Mode

Enable debug logging to see detailed information:

```javascript
await gbsdk.init({
  configUrl: 'https://your-config-url.json',
  debug: true // Enable debug logs
});
```

### Testing with Sample VAST Tags

Use Google's sample VAST tags for testing:

```javascript
await gbsdk.init({
  interstitialTags: [
    'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator='
  ],
  rewardedTags: [
    'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dredirectlinear&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator='
  ],
  debug: true
});
```

## 📊 Events

Listen to SDK events for analytics and debugging:

```javascript
gbsdk.on('loaded', () => console.log('Ad loaded'));
gbsdk.on('started', () => console.log('Ad started'));
gbsdk.on('complete', () => console.log('Ad completed'));
gbsdk.on('error', (error) => console.log('Ad error:', error));
gbsdk.on('game_started', () => console.log('Game session started'));
gbsdk.on('game_ended', () => console.log('Game session ended'));
```

## 🌐 Browser Support

- **Chrome** 80+
- **Firefox** 75+
- **Safari** 13+
- **Edge** 80+
- **Mobile Safari** 13+
- **Chrome Mobile** 80+

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🔗 Integration Bridges

Ready-to-use integration bridges for popular game engines:

- **[Unity WebGL](./bridges/unity/)** - Complete C# bridge with async/await support
- **[Phaser 3](./bridges/phaser/)** - JavaScript wrapper with scene management
- **[Pixi.js](./bridges/pixi/)** - EventEmitter-based integration with game pause/resume
- **[Godot](./bridges/godot/)** - GDScript integration for HTML5 exports
- **[Construct 3](./bridges/construct3/)** - Event sheet integration examples
- **[GameMaker Studio](./bridges/gamemaker/)** - GML integration for HTML5 exports

Each bridge includes:
- ✅ Complete integration code
- ✅ Usage examples
- ✅ Platform-specific documentation
- ✅ Best practices and troubleshooting

## 🤝 Support

- **Documentation**: [Full integration guides](./bridges/)
- **Issues**: [GitHub Issues](https://github.com/gamebuster/gbsdk/issues)
- **Discord**: [GameBuster Community](https://discord.gg/gamebuster)
