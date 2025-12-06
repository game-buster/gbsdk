# GameBuster SDK - Cocos Creator Extension

Production-ready in-game ads SDK for Cocos Creator with VAST 4.x + Google IMA HTML5 support.

## Compatibility

- **Cocos Creator 3.x**: ✅ Fully supported
- **Cocos Creator 2.x**: ⚠️ May require adjustments
- **Export Target**: Web/HTML5 only

## Installation

1. Download the `gbsdk` extension folder
2. Copy it to your project's `extensions/` directory
3. In Cocos Creator, go to Extensions → Extension Manager
4. Find "GameBuster SDK" and enable it
5. Restart Cocos Creator

The extension will automatically copy the GBSDK API files to `assets/gbsdk-api/`.

## Quick Start

### 1. Include GBSDK Script

Add this to your `index.html` or build template:

```html
<script src="https://cdn.jsdelivr.net/npm/@gamebuster/gbsdk@latest/dist/gbsdk.js"></script>
```

### 2. Initialize in Your Game

```typescript
import { GBSDK } from './gbsdk-api/GBSDK';

// In your game initialization
async start() {
    try {
        await GBSDK.init({ debug: true });
        console.log('GBSDK ready!');
        
        // Track game start
        GBSDK.gameStarted();
    } catch (error) {
        console.error('GBSDK init failed:', error);
    }
}
```

### 3. Show Interstitial Ads

```typescript
async showLevelCompleteAd() {
    if (GBSDK.canShow('interstitial')) {
        const result = await GBSDK.showInterstitial();
        
        if (result.success) {
            console.log('Ad completed successfully');
            this.loadNextLevel();
        } else {
            console.log('Ad failed:', result.reason);
            this.loadNextLevel(); // Don't punish player
        }
    } else {
        this.loadNextLevel();
    }
}
```

### 4. Show Rewarded Ads

```typescript
async showRewardedAd() {
    if (GBSDK.canShow('rewarded')) {
        const result = await GBSDK.showRewarded();
        
        if (result.success) {
            console.log('Player earned reward!');
            this.grantReward();
        } else {
            console.log('Rewarded ad failed:', result.reason);
        }
    } else {
        console.log('Rewarded ad not available');
    }
}

grantReward() {
    this.playerCoins += 100;
    this.updateUI();
}
```

### 5. Track Gameplay

```typescript
startGameplay() {
    GBSDK.gameStarted();
    // Your game logic
}

endGameplay() {
    GBSDK.gameEnded();
    // Show game over screen
}
```

## API Reference

### Methods

- `GBSDK.init(config?)` - Initialize SDK (returns Promise)
- `GBSDK.showInterstitial()` - Show interstitial ad (returns Promise)
- `GBSDK.showRewarded()` - Show rewarded ad (returns Promise)
- `GBSDK.gameStarted()` - Track gameplay start
- `GBSDK.gameEnded()` - Track gameplay end
- `GBSDK.canShow(adType)` - Check if ad can be shown
- `GBSDK.destroy()` - Clean up SDK resources

### Configuration

```typescript
const config = {
    debug: true,
    configUrl: "https://your-config-url.json",
    cooldownSec: 90,
    sessionCap: 20
};

await GBSDK.init(config);
```

## Build Settings

When building for Web:

1. Make sure the GBSDK script is included in your HTML template
2. Test in a real browser (not just preview)
3. Check browser console for any errors

## Support

- GitHub: https://github.com/game-buster/gbsdk
- Issues: https://github.com/game-buster/gbsdk/issues
- Documentation: https://github.com/game-buster/gbsdk#readme

## License

MIT License - See LICENSE file for details

