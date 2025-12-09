# GameBuster SDK - HTML5/JavaScript

Production-ready in-game ads SDK for vanilla JavaScript/HTML5 games with VAST 4.x + Google IMA support.

## Installation

### CDN (Recommended)

```html
<script src="https://cdn.game-buster.com/gbsdk.js"></script>
```

### NPM

```bash
npm install @game-buster/gbsdk
```

Then in your HTML:

```html
<script src="node_modules/@game-buster/gbsdk/dist/gbsdk.js"></script>
```

## Quick Start

### 1. Include the Script

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Game</title>
</head>
<body>
    <canvas id="gameCanvas"></canvas>

    <!-- Include GBSDK -->
    <script src="https://cdn.game-buster.com/gbsdk.js"></script>

    <!-- Your game code -->
    <script src="game.js"></script>
</body>
</html>
```

### 2. Initialize in Your Game

```javascript
// Create GBSDK instance
const gbsdk = new GBSDK.GBSDK();

// Initialize (config is automatically loaded from GameBuster)
gbsdk.init()
    .then(() => {
        console.log('GBSDK ready!');

        // Track game start
        gbsdk.gameStarted();

        // Start your game
        startGame();
    })
    .catch(error => {
        console.error('GBSDK init failed:', error);
    });
```

### 3. Show Ads

```javascript
// Show interstitial ad (between levels)
async function showLevelCompleteAd() {
    if (gbsdk.canShow('interstitial')) {
        const result = await gbsdk.showInterstitial();

        if (result.success) {
            console.log('Ad completed');
            loadNextLevel();
        } else {
            console.log('Ad failed:', result.reason);
            loadNextLevel(); // Don't punish player
        }
    } else {
        loadNextLevel();
    }
}

// Show rewarded ad (for rewards)
async function showRewardedAd() {
    if (gbsdk.canShow('rewarded')) {
        const result = await gbsdk.showRewarded();

        if (result.success) {
            console.log('Player earned reward!');
            grantReward();
        } else {
            console.log('Rewarded ad failed:', result.reason);
        }
    } else {
        console.log('Rewarded ad not available');
    }
}

function grantReward() {
    playerCoins += 100;
    updateUI();
}
```

### 4. Track Gameplay

```javascript
function startGame() {
    gbsdk.gameStarted();
    // Your game logic
}

function gameOver() {
    gbsdk.gameEnded();
    // Show game over screen
}
```

## Complete Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>My HTML5 Game</title>
    <style>
        body { margin: 0; padding: 20px; font-family: Arial; }
        canvas { border: 1px solid #ccc; }
        button { padding: 10px 20px; margin: 10px; font-size: 16px; }
    </style>
</head>
<body>
    <h1>My Game</h1>
    <canvas id="gameCanvas" width="800" height="600"></canvas>
    <br>
    <button id="interstitialBtn">Next Level (Interstitial)</button>
    <button id="rewardedBtn">Watch Ad for Coins (Rewarded)</button>
    <p>Coins: <span id="coins">0</span></p>

    <script src="https://cdn.game-buster.com/gbsdk.js"></script>
    <script>
        let coins = 0;
        const gbsdk = new GBSDK.GBSDK();

        // Initialize GBSDK (config automatically loaded from GameBuster platform)
        gbsdk.init()
            .then(() => {
                console.log('GBSDK ready!');
                gbsdk.gameStarted();
            })
            .catch(error => {
                console.error('GBSDK init failed:', error);
            });

        // Interstitial button
        document.getElementById('interstitialBtn').addEventListener('click', async () => {
            if (gbsdk.canShow('interstitial')) {
                const result = await gbsdk.showInterstitial();
                if (result.success) {
                    console.log('Interstitial completed');
                }
            }
        });

        // Rewarded button
        document.getElementById('rewardedBtn').addEventListener('click', async () => {
            if (gbsdk.canShow('rewarded')) {
                const result = await gbsdk.showRewarded();
                if (result.success) {
                    coins += 100;
                    document.getElementById('coins').textContent = coins;
                    console.log('Reward granted: +100 coins');
                }
            }
        });

        // Your game code here
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        function gameLoop() {
            // Your game rendering
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillText('Game running...', 10, 30);
            requestAnimationFrame(gameLoop);
        }

        gameLoop();
    </script>
</body>
</html>
```

## API Reference

### Initialization

```javascript
const gbsdk = new GBSDK.GBSDK();
await gbsdk.init();
```

Configuration is automatically loaded from GameBuster platform based on your game's URL and metadata.

### Methods

- `init()` - Initialize SDK (returns Promise)
- `showInterstitial()` - Show interstitial ad (returns Promise)
- `showRewarded()` - Show rewarded ad (returns Promise)
- `gameStarted()` - Track gameplay start
- `gameEnded()` - Track gameplay end
- `canShow(adType)` - Check if ad can be shown
- `destroy()` - Clean up SDK resources

## Features

- ✅ **Zero Configuration**: Automatic setup, no manual config needed
- ✅ **VAST 4.x Support**: Industry-standard video ads
- ✅ **Google IMA Integration**: Premium ad quality
- ✅ **Waterfall Optimization**: Automatic fallback between ad networks
- ✅ **Smart Cooldowns**: Prevents ad fatigue (90 seconds default)
- ✅ **Session Caps**: Limits ads per session (20 ads default)
- ✅ **No Dependencies**: Pure vanilla JavaScript

## Browser Support

- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Mobile browsers: ✅

## Best Practices

### User Experience

1. **Always check `canShow()` before showing ads**
   ```javascript
   if (gbsdk.canShow('rewarded')) {
       await gbsdk.showRewarded();
   }
   ```

2. **Don't punish players for ad failures**
   ```javascript
   const result = await gbsdk.showInterstitial();
   loadNextLevel(); // Continue regardless of ad result
   ```

3. **Show rewarded ads from user interaction**
   ```javascript
   rewardButton.onclick = async () => {
       const result = await gbsdk.showRewarded();
       if (result.success) {
           grantReward();
       }
   };
   ```

### Game Integration

1. **Track game sessions**
   ```javascript
   // When game starts
   gbsdk.gameStarted();

   // When game ends
   gbsdk.gameEnded();
   ```

2. **Show interstitials at natural breaks**
   - Between levels
   - After game over
   - When returning to menu

3. **Use rewarded ads for optional benefits**
   - Extra coins/lives
   - Power-ups
   - Unlocking content

## Support

- GitHub: https://github.com/game-buster/gbsdk
- Issues: https://github.com/game-buster/gbsdk/issues
- Documentation: https://github.com/game-buster/gbsdk#readme
- Platform: https://game-buster.com

## License

MIT
