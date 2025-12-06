/**
 * GameBuster SDK - Cocos Creator Integration
 * TypeScript wrapper for GBSDK
 */

export class GBSDK {
    private static instance: any = null;
    private static isInitialized: boolean = false;

    /**
     * Initialize GBSDK
     */
    public static async init(config: any = {}): Promise<void> {
        if (this.isInitialized) {
            console.warn('GBSDK already initialized');
            return;
        }

        // @ts-ignore
        if (typeof window.GBSDK === 'undefined') {
            throw new Error('GBSDK not found. Include the GBSDK script in your HTML.');
        }

        // @ts-ignore
        this.instance = new window.GBSDK.GBSDK();
        await this.instance.init(config);
        this.isInitialized = true;
        console.log('GBSDK initialized successfully');
    }

    /**
     * Show interstitial ad
     */
    public static async showInterstitial(): Promise<{ success: boolean; reason?: string }> {
        if (!this.isInitialized || !this.instance) {
            console.error('GBSDK not initialized');
            return { success: false, reason: 'not_initialized' };
        }

        try {
            const result = await this.instance.showInterstitial();
            return result;
        } catch (error) {
            console.error('Interstitial ad error:', error);
            return { success: false, reason: 'error' };
        }
    }

    /**
     * Show rewarded ad
     */
    public static async showRewarded(): Promise<{ success: boolean; reason?: string }> {
        if (!this.isInitialized || !this.instance) {
            console.error('GBSDK not initialized');
            return { success: false, reason: 'not_initialized' };
        }

        try {
            const result = await this.instance.showRewarded();
            return result;
        } catch (error) {
            console.error('Rewarded ad error:', error);
            return { success: false, reason: 'error' };
        }
    }

    /**
     * Track game started
     */
    public static gameStarted(): void {
        if (!this.isInitialized || !this.instance) {
            console.warn('GBSDK not initialized');
            return;
        }

        this.instance.gameStarted();
    }

    /**
     * Track game ended
     */
    public static gameEnded(): void {
        if (!this.isInitialized || !this.instance) {
            console.warn('GBSDK not initialized');
            return;
        }

        this.instance.gameEnded();
    }

    /**
     * Check if ad can be shown
     */
    public static canShow(adType: 'interstitial' | 'rewarded'): boolean {
        if (!this.isInitialized || !this.instance) {
            return false;
        }

        return this.instance.canShow(adType);
    }

    /**
     * Destroy GBSDK
     */
    public static destroy(): void {
        if (!this.isInitialized || !this.instance) {
            return;
        }

        this.instance.destroy();
        this.instance = null;
        this.isInitialized = false;
    }
}

