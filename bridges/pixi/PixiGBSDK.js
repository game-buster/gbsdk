/**
 * Pixi.js Integration for GBSDK
 * Easy-to-use wrapper for integrating GBSDK into Pixi.js games
 */

class PixiGBSDK extends PIXI.utils.EventEmitter {
    constructor(app) {
        super();
        this.app = app;
        this.gbsdk = null;
        this.isInitialized = false;
        this.isPaused = false;
        this.pausedTickers = [];
    }

    /**
     * Initialize GBSDK
     * @param {Object} config - GBSDK configuration
     * @returns {Promise<boolean>} - Success status
     */
    async init(config = {}) {
        try {
            if (typeof GBSDK === 'undefined') {
                console.error('GBSDK not found. Include the GBSDK script in your HTML.');
                return false;
            }

            this.gbsdk = new GBSDK.GBSDK();
            await this.gbsdk.init(config);
            
            this.isInitialized = true;
            this.emit('initialized');
            
            console.log('PixiGBSDK initialized successfully');
            return true;
        } catch (error) {
            console.error('PixiGBSDK initialization failed:', error);
            this.emit('error', error);
            return false;
        }
    }

    /**
     * Show interstitial ad
     * @returns {Promise<Object>} - Ad result
     */
    async showInterstitial() {
        if (!this.isInitialized) {
            console.warn('PixiGBSDK not initialized');
            return { success: false, reason: 'not_initialized' };
        }

        try {
            // Pause game
            this.pauseGame();
            this.emit('ad_started', 'interstitial');

            const result = await this.gbsdk.showInterstitial();
            
            // Resume game
            this.resumeGame();
            this.emit('ad_completed', 'interstitial', result);

            return result;
        } catch (error) {
            console.error('Interstitial ad error:', error);
            this.resumeGame();
            this.emit('ad_error', 'interstitial', error);
            return { success: false, reason: 'error' };
        }
    }

    /**
     * Show rewarded ad
     * @returns {Promise<Object>} - Ad result
     */
    async showRewarded() {
        if (!this.isInitialized) {
            console.warn('PixiGBSDK not initialized');
            return { success: false, reason: 'not_initialized' };
        }

        try {
            // Pause game
            this.pauseGame();
            this.emit('ad_started', 'rewarded');

            const result = await this.gbsdk.showRewarded();
            
            // Resume game
            this.resumeGame();
            this.emit('ad_completed', 'rewarded', result);

            if (result.success) {
                this.emit('reward_granted');
            }

            return result;
        } catch (error) {
            console.error('Rewarded ad error:', error);
            this.resumeGame();
            this.emit('ad_error', 'rewarded', error);
            return { success: false, reason: 'error' };
        }
    }

    /**
     * Track game started
     */
    gameStarted() {
        if (!this.isInitialized) return;
        this.gbsdk.gameStarted();
        this.emit('game_started');
    }

    /**
     * Track game ended
     */
    gameEnded() {
        if (!this.isInitialized) return;
        this.gbsdk.gameEnded();
        this.emit('game_ended');
    }

    /**
     * Check if ad can be shown
     * @param {string} adType - 'interstitial' or 'rewarded'
     * @returns {boolean}
     */
    canShow(adType) {
        if (!this.isInitialized) return false;
        return this.gbsdk.canShow(adType);
    }

    /**
     * Pause the game (stop all tickers)
     */
    pauseGame() {
        if (this.isPaused) return;
        
        this.isPaused = true;
        this.pausedTickers = [];

        // Pause main app ticker
        if (this.app.ticker) {
            this.app.ticker.stop();
            this.pausedTickers.push(this.app.ticker);
        }

        // Pause shared ticker
        if (PIXI.Ticker.shared) {
            PIXI.Ticker.shared.stop();
            this.pausedTickers.push(PIXI.Ticker.shared);
        }

        this.emit('game_paused');
    }

    /**
     * Resume the game (restart all tickers)
     */
    resumeGame() {
        if (!this.isPaused) return;
        
        this.isPaused = false;

        // Resume all paused tickers
        this.pausedTickers.forEach(ticker => {
            if (ticker && ticker.start) {
                ticker.start();
            }
        });

        this.pausedTickers = [];
        this.emit('game_resumed');
    }

    /**
     * Create ad button helper
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} text - Button text
     * @param {Function} onClick - Click handler
     * @returns {PIXI.Container} - Button container
     */
    createAdButton(x, y, text, onClick) {
        const button = new PIXI.Container();
        button.x = x;
        button.y = y;
        button.interactive = true;
        button.buttonMode = true;

        // Background
        const bg = new PIXI.Graphics();
        bg.beginFill(0x0066cc);
        bg.drawRoundedRect(0, 0, 200, 50, 5);
        bg.endFill();
        button.addChild(bg);

        // Text
        const buttonText = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xffffff,
            align: 'center'
        });
        buttonText.anchor.set(0.5);
        buttonText.x = 100;
        buttonText.y = 25;
        button.addChild(buttonText);

        // Click handler
        button.on('pointerdown', onClick);

        // Hover effects
        button.on('pointerover', () => {
            bg.tint = 0xcccccc;
        });

        button.on('pointerout', () => {
            bg.tint = 0xffffff;
        });

        return button;
    }

    /**
     * Destroy GBSDK
     */
    destroy() {
        if (this.gbsdk) {
            this.gbsdk.destroy();
        }
        this.removeAllListeners();
        this.isInitialized = false;
    }
}

// Example usage in Pixi.js:
/*
class Game {
    constructor() {
        this.app = new PIXI.Application({
            width: 800,
            height: 600,
            backgroundColor: 0x1099bb
        });
        document.body.appendChild(this.app.view);

        this.ads = new PixiGBSDK(this.app);
        this.init();
    }

    async init() {
        // Initialize GBSDK
        await this.ads.init({
            configUrl: 'https://your-config-url.json',
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

        this.setupGame();
    }

    setupGame() {
        // Create ad buttons
        const interstitialBtn = this.ads.createAdButton(50, 50, 'Show Interstitial', async () => {
            const result = await this.ads.showInterstitial();
            if (result.success) {
                console.log('Interstitial completed');
            }
        });
        this.app.stage.addChild(interstitialBtn);

        const rewardedBtn = this.ads.createAdButton(50, 120, 'Watch Ad for Reward', async () => {
            const result = await this.ads.showRewarded();
            if (result.success) {
                this.grantReward();
            }
        });
        this.app.stage.addChild(rewardedBtn);

        // Game objects
        this.createGameObjects();
    }

    createGameObjects() {
        // Create your game sprites, animations, etc.
        const bunny = PIXI.Sprite.from('bunny.png');
        bunny.anchor.set(0.5);
        bunny.x = this.app.screen.width / 2;
        bunny.y = this.app.screen.height / 2;
        this.app.stage.addChild(bunny);

        // Animate bunny
        this.app.ticker.add(() => {
            bunny.rotation += 0.01;
        });
    }

    grantReward() {
        // Grant reward to player
        console.log('Reward granted: +100 coins');
        // Update UI, save data, etc.
    }
}

// Start the game
const game = new Game();
*/

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PixiGBSDK;
}

// Global export
if (typeof window !== 'undefined') {
    window.PixiGBSDK = PixiGBSDK;
}
