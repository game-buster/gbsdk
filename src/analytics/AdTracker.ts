/**
 * Ad Tracker for GBSDK
 * Tracks ad events and sends them to GameBuster API
 */

import type { AdKind } from '../types';

export interface AdTrackingConfig {
  apiUrl: string; // GameBuster API URL
  gameId: string; // Game ID or slug
  gameName?: string; // Game name
  enabled?: boolean; // Enable/disable tracking
  debug?: boolean;
}

export interface AdEventData {
  adType: 'INTERSTITIAL' | 'REWARDED' | 'BANNER';
  adSource: 'PREBID' | 'GAM' | 'VAST' | 'DIRECT';
  event: 'IMPRESSION' | 'CLICK' | 'COMPLETE' | 'SKIP' | 'ERROR';
  adUnitId?: string;
  vastTag?: string;
  revenue?: number;
  platform?: string;
  sdkVersion?: string;
}

export class AdTracker {
  private config: AdTrackingConfig;
  private sessionId: string;
  private userId?: string;
  private queue: AdEventData[] = [];
  private flushTimer?: number;

  constructor(config: AdTrackingConfig) {
    this.config = {
      enabled: true,
      debug: false,
      ...config,
    };
    this.sessionId = this.generateSessionId();
    
    // Auto-flush queue every 5 seconds
    if (this.config.enabled) {
      this.flushTimer = window.setInterval(() => this.flush(), 5000);
    }
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Track an ad event
   */
  track(data: AdEventData): void {
    if (!this.config.enabled) {
      return;
    }

    if (this.config.debug) {
      console.log('[AdTracker] Event:', data);
    }

    // Add to queue
    this.queue.push(data);

    // Flush immediately for important events
    if (data.event === 'COMPLETE' || data.event === 'CLICK') {
      this.flush();
    }
  }

  /**
   * Track ad impression
   */
  trackImpression(adType: AdKind, adSource: string, metadata?: Partial<AdEventData>): void {
    this.track({
      adType: this.mapAdKind(adType),
      adSource: this.mapAdSource(adSource),
      event: 'IMPRESSION',
      ...metadata,
    });
  }

  /**
   * Track ad click
   */
  trackClick(adType: AdKind, adSource: string, metadata?: Partial<AdEventData>): void {
    this.track({
      adType: this.mapAdKind(adType),
      adSource: this.mapAdSource(adSource),
      event: 'CLICK',
      ...metadata,
    });
  }

  /**
   * Track ad complete
   */
  trackComplete(adType: AdKind, adSource: string, metadata?: Partial<AdEventData>): void {
    this.track({
      adType: this.mapAdKind(adType),
      adSource: this.mapAdSource(adSource),
      event: 'COMPLETE',
      ...metadata,
    });
  }

  /**
   * Track ad skip
   */
  trackSkip(adType: AdKind, adSource: string, metadata?: Partial<AdEventData>): void {
    this.track({
      adType: this.mapAdKind(adType),
      adSource: this.mapAdSource(adSource),
      event: 'SKIP',
      ...metadata,
    });
  }

  /**
   * Track ad error
   */
  trackError(adType: AdKind, adSource: string, metadata?: Partial<AdEventData>): void {
    this.track({
      adType: this.mapAdKind(adType),
      adSource: this.mapAdSource(adSource),
      event: 'ERROR',
      ...metadata,
    });
  }

  /**
   * Flush queued events to API
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }

    const events = [...this.queue];
    this.queue = [];

    try {
      // Send each event to API
      const promises = events.map((event) => this.sendEvent(event));
      await Promise.all(promises);

