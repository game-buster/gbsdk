/**
 * Google IMA/VAST Adapter for GBSDK
 * Handles Google IMA integration with VAST 4.x support
 */

import type { Adapter, PlayCtx, GBEvent } from '../types.js';
import { loadScriptOnce, appendQuery } from '../utils/net.js';
import { calculate16x9Dimensions, getOverlayDimensions } from '../utils/dom.js';

// Google IMA SDK types (minimal declarations)
declare global {
  interface Window {
    google?: {
      ima: {
        AdDisplayContainer: new (videoElement: HTMLVideoElement, adContainer: HTMLElement) => any;
        AdsLoader: new () => any;
        AdsRequest: new () => any;
        AdsManager: any;
        AdEvent: {
          Type: {
            LOADED: string;
            STARTED: string;
            FIRST_QUARTILE: string;
            MIDPOINT: string;
            THIRD_QUARTILE: string;
            COMPLETE: string;
            SKIPPED: string;
            ALL_ADS_COMPLETED: string;
          };
        };
        AdErrorEvent: {
          Type: {
            AD_ERROR: string;
          };
        };
        AdsManagerLoadedEvent: {
          Type: {
            ADS_MANAGER_LOADED: string;
          };
        };
        ViewMode: {
          NORMAL: string;
          FULLSCREEN: string;
        };
        settings: {
          setVpaidMode: (mode: any) => void;
          VpaidMode: {
            DISABLED: any;
          };
        };
      };
    };
  }
}

const IMA_SDK_URL = 'https://imasdk.googleapis.com/js/sdkloader/ima3.js';

export class ImaVastAdapter implements Adapter {
  name = 'ImaVast';
  private adsLoader: any = null;
  private adsManager: any = null;
  private adDisplayContainer: any = null;
  private currentPlayCtx: PlayCtx | null = null;
  private playPromiseResolve: ((result: 'ok' | 'skipped' | 'no_fill' | 'error' | 'timeout') => void) | null = null;
  private playTimeout: number | null = null;

  /**
   * Load the Google IMA SDK
   */
  async load(): Promise<void> {
    await loadScriptOnce(IMA_SDK_URL);

    if (!window.google?.ima) {
      throw new Error('Google IMA SDK failed to load');
    }

    // Disable VPAID for better performance and security
    try {
      window.google.ima.settings.setVpaidMode(window.google.ima.settings.VpaidMode.DISABLED);
    } catch (error) {
      console.warn('GBSDK: Could not disable VPAID:', error);
    }
  }

  /**
   * Check if this adapter supports the given ad kind
   */
  supports(kind: 'interstitial' | 'rewarded'): boolean {
    return kind === 'interstitial' || kind === 'rewarded';
  }

  /**
   * Play an ad using the given tag URL and context
   */
  async play(tagUrl: string, ctx: PlayCtx): Promise<'ok' | 'skipped' | 'no_fill' | 'error' | 'timeout'> {
    return new Promise((resolve) => {
      this.currentPlayCtx = ctx;
      this.playPromiseResolve = resolve;

      if (ctx.debug) {
        console.log('ImaVastAdapter: Starting ad request', { tagUrl });
      }

      // Set up timeout (increased to 15 seconds)
      this.playTimeout = window.setTimeout(() => {
        this.handleTimeout();
      }, 15000);

      try {
        this.initializeAd(tagUrl, ctx);
      } catch (error) {
        this.cleanup();
        ctx.onEvent('error', { error: error instanceof Error ? error.message : 'Unknown error' });
        resolve('error');
      }
    });
  }

  /**
   * Initialize the ad display
   */
  private initializeAd(tagUrl: string, ctx: PlayCtx): void {
    const { mount, tc, debug } = ctx;

    // Create ad display container
    this.adDisplayContainer = new window.google!.ima.AdDisplayContainer(
      mount.video as HTMLVideoElement,
      mount.slot as HTMLElement
    );

    // CRITICAL: Initialize the ad display container
    // This must be called in a user gesture context
    try {
      this.adDisplayContainer.initialize();
      if (debug) {
        console.log('ImaVastAdapter: Ad display container initialized');
      }
    } catch (error) {
      if (debug) {
        console.error('ImaVastAdapter: Failed to initialize ad display container', error);
      }
    }

    // Create ads loader
    this.adsLoader = new window.google!.ima.AdsLoader();

    // Set up event listeners
    this.adsLoader.addEventListener(
      window.google!.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
      (event: any) => this.onAdsManagerLoaded(event),
      false
    );

    this.adsLoader.addEventListener(
      window.google!.ima.AdErrorEvent.Type.AD_ERROR,
      (event: any) => this.onAdError(event),
      false
    );

    // Build ad request with TCF parameters
    const adsRequest = new window.google!.ima.AdsRequest();
    adsRequest.adTagUrl = this.buildAdTagUrl(tagUrl, tc);

    // Set ad dimensions
    const overlayDims = getOverlayDimensions(mount.overlay);
    const videoDims = calculate16x9Dimensions(overlayDims.width, overlayDims.height);

    adsRequest.linearAdSlotWidth = videoDims.width;
    adsRequest.linearAdSlotHeight = videoDims.height;
    adsRequest.nonLinearAdSlotWidth = videoDims.width;
    adsRequest.nonLinearAdSlotHeight = Math.floor(videoDims.height * 0.3);

    if (debug) {
      console.log('GBSDK: IMA request:', {
        adTagUrl: adsRequest.adTagUrl,
        dimensions: videoDims,
      });
    }

    // Request ads
    this.adsLoader.requestAds(adsRequest);
  }

  /**
   * Build ad tag URL with TCF and other parameters
   */
  private buildAdTagUrl(baseUrl: string, tc?: { gdpr?: 0 | 1; tcString?: string; npa: 0 | 1 }): string {
    const params: Record<string, string | number> = {
      correlator: Date.now(),
    };

    if (tc) {
      if (tc.gdpr !== undefined) {
        params.gdpr = tc.gdpr;
      }
      if (tc.tcString) {
        params.gdpr_consent = tc.tcString;
      }
      if (tc.npa !== undefined) {
        params.npa = tc.npa;
      }
    }

    return appendQuery(baseUrl, params);
  }

  /**
   * Handle ads manager loaded event
   */
  private onAdsManagerLoaded(event: any): void {
    if (this.currentPlayCtx?.debug) {
      console.log('ImaVastAdapter: Ads manager loaded');
    }

    const adsRenderingSettings: any = {};
    adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;

    this.adsManager = event.getAdsManager(this.currentPlayCtx!.mount.video, adsRenderingSettings);

    // Set up ads manager event listeners
    this.adsManager.addEventListener(
      window.google!.ima.AdEvent.Type.LOADED,
      () => this.onAdEvent('loaded')
    );

    this.adsManager.addEventListener(
      window.google!.ima.AdEvent.Type.STARTED,
      () => this.onAdEvent('started')
    );

    this.adsManager.addEventListener(
      window.google!.ima.AdEvent.Type.FIRST_QUARTILE,
      () => this.onAdEvent('first_quartile')
    );

    this.adsManager.addEventListener(
      window.google!.ima.AdEvent.Type.MIDPOINT,
      () => this.onAdEvent('midpoint')
    );

    this.adsManager.addEventListener(
      window.google!.ima.AdEvent.Type.THIRD_QUARTILE,
      () => this.onAdEvent('third_quartile')
    );

    this.adsManager.addEventListener(
      window.google!.ima.AdEvent.Type.COMPLETE,
      () => this.onAdEvent('complete')
    );

    this.adsManager.addEventListener(
      window.google!.ima.AdEvent.Type.SKIPPED,
      () => this.onAdEvent('skipped')
    );

    this.adsManager.addEventListener(
      window.google!.ima.AdEvent.Type.ALL_ADS_COMPLETED,
      () => this.onAdEvent('all_completed')
    );

    this.adsManager.addEventListener(
      window.google!.ima.AdErrorEvent.Type.AD_ERROR,
      (event: any) => this.onAdError(event)
    );

    try {
      // Initialize the ads manager
      const overlayDims = getOverlayDimensions(this.currentPlayCtx!.mount.overlay);
      const videoDims = calculate16x9Dimensions(overlayDims.width, overlayDims.height);

      if (this.currentPlayCtx!.debug) {
        console.log('ImaVastAdapter: Initializing ads manager', {
          width: videoDims.width,
          height: videoDims.height
        });
      }

      this.adsManager.init(videoDims.width, videoDims.height, window.google!.ima.ViewMode.NORMAL);

      if (this.currentPlayCtx!.debug) {
        console.log('ImaVastAdapter: Starting ads manager');
      }

      this.adsManager.start();

      if (this.currentPlayCtx!.debug) {
        console.log('ImaVastAdapter: Ads manager started successfully');
      }
    } catch (error) {
      if (this.currentPlayCtx!.debug) {
        console.error('ImaVastAdapter: Failed to start ads manager', error);
      }
      this.onAdError({ getError: () => ({ getMessage: () => error instanceof Error ? error.message : 'Init error' }) });
    }
  }

  /**
   * Handle ad events
   */
  private onAdEvent(eventType: GBEvent): void {
    if (!this.currentPlayCtx) return;

    this.currentPlayCtx.onEvent(eventType);

    // Handle completion logic
    if (eventType === 'complete') {
      this.resolvePlay('ok');
    } else if (eventType === 'skipped') {
      // For rewarded ads, skipping means no reward
      if (this.currentPlayCtx.kind === 'rewarded') {
        this.resolvePlay('skipped');
      } else {
        // For interstitials, skipping is still considered successful
        this.resolvePlay('ok');
      }
    } else if (eventType === 'all_completed') {
      this.resolvePlay('ok');
    }
  }

  /**
   * Handle ad errors
   */
  private onAdError(event: any): void {
    const error = event.getError ? event.getError() : event;
    const message = error.getMessage ? error.getMessage() : '';
    const errorCode = error.getErrorCode ? error.getErrorCode() : 'unknown';
    const errorType = error.getType ? error.getType() : 'unknown';
    const vastErrorCode = error.getVastErrorCode ? error.getVastErrorCode() : null;
    const innerError = error.getInnerError ? error.getInnerError() : null;

    // If message is empty but we have error code, provide better message
    let errorMessage = message;
    if (!errorMessage && errorCode !== 'unknown') {
      errorMessage = `IMA Error ${errorCode}`;
    }
    if (!errorMessage && vastErrorCode) {
      errorMessage = `VAST Error ${vastErrorCode}`;
    }
    if (!errorMessage) {
      errorMessage = 'Unknown ad error - VAST response may be empty or invalid';
    }

    if (this.currentPlayCtx) {
      if (this.currentPlayCtx.debug) {
        console.error('ImaVastAdapter: Ad error', {
          message: errorMessage,
          originalMessage: message,
          errorCode,
          errorType,
          vastErrorCode,
          innerError,
          fullError: error
        });
      }
      this.currentPlayCtx.onEvent('error', {
        error: errorMessage,
        errorCode,
        errorType
      });
    }

    this.resolvePlay('error');
  }

  /**
   * Handle timeout
   */
  private handleTimeout(): void {
    if (this.currentPlayCtx) {
      this.currentPlayCtx.onEvent('timeout');
    }
    this.resolvePlay('timeout');
  }

  /**
   * Resolve the play promise and cleanup
   */
  private resolvePlay(result: 'ok' | 'skipped' | 'no_fill' | 'error' | 'timeout'): void {
    if (this.playPromiseResolve) {
      this.playPromiseResolve(result);
      this.playPromiseResolve = null;
    }
    this.cleanup();
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.playTimeout) {
      clearTimeout(this.playTimeout);
      this.playTimeout = null;
    }

    if (this.adsManager) {
      try {
        this.adsManager.destroy();
      } catch (error) {
        // Ignore cleanup errors
      }
      this.adsManager = null;
    }

    if (this.adsLoader) {
      try {
        this.adsLoader.destroy();
      } catch (error) {
        // Ignore cleanup errors
      }
      this.adsLoader = null;
    }

    this.adDisplayContainer = null;
    this.currentPlayCtx = null;
  }

  /**
   * Destroy the adapter
   */
  destroy(): void {
    this.cleanup();
  }
}
