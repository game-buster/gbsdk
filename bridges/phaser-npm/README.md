# @gamebuster/phaser-3

Phaser 3 integration for GameBuster SDK - Production-ready in-game ads with VAST 4.x + Google IMA support.

## Installation

```bash
npm install @gamebuster/phaser-3
# or
yarn add @gamebuster/phaser-3
```

## Setup

### 1. Include GBSDK Script

Add this to your `index.html`:

```html
<script src="https://cdn.game-buster.com/gbsdk.js"></script>
```

### 2. Import in Your Game

```typescript
import { PhaserGBSDK } from '@gamebuster/phaser-3';

class GameScene extends Phaser.Scene {
    private ads!: PhaserGBSDK;

    create() {
        // Initialize GBSDK
        this.ads = new PhaserGBSDK(this);
        this.ads.init({
            debug: true
        });

        // Listen to events
        this.ads.on('initialized', () => {
            console.log('Ads ready!');
            this.ads.gameStarted();
        });

        this.ads.on('reward_granted', () => {
            this.grantReward();
        });
    }
}
```

## Usage

### Show Interstitial Ad

```typescript
async showLevelCompleteAd() {
    if (this.ads.canShow('interstitial')) {
        const result = await this.ads.showInterstitial();
        
        if (result.success) {
            console.log('Ad completed');
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

### Show Rewarded Ad

```typescript
async showRewardedAd() {
    if (this.ads.canShow('rewarded')) {
        const result = await this.ads.showRewarded();
        
        if (result.success) {
            this.grantReward();
        }
    }
}

grantReward() {
    this.player.coins += 100;
    console.log('Reward granted: +100 coins');
}
```

### Track Gameplay

```typescript
startGame() {
    this.ads.gameStarted();
    // Your game logic
}

gameOver() {
    this.ads.gameEnded();
    // Show game over screen
}
```

## API

### Constructor

```typescript
new PhaserGBSDK(scene: Phaser.Scene)
```

### Methods

- `init(config?)` - Initialize SDK
- `showInterstitial()` - Show interstitial ad
- `showRewarded()` - Show rewarded ad
- `gameStarted()` - Track gameplay start
- `gameEnded()` - Track gameplay end
- `canShow(adType)` - Check if ad can be shown
- `on(event, callback)` - Add event listener
- `off(event, callback)` - Remove event listener
- `destroy()` - Clean up resources

### Events

- `initialized` - SDK ready
- `ad_started` - Ad playback started
- `ad_completed` - Ad playback completed
- `ad_error` - Ad error occurred
- `reward_granted` - Player earned reward
- `game_started` - Gameplay started
- `game_ended` - Gameplay ended

### Configuration

```typescript
interface GBSDKConfig {
  configUrl?: string;
  debug?: boolean;
  cooldownSec?: number;
  sessionCap?: number;
}
```

## Features

- ✅ **Auto Pause/Resume**: Automatically pauses your Phaser scene during ads
- ✅ **Event System**: Built on Phaser's EventEmitter
- ✅ **TypeScript**: Full TypeScript support
- ✅ **Zero Config**: Works out of the box
- ✅ **Smart Cooldowns**: Prevents ad fatigue
- ✅ **Session Caps**: Limits ads per session

## Example

```typescript
import Phaser from 'phaser';
import { PhaserGBSDK } from '@gamebuster/phaser-3';

class GameScene extends Phaser.Scene {
    private ads!: PhaserGBSDK;
    private coins: number = 0;

    create() {
        // Initialize ads
        this.ads = new PhaserGBSDK(this);
        this.ads.init({ debug: true });

        this.ads.on('initialized', () => {
            this.ads.gameStarted();
        });

        // Create UI
        this.createButtons();
    }

    createButtons() {
        // Interstitial button
        const interstitialBtn = this.add.text(100, 100, 'Next Level', {
            backgroundColor: '#0066cc',
            padding: { x: 10, y: 5 }
        }).setInteractive();

        interstitialBtn.on('pointerdown', async () => {
            const result = await this.ads.showInterstitial();
            if (result.success) {
                this.scene.start('NextLevel');
            }
        });

        // Rewarded button
        const rewardedBtn = this.add.text(100, 150, 'Watch Ad (+100 coins)', {
            backgroundColor: '#cc6600',
            padding: { x: 10, y: 5 }
        }).setInteractive();

        rewardedBtn.on('pointerdown', async () => {
            const result = await this.ads.showRewarded();
            if (result.success) {
                this.coins += 100;
                this.updateCoinsText();
            }
        });
    }

    shutdown() {
        this.ads.gameEnded();
        this.ads.destroy();
    }
}
```

## License

MIT

