# GBSDK - GameBuster Ads SDK

A lightweight, zero-dependency in-game ads SDK for web games with VAST 4.x + Google IMA HTML5 support.

[![npm version](https://badge.fury.io/js/%40game-buster%2Fgbsdk.svg)](https://www.npmjs.com/package/@game-buster/gbsdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 Core Features

- **Ultra-lightweight** - Only 38KB minified
- **5 simple methods** - `init()`, `showInterstitial()`, `showRewarded()`, `gameStarted()`, `gameEnded()`
- **Zero runtime dependencies** - Pure JavaScript, no external libs
- **VAST 4.x + Google IMA HTML5** - Industry standard video ads
- **Automatic configuration** - Config managed by GameBuster platform
- **Cross-platform** - Works in Unity WebGL, HTML5 games, and all major game engines
- **TypeScript support** - Full type definitions included

## 📦 Installation

### CDN (Recommended for most games)

```html
<script src="https://unpkg.com/@game-buster/gbsdk@latest/dist/gbsdk.js"></script>
```

### NPM/Yarn (For bundled projects)

```bash
npm install @game-buster/gbsdk
# or
yarn add @game-buster/gbsdk
```

## 🚀 Quick Start

```javascript
// Create SDK instance
const gbsdk = new GBSDK.GBSDK();

// 1. Initialize SDK (config is automatically loaded from GameBuster)
await gbsdk.init();

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

## 📚 API Reference

### Core Methods

#### `init(): Promise<void>`
Initialize the SDK. Configuration is automatically loaded from GameBuster platform.

```javascript
await gbsdk.init();
```

#### `showInterstitial(): Promise<ShowResult>`
Show an interstitial ad between levels or game sessions. Returns `{success: true/false, reason?: string}`.

```javascript
const result = await gbsdk.showInterstitial();
if (result.success) {
  // Continue to next level
}
```

#### `showRewarded(): Promise<ShowResult>`
Show a rewarded ad. Only returns success if user watches to completion.

```javascript
const result = await gbsdk.showRewarded();
if (result.success) {
  // Grant reward to player (coins, lives, etc.)
  player.addCoins(100);
}
```

#### `gameStarted(): void`
Track when a game session starts. Call this when the player starts playing.

```javascript
gbsdk.gameStarted();
```

#### `gameEnded(): void`
Track when a game session ends. Call this when the player finishes playing.

```javascript
gbsdk.gameEnded();
```

#### `canShow(kind: 'interstitial' | 'rewarded'): boolean`
Check if an ad can be shown (respects cooldowns and session caps).

```javascript
if (gbsdk.canShow('rewarded')) {
  // Show rewarded ad button
}
```

## 🎮 Platform Support

GBSDK provides official integrations for all major game engines:

| Platform | Status | Documentation |
|----------|--------|---------------|
| **Unity 2022+/Unity 6** | ✅ Ready | [Guide](./bridges/unity2022/README.md) |
| **Construct 3** | ✅ Ready | [Guide](./bridges/construct3/README.md) |
| **Godot 4.x** | ✅ Ready | [Guide](./bridges/godot/README.md) |
| **Cocos Creator 3.x** | ✅ Ready | [Guide](./bridges/cocos/README.md) |
| **Phaser 3** | ✅ Ready | [Guide](./bridges/phaser-npm/README.md) |
| **HTML5/JavaScript** | ✅ Ready | [Guide](./bridges/html5/README.md) |

## 🎮 Game Engine Integration Guides

### Unity WebGL

**Unity 2022+ / Unity 6**: See [Unity Integration Guide](./bridges/unity2022/README.md)

```csharp
// Unity C# example
using GameBuster;

public class AdManager : MonoBehaviour
{
    async void Start()
    {
        await GBSDK.Initialize();
        GBSDK.GameStarted();
    }

    public async void ShowRewardedAd()
    {
        var result = await GBSDK.ShowRewarded();
        if (result.success) {
            // Grant reward
            PlayerData.AddCoins(100);
        }
    }
}
```

### Construct 3

Install the addon from `bridges/construct3/` - See [Construct 3 Guide](./bridges/construct3/README.md)

The addon provides Actions, Conditions, and Expressions for easy integration without coding.

### Godot 4.x

Install the plugin from `bridges/godot/addons/gbsdk/` - See [Godot Guide](./bridges/godot/README.md)

```gdscript
extends Node

func _ready():
    GBSDK.connect("gbsdk_initialized", _on_gbsdk_ready)
    GBSDK.initialize_gbsdk()

func _on_gbsdk_ready():
    GBSDK.track_game_started()

func show_rewarded_ad():
    GBSDK.connect("rewarded_completed", _on_rewarded_done)
    GBSDK.show_rewarded()

func _on_rewarded_done(success: bool, reason: String):
    if success:
        grant_reward()
```

### Cocos Creator 3.x

Install the extension from `bridges/cocos/` - See [Cocos Creator Guide](./bridges/cocos/README.md)

```typescript
import { GBSDK } from './gbsdk-api/GBSDK';

async start() {
    await GBSDK.init();
    GBSDK.gameStarted();
}

async showRewardedAd() {
    const result = await GBSDK.showRewarded();
    if (result.success) {
        this.grantReward();
    }
}
```

### Phaser 3

Install via NPM: `npm install @game-buster/phaser-3` - See [Phaser 3 Guide](./bridges/phaser-npm/README.md)

```typescript
import { PhaserGBSDK } from '@game-buster/phaser-3';

class GameScene extends Phaser.Scene {
    private ads!: PhaserGBSDK;

    create() {
        this.ads = new PhaserGBSDK(this);
        this.ads.init();

        this.ads.on('initialized', () => {
            this.ads.gameStarted();
        });
    }

    async showRewardedAd() {
        const result = await this.ads.showRewarded();
        if (result.success) {
            this.player.addCoins(100);
        }
    }
}
```

### HTML5 Games (Vanilla JS)

See [HTML5 Integration Guide](./bridges/html5/README.md)

```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://unpkg.com/@game-buster/gbsdk@latest/dist/gbsdk.js"></script>
</head>
<body>
    <button onclick="showRewardedAd()">Watch Ad for Coins</button>

    <script>
        let gbsdk;

        async function initGame() {
            gbsdk = new GBSDK.GBSDK();
            await gbsdk.init();
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

## 🔧 Platform-Specific Considerations

### Unity WebGL
- **WebGL Only**: GBSDK only works in WebGL builds, not standalone/mobile
- **User Gesture**: First ad call must be from user interaction (button click)
- **Async/Await**: Use Unity's async/await with proper error handling

### Mobile Web Games
- **Autoplay Policies**: First ad requires user gesture on iOS Safari
- **Viewport**: Ads automatically scale to fit mobile screens

### Game Portals (Poki, CrazyGames, etc.)
- **Portal Integration**: GBSDK works seamlessly on game portals
- **Testing**: Always test on actual portal environment

## 🐛 Troubleshooting

### Common Issues

#### "Ad failed to load"
- Check network connectivity
- Ensure you called `init()` before showing ads
- Make sure the game is uploaded to GameBuster platform

#### "User gesture required"
- First ad call must be from user interaction (button click)
- Don't call ads automatically on page load

#### "Cooldown active"
- Respect cooldown periods between ads (default: 90 seconds)
- Use `gbsdk.canShow('interstitial')` to check availability

#### "Session cap reached"
- Don't exceed session limits (default: 20 ads per session)
- Session resets when user closes/reopens the game

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

## 🤝 Support

- **Documentation**: [Full integration guides](./bridges/)
- **Issues**: [GitHub Issues](https://github.com/game-buster/gbsdk/issues)
- **Platform**: [GameBuster Dashboard](https://game-buster.com)
