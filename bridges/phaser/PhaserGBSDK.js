/**
 * Phaser 3 Integration for GBSDK
 * Easy-to-use wrapper for integrating GBSDK into Phaser 3 games
 */

class PhaserGBSDK {
    constructor(scene) {
        this.scene = scene;
        this.gbsdk = null;
        this.isInitialized = false;
        this.events = new Phaser.Events.EventEmitter();
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
            this.events.emit('initialized');
            
            console.log('PhaserGBSDK initialized successfully');
            return true;
        } catch (error) {
            console.error('PhaserGBSDK initialization failed:', error);
            this.events.emit('error', error);
            return false;
        }
    }

    /**
     * Show interstitial ad
     * @returns {Promise<Object>} - Ad result
     */
    async showInterstitial() {
        if (!this.isInitialized) {
            console.warn('PhaserGBSDK not initialized');
            return { success: false, reason: 'not_initialized' };
        }

        try {
            // Pause game
            this.scene.scene.pause();
            this.events.emit('ad_started', 'interstitial');

            const result = await this.gbsdk.showInterstitial();
            
            // Resume game
            this.scene.scene.resume();
            this.events.emit('ad_completed', 'interstitial', result);

            return result;
        } catch (error) {
            console.error('Interstitial ad error:', error);
            this.scene.scene.resume();
            this.events.emit('ad_error', 'interstitial', error);
            return { success: false, reason: 'error' };
        }
    }

    /**
     * Show rewarded ad
     * @returns {Promise<Object>} - Ad result
     */
    async showRewarded() {
        if (!this.isInitialized) {
            console.warn('PhaserGBSDK not initialized');
            return { success: false, reason: 'not_initialized' };
        }

        try {
            // Pause game
            this.scene.scene.pause();
            this.events.emit('ad_started', 'rewarded');

            const result = await this.gbsdk.showRewarded();
            
            // Resume game
            this.scene.scene.resume();
            this.events.emit('ad_completed', 'rewarded', result);

            if (result.success) {
                this.events.emit('reward_granted');
            }

            return result;
        } catch (error) {
            console.error('Rewarded ad error:', error);
            this.scene.scene.resume();
            this.events.emit('ad_error', 'rewarded', error);
            return { success: false, reason: 'error' };
        }
    }

    /**
     * Track game started
     */
    gameStarted() {
        if (!this.isInitialized) return;
        this.gbsdk.gameStarted();
        this.events.emit('game_started');
    }

    /**
     * Track game ended
     */
    gameEnded() {
        if (!this.isInitialized) return;
        this.gbsdk.gameEnded();
        this.events.emit('game_ended');
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
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        this.events.on(event, callback);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
        this.events.off(event, callback);
    }

    /**
     * Destroy GBSDK
     */
    destroy() {
        if (this.gbsdk) {
            this.gbsdk.destroy();
        }
        this.events.destroy();
        this.isInitialized = false;
    }
}

// Example usage in Phaser 3 scene:
/*
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Initialize GBSDK
        this.ads = new PhaserGBSDK(this);
        this.ads.init({
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

        // Create UI buttons
        this.createAdButtons();
    }

    createAdButtons() {
        // Interstitial button
        const interstitialBtn = this.add.text(100, 100, 'Show Interstitial', {
            backgroundColor: '#0066cc',
            padding: { x: 10, y: 5 }
        }).setInteractive();

        interstitialBtn.on('pointerdown', async () => {
            const result = await this.ads.showInterstitial();
            if (result.success) {
                console.log('Interstitial completed');
            }
        });

        // Rewarded button
        const rewardedBtn = this.add.text(100, 150, 'Watch Ad for Reward', {
            backgroundColor: '#cc6600',
            padding: { x: 10, y: 5 }
        }).setInteractive();

        rewardedBtn.on('pointerdown', async () => {
            const result = await this.ads.showRewarded();
            if (result.success) {
                this.grantReward();
            }
        });
    }

    grantReward() {
        // Grant reward to player
        this.player.coins += 100;
        console.log('Reward granted: +100 coins');
    }

    shutdown() {
        this.ads.gameEnded();
        this.ads.destroy();
    }
}
*/

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhaserGBSDK;
}

// Global export
if (typeof window !== 'undefined') {
    window.PhaserGBSDK = PhaserGBSDK;
}
