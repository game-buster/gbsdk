/**
 * @gamebuster/phaser-3
 * Phaser 3 integration for GameBuster SDK
 */

import type Phaser from 'phaser';

export interface GBSDKConfig {
  configUrl?: string;
  debug?: boolean;
  cooldownSec?: number;
  sessionCap?: number;
  [key: string]: any;
}

export interface AdResult {
  success: boolean;
  reason?: string;
  type?: string;
}

export class PhaserGBSDK {
  private scene: Phaser.Scene;
  private gbsdk: any = null;
  private isInitialized: boolean = false;
  private events: Phaser.Events.EventEmitter;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.events = new Phaser.Events.EventEmitter();
  }

  /**
   * Initialize GBSDK
   */
  async init(config: GBSDKConfig = {}): Promise<boolean> {
    try {
      // @ts-ignore - GBSDK is loaded globally
      if (typeof GBSDK === 'undefined') {
        console.error('GBSDK not found. Include the GBSDK script in your HTML.');
        return false;
      }

      // @ts-ignore
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
   */
  async showInterstitial(): Promise<AdResult> {
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
   */
  async showRewarded(): Promise<AdResult> {
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
  gameStarted(): void {
    if (!this.isInitialized) return;
    this.gbsdk.gameStarted();
    this.events.emit('game_started');
  }

  /**
   * Track game ended
   */
  gameEnded(): void {
    if (!this.isInitialized) return;
    this.gbsdk.gameEnded();
    this.events.emit('game_ended');
  }

  /**
   * Check if ad can be shown
   */
  canShow(adType: 'interstitial' | 'rewarded'): boolean {
    if (!this.isInitialized) return false;
    return this.gbsdk.canShow(adType);
  }

  /**
   * Add event listener
   */
  on(event: string, callback: Function, context?: any): this {
    this.events.on(event, callback, context);
    return this;
  }

  /**
   * Remove event listener
   */
  off(event: string, callback?: Function, context?: any): this {
    this.events.off(event, callback, context);
    return this;
  }

  /**
   * Destroy GBSDK
   */
  destroy(): void {
    if (this.gbsdk) {
      this.gbsdk.destroy();
    }
    this.events.destroy();
    this.isInitialized = false;
  }
}

export default PhaserGBSDK;

