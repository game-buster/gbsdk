/**
 * GBSDK - GameBuster Ads SDK
 * Production-ready, zero-dependency in-game ads SDK
 */

import type {
  GBInit,
  ShowOk,
  ShowNo,
  GBEvent,
  AdKind,
  SDKState,
  SessionData,
  GBRemoteConfig,
  GameMetadata,
  AdSourceConfig,
} from './types.js';
import { EventEmitter } from './events.js';
import { RemoteConfig } from './remote/RemoteConfig.js';
import { ImaVastAdapter } from './adapters/imaVastAdapter.js';
import { WaterfallManager } from './adapters/waterfallManager.js';
import { getTCF } from './utils/tcf.js';
import { ensureOverlay, showOverlay, hideOverlay, cleanupVideo } from './utils/dom.js';
import { sessionStorage, getStoredJSON, setStoredJSON } from './utils/storage.js';
import { SDK_VERSION } from './utils/version.js';
import {
  trackAdImpression,
  generateSessionId,
  getAdNetworkFromTag,
  type AdImpressionData,
} from './utils/tracking.js';

export class GBSDK extends EventEmitter {
  private state: SDKState = {
    initialized: false,
    config: {},
    sessionData: {
      interstitial: { lastShown: 0, count: 0 },
      rewarded: { lastShown: 0, count: 0 },
    },
  };

  private remoteConfig: RemoteConfig | null = null;
  private waterfallManager: WaterfallManager | null = null;
  private userGestureRequired = true;
  private sessionId: string = generateSessionId();

  /**
   * Initialize the SDK with automatic game detection
   */
  async init(config: GBInit = {}): Promise<void> {
    if (this.state.initialized) {
      if (config.debug) {
        console.warn('GBSDK: Already initialized, skipping re-initialization');
      }
      return; // Just return instead of throwing error
    }

    // Auto-detect game metadata
    const gameMetadata = this.detectGameMetadata();

    // Build dynamic config with auto-detection
    const autoConfig = this.buildAutoConfig(gameMetadata, config);

    // Set default values with auto-detected config
    this.state.config = {
      refreshSec: 900, // 15 minutes
      cooldownSec: 90, // 90 seconds
      sessionCap: 20,
      debug: false,
      storageKey: 'gbsdk',
      allowDomains: [],
      ...autoConfig,
    };

    if (this.state.config.debug) {
      console.log(`GBSDK v${SDK_VERSION}: Initializing with auto-detected metadata:`, {
        gameMetadata,
        config: this.state.config,
      });
    }

    // Load session data
    this.loadSessionData();

    // Initialize remote config if URL provided
    if (this.state.config.configUrl) {
      this.remoteConfig = new RemoteConfig({
        url: this.state.config.configUrl,
        storageKey: this.state.config.storageKey!,
        refreshSec: this.state.config.refreshSec!,
        allowDomains: this.state.config.allowDomains || [],
        publicKey: this.state.config.publicKey,
        auth: this.state.config.configAuth,
        debug: this.state.config.debug,
      });

      try {
        const remoteConfig = await this.remoteConfig.fetch();
        if (remoteConfig) {
          this.state.remoteConfig = remoteConfig;
        }
        if (this.state.config.debug) {
          console.log('GBSDK: Remote config loaded:', this.state.remoteConfig);
        }
      } catch (error) {
        console.warn('GBSDK: Failed to load remote config:', error);
      }
    }

    // Initialize waterfall manager
    this.waterfallManager = new WaterfallManager();

    // Initialize legacy adapter (for backward compatibility)
    this.state.adapter = new ImaVastAdapter();
    await this.state.adapter.load();

    // Create overlay
    this.state.overlay = ensureOverlay();
    this.setupOverlayEvents();

    // Inject CSS
    this.injectCSS();

    this.state.initialized = true;

    if (this.state.config.debug) {
      console.log('GBSDK: Initialization complete');
    }
  }

  /**
   * Show an interstitial ad
   */
  async showInterstitial(): Promise<ShowOk | ShowNo> {
    return this.showAd('interstitial');
  }

  /**
   * Show a rewarded ad
   */
  async showRewarded(): Promise<ShowOk | ShowNo> {
    return this.showAd('rewarded');
  }

  /**
   * Check if an ad can be shown
   */
  canShow(kind: AdKind): boolean {
    if (!this.state.initialized) return false;

    const config = this.getEffectiveConfig();
    const sessionData = this.state.sessionData[kind];
    const now = Date.now();

    // Check cooldown
    if (now - sessionData.lastShown < (config.cooldownSec || 90) * 1000) {
      return false;
    }

    // Check session cap
    if (sessionData.count >= (config.sessionCap || 20)) {
      return false;
    }

    // Check kill switches
    if (config.featureFlags) {
      if (kind === 'interstitial' && config.featureFlags.killInterstitial) {
        return false;
      }
      if (kind === 'rewarded' && config.featureFlags.killRewarded) {
        return false;
      }
    }

    return true;
  }

  /**
   * Track game started event
   */
  gameStarted(): void {
    if (this.state.config.debug) {
      console.log('GBSDK: Game started');
    }
    this.emit('game_started');
  }

  /**
   * Track game ended event
   */
  gameEnded(): void {
    if (this.state.config.debug) {
      console.log('GBSDK: Game ended');
    }
    this.emit('game_ended');
  }

  /**
   * Destroy the SDK and clean up resources
   */
  destroy(): void {
    if (this.state.adapter) {
      this.state.adapter.destroy?.();
    }

    if (this.state.overlay) {
      hideOverlay(this.state.overlay.overlay);
      this.state.overlay.overlay.remove();
    }

    this.removeAllListeners();
    this.state.initialized = false;
  }

  /**
   * Show an ad of the specified kind
   */
  private async showAd(kind: AdKind): Promise<ShowOk | ShowNo> {
    if (!this.state.initialized) {
      return { success: false, reason: 'error' };
    }

    // Check if ad can be shown
    if (!this.canShow(kind)) {
      const sessionData = this.state.sessionData[kind];
      const config = this.getEffectiveConfig();
      const now = Date.now();

      if (now - sessionData.lastShown < (config.cooldownSec || 90) * 1000) {
        return { success: false, reason: 'cooldown' };
      }
      if (sessionData.count >= (config.sessionCap || 20)) {
        return { success: false, reason: 'capped' };
      }
      return { success: false, reason: 'blocked' };
    }

    // Check user gesture requirement
    if (this.userGestureRequired) {
      try {
        // Initialize display container in user gesture
        if (this.state.adapter && 'adDisplayContainer' in this.state.adapter) {
          // This will be handled by the adapter during play
        }
        this.userGestureRequired = false;
      } catch (error) {
        return { success: false, reason: 'error' };
      }
    }

    // Don't show overlay yet - wait for ad to load
    // Overlay will be shown in onAdLoaded event
    if (this.state.overlay?.closeBtn) {
      this.state.overlay.closeBtn.style.display = 'none';
    }

    try {
      // Check if we have new waterfall sources
      const sources = this.getAdSources(kind);

      if (sources && sources.length > 0) {
        // Use new waterfall system
        const result = await this.playWaterfall(sources, kind);

        if (result === 'ok' || (result === 'skipped' && kind === 'interstitial')) {
          // Update session data
          this.updateSessionData(kind);
          hideOverlay(this.state.overlay!.overlay);
          return { success: true, type: kind };
        }

        if (result === 'skipped' && kind === 'rewarded') {
          // Rewarded ads must complete to be successful
          hideOverlay(this.state.overlay!.overlay);
          return { success: false, reason: 'no_fill' };
        }

        // Waterfall failed
        hideOverlay(this.state.overlay!.overlay);
        return { success: false, reason: 'no_fill' };
      }

      // Fallback to legacy VAST tags
      const tags = this.getAdTags(kind);
      if (!tags || tags.length === 0) {
        hideOverlay(this.state.overlay!.overlay);
        return { success: false, reason: 'no_fill' };
      }

      // Try each tag in waterfall
      for (const tag of tags) {
        const result = await this.playAdTag(tag, kind);

        if (result === 'ok' || (result === 'skipped' && kind === 'interstitial')) {
          // Update session data
          this.updateSessionData(kind);
          hideOverlay(this.state.overlay!.overlay);
          return { success: true, type: kind };
        }

        if (result === 'skipped' && kind === 'rewarded') {
          // Rewarded ads must complete to be successful
          hideOverlay(this.state.overlay!.overlay);
          return { success: false, reason: 'no_fill' };
        }

        // Continue to next tag for timeout, error, no_fill
      }

      // All tags failed
      hideOverlay(this.state.overlay!.overlay);
      return { success: false, reason: 'no_fill' };
    } catch (error) {
      hideOverlay(this.state.overlay!.overlay);
      return { success: false, reason: 'error' };
    }
  }

  /**
   * Play a single ad tag
   */
  private async playAdTag(
    tagUrl: string,
    kind: AdKind
  ): Promise<'ok' | 'skipped' | 'no_fill' | 'error' | 'timeout'> {
    if (!this.state.adapter || !this.state.overlay) {
      return 'error';
    }

    // Get TCF data
    const tcData = await getTCF();

    // Create play context
    const playCtx = {
      kind,
      tc: tcData,
      mount: this.state.overlay,
      onEvent: (event: GBEvent, data?: any) => {
        this.emit(event, { kind, ...data });

        // Track ad impression on complete
        if (event === 'complete') {
          this.trackImpression(tagUrl, kind);
        }
      },
      debug: this.state.config.debug || false,
    };

    return this.state.adapter.play(tagUrl, playCtx);
  }

  /**
   * Play waterfall with multiple ad sources
   */
  private async playWaterfall(
    sources: AdSourceConfig[],
    kind: AdKind
  ): Promise<'ok' | 'skipped' | 'no_fill' | 'error' | 'timeout'> {
    if (!this.waterfallManager || !this.state.overlay) {
      return 'error';
    }

    // Get TCF data
    const tcData = await getTCF();

    // Create play context
    const playCtx = {
      kind,
      tc: tcData,
      mount: this.state.overlay,
      onEvent: (event: GBEvent, data?: any) => {
        this.emit(event, { kind, ...data });
      },
      debug: this.state.config.debug || false,
    };

    return this.waterfallManager.executeWaterfall(sources, playCtx);
  }

  /**
   * Get ad sources for the specified kind (new waterfall system)
   */
  private getAdSources(kind: AdKind): AdSourceConfig[] | null {
    const config = this.getEffectiveConfig();

    // Check if remote config has sources
    if (config[kind]?.sources) {
      return config[kind]!.sources!;
    }

    return null;
  }

  /**
   * Get ad tags for the specified kind (legacy system)
   */
  private getAdTags(kind: AdKind): string[] {
    const config = this.getEffectiveConfig();

    // Try remote config first
    if (config[kind]?.tags) {
      return config[kind]!.tags!;
    }

    // Fallback to local config
    if (kind === 'interstitial' && this.state.config.interstitialTags) {
      return this.state.config.interstitialTags;
    }
    if (kind === 'rewarded' && this.state.config.rewardedTags) {
      return this.state.config.rewardedTags;
    }

    return [];
  }

  /**
   * Get effective configuration (remote + local merged)
   */
  private getEffectiveConfig(): Partial<GBRemoteConfig> & GBInit {
    const base: Partial<GBRemoteConfig> & GBInit = {
      cooldownSec: this.state.config.cooldownSec || 90,
      sessionCap: this.state.config.sessionCap || 20,
      ...this.state.config,
      ...this.state.remoteConfig,
    };

    // Apply A/B testing if configured
    if (base.ab?.groups) {
      const groupName = this.selectABGroup(base.ab.bucketing || 'random');
      const groupConfig = base.ab.groups[groupName];
      if (groupConfig) {
        Object.assign(base, groupConfig);
      }
    }

    return base;
  }

  /**
   * Select A/B testing group
   */
  private selectABGroup(_bucketing: 'userId' | 'random'): string {
    // Simple random selection for now
    const groups = Object.keys(this.state.remoteConfig?.ab?.groups || {});
    if (groups.length === 0) return 'default';

    const index = Math.floor(Math.random() * groups.length);
    return groups[index];
  }

  /**
   * Load session data from storage
   */
  private loadSessionData(): void {
    const key = `${this.state.config.storageKey}:session`;
    const stored = getStoredJSON<Record<AdKind, SessionData>>(sessionStorage, key);

    if (stored) {
      this.state.sessionData = {
        interstitial: stored.interstitial || { lastShown: 0, count: 0 },
        rewarded: stored.rewarded || { lastShown: 0, count: 0 },
      };
    }
  }

  /**
   * Update session data after successful ad
   */
  private updateSessionData(kind: AdKind): void {
    this.state.sessionData[kind] = {
      lastShown: Date.now(),
      count: this.state.sessionData[kind].count + 1,
    };

    const key = `${this.state.config.storageKey}:session`;
    setStoredJSON(sessionStorage, key, this.state.sessionData);
  }

  /**
   * Setup overlay event handlers
   */
  private setupOverlayEvents(): void {
    if (!this.state.overlay) return;

    const { closeBtn, video } = this.state.overlay;

    // Close button should be hidden during ads
    closeBtn.style.display = 'none';

    closeBtn.addEventListener('click', () => {
      // Only allow closing if button is visible
      if (closeBtn.style.display !== 'none') {
        hideOverlay(this.state.overlay!.overlay);
        cleanupVideo(video);
      }
    });

    // Disable escape key during ads
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeBtn.style.display !== 'none') {
        hideOverlay(this.state.overlay!.overlay);
        cleanupVideo(video);
      }
    };

    document.addEventListener('keydown', handleKeydown);
  }

  /**
   * Detect game metadata from various sources
   */
  private detectGameMetadata(): GameMetadata {
    // 1. Check for build-time injected metadata (highest priority)
    const injectedMetadata = this.detectInjectedMetadata();
    if (injectedMetadata && injectedMetadata.gameId) {
      return { ...injectedMetadata, detectionMethod: 'injected' } as GameMetadata;
    }

    // 2. Check meta tags
    const metaMetadata = this.detectMetaTagMetadata();
    if (metaMetadata && metaMetadata.gameId) {
      return { ...metaMetadata, detectionMethod: 'meta_tags' } as GameMetadata;
    }

    // 3. Fallback to URL detection
    return this.detectFromUrl();
  }

  /**
   * Detect build-time injected metadata
   */
  private detectInjectedMetadata(): Partial<GameMetadata> | null {
    // Check for global variables injected during build
    if ((window as any).GBSDK_GAME_METADATA) {
      return (window as any).GBSDK_GAME_METADATA;
    }

    if ((window as any).GAME_METADATA) {
      return (window as any).GAME_METADATA;
    }

    return null;
  }

  /**
   * Detect metadata from HTML meta tags
   */
  private detectMetaTagMetadata(): Partial<GameMetadata> | null {
    const getMetaContent = (name: string): string | null => {
      const meta = document.querySelector(`meta[name="${name}"]`);
      return meta ? meta.getAttribute('content') : null;
    };

    const gameId = getMetaContent('gbsdk:game-id') || getMetaContent('game-id');
    if (!gameId) return null;

    return {
      gameId,
      gameTitle:
        getMetaContent('gbsdk:game-title') || getMetaContent('game-title') || document.title,
      category: getMetaContent('gbsdk:category') || getMetaContent('game-category') || undefined,
      tags:
        getMetaContent('gbsdk:tags')
          ?.split(',')
          .map(t => t.trim()) || undefined,
      version: getMetaContent('gbsdk:version') || getMetaContent('game-version') || undefined,
      uploadedAt: getMetaContent('gbsdk:uploaded-at') || undefined,
    };
  }

  /**
   * Detect game info from URL patterns
   */
  private detectFromUrl(): GameMetadata {
    const url = window.location.href;
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    // Try different URL patterns
    const patterns = [
      /\/games?\/([^/?]+)/i, // /games/my-game or /game/my-game
      /\/g\/([^/?]+)/i, // /g/my-game (Poki style)
      /\/play\/([^/?]+)/i, // /play/my-game
      /\/([^/?]+)\.html?$/i, // /my-game.html
      /game[_-]([^/?]+)/i, // game_my-game or game-my-game
    ];

    let gameId = 'unknown-game';

    for (const pattern of patterns) {
      const match = pathname.match(pattern);
      if (match && match[1]) {
        gameId = match[1];
        break;
      }
    }

    // If no pattern matched, use domain name
    if (gameId === 'unknown-game') {
      gameId = hostname.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    }

    // Clean up game ID
    gameId = gameId.replace(/[^a-zA-Z0-9\-_]/g, '').toLowerCase();

    return {
      gameId,
      gameTitle: document.title || gameId,
      domain: hostname,
      portalUrl: url,
      detectionMethod: 'url',
    };
  }

  /**
   * Build auto-config from detected metadata and user config
   */
  private buildAutoConfig(gameMetadata: GameMetadata, userConfig: GBInit): GBInit {
    const autoConfig: GBInit = { ...userConfig };

    // Auto-generate config URL if not provided
    if (!autoConfig.configUrl && gameMetadata.gameId) {
      autoConfig.configUrl = this.buildConfigUrl(gameMetadata);
    }

    // Set debug mode based on environment
    if (autoConfig.debug === undefined) {
      autoConfig.debug = this.isDebugEnvironment();
    }

    return autoConfig;
  }

  /**
   * Build dynamic config URL from game metadata
   */
  private buildConfigUrl(gameMetadata: GameMetadata): string {
    const baseUrl = 'https://cdn.game-buster.com/config.json';
    const params = new URLSearchParams();

    params.set('game_id', gameMetadata.gameId);
    params.set('domain', gameMetadata.domain || window.location.hostname);
    params.set('url', encodeURIComponent(window.location.href));
    params.set('title', encodeURIComponent(gameMetadata.gameTitle));
    params.set('detection', gameMetadata.detectionMethod || 'unknown');
    params.set('sdk_version', SDK_VERSION);
    params.set('timestamp', Date.now().toString());

    if (gameMetadata.category) {
      params.set('category', gameMetadata.category);
    }

    if (gameMetadata.version) {
      params.set('game_version', gameMetadata.version);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Detect if running in debug environment
   */
  private isDebugEnvironment(): boolean {
    return (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('dev') ||
      window.location.hostname.includes('test') ||
      window.location.hostname.includes('staging') ||
      window.location.search.includes('debug=true')
    );
  }

  /**
   * Track ad impression for revenue sharing
   */
  private trackImpression(tagUrl: string, kind: AdKind): void {
    const { gameId, developerId, trackingUrl } = this.state.config;

    // Only track if tracking is configured
    if (!trackingUrl || !gameId || !developerId) {
      return;
    }

    const impressionData: AdImpressionData = {
      gameId,
      developerId,
      adType: kind,
      adNetwork: getAdNetworkFromTag(tagUrl),
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
    };

    // Send tracking data (non-blocking)
    trackAdImpression(trackingUrl, impressionData);

    if (this.state.config.debug) {
      console.log('📊 Ad impression tracked:', impressionData);
    }
  }

  /**
   * Inject CSS styles
   */
  private injectCSS(): void {
    const existingStyle = document.getElementById('gbsdk-styles');
    if (existingStyle) return;

    const style = document.createElement('style');
    style.id = 'gbsdk-styles';
    style.textContent = CSS_STYLES;
    document.head.appendChild(style);
  }
}

// CSS styles (will be imported from css file in build)
const CSS_STYLES = `
.gbsdk-overlay{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);backdrop-filter:blur(4px);z-index:999999;display:none;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;view-transition-name:none}.gbsdk-slot{position:relative;max-width:960px;width:90vw;aspect-ratio:16/9;background:#000;border-radius:8px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.3)}.gbsdk-video{width:100%;height:100%;object-fit:contain;background:#000}.gbsdk-close{position:absolute;top:16px;right:16px;width:40px;height:40px;border:none;border-radius:50%;background:rgba(0,0,0,0.7);color:white;font-size:24px;font-weight:bold;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s ease;z-index:10;line-height:1}.gbsdk-close:hover{background:rgba(0,0,0,0.9);transform:scale(1.1)}.gbsdk-close:focus{outline:2px solid #fff;outline-offset:2px}.gbsdk-close:active{transform:scale(0.95)}@media (max-width:768px){.gbsdk-slot{width:95vw;max-height:80vh}.gbsdk-close{top:12px;right:12px;width:36px;height:36px;font-size:20px}}@media (max-height:600px){.gbsdk-slot{height:80vh;width:auto;aspect-ratio:16/9}}@media (prefers-contrast:high){.gbsdk-overlay{background:rgba(0,0,0,0.95)}.gbsdk-close{background:#000;border:2px solid #fff}}@media (prefers-reduced-motion:reduce){.gbsdk-close{transition:none}.gbsdk-close:hover{transform:none}.gbsdk-close:active{transform:none}}
`;
