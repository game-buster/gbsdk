# GameBuster SDK - Construct 3 Plugin

Production-ready in-game ads SDK for Construct 3 with VAST 4.x + Google IMA HTML5 support.

## Installation

1. Download the plugin folder
2. In Construct 3, go to Menu → View → Addon Manager
3. Click "Install new addon" and select the folder
4. Restart Construct 3

## Quick Start

### 1. Add the Plugin to Your Project

1. In your project, right-click in the layout
2. Insert new object → GameBuster SDK
3. Add it to your first layout (it's a global singleton)

### 2. Initialize the SDK

In your first event sheet:

```
On start of layout
→ GameBuster SDK: Initialize SDK (debug: false)
```

### 3. Show Ads

**Interstitial Ad (between levels):**
```
On button clicked
→ GameBuster SDK: Show interstitial ad "level_complete"

On interstitial complete "level_complete"
→ System: Go to next layout
```

**Rewarded Ad (for rewards):**
```
On button clicked
→ GameBuster SDK: Show rewarded ad "extra_coins"

On rewarded complete "extra_coins"
→ If Last ad success
  → Add 100 to coins
```

### 4. Track Gameplay

```
On gameplay start
→ GameBuster SDK: Track game started

On game over
→ GameBuster SDK: Track game ended
```

## Features

- ✅ **Zero Configuration**: Auto-detects game metadata
- ✅ **VAST 4.x Support**: Industry-standard video ads
- ✅ **Google IMA Integration**: Premium ad quality
- ✅ **Waterfall Optimization**: Automatic fallback between ad networks
- ✅ **Smart Cooldowns**: Prevents ad fatigue
- ✅ **Session Caps**: Limits ads per session
- ✅ **Preview Mode**: Works in Construct 3 preview

## Conditions

- **Is initialized**: Check if SDK is ready
- **On interstitial complete**: Triggered when interstitial finishes
- **On rewarded complete**: Triggered when rewarded ad finishes
- **Last ad success**: Check if last ad was successful
- **Can show ad**: Check if ad can be shown (respects cooldown)

## Actions

- **Initialize SDK**: Initialize the SDK (call once at start)
- **Show interstitial**: Show an interstitial ad
- **Show rewarded**: Show a rewarded ad
- **Track game started**: Notify SDK that gameplay started
- **Track game ended**: Notify SDK that gameplay ended

## Expressions

- **LastAdSuccess**: Returns 1 if successful, 0 if failed
- **LastAdReason**: Returns failure reason (if any)
- **SDKVersion**: Returns SDK version
- **LastError**: Returns last error message

## HTML Export Setup

Make sure your exported HTML includes the GBSDK script. The plugin automatically loads it from CDN, but you can also include it manually:

```html
<script src="https://cdn.jsdelivr.net/npm/@gamebuster/gbsdk@latest/dist/gbsdk.js"></script>
```

## Support

- GitHub: https://github.com/game-buster/gbsdk
- Issues: https://github.com/game-buster/gbsdk/issues

## License

MIT License - See LICENSE file for details

