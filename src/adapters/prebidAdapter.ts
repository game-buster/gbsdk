/**
 * Prebid.js Adapter for GBSDK
 * Handles header bidding integration with Prebid.js
 */

import type { AdAdapter, PlayCtx } from '../types';

declare global {
  interface Window {
    pbjs?: {
      que: Array<() => void>;
      addAdUnits: (adUnits: any[]) => void;
      requestBids: (config: any) => void;
      setConfig: (config: any) => void;
      removeAdUnit: (adUnitCode: string) => void;
      getHighestCpmBids: (adUnitCode: string) => any[];
      renderAd: (doc: Document, adId: string) => void;
      adServers?: {
        dfp?: {
          buildVideoUrl: (options: any) => string;
        };
      };
    };
  }
}

export type PrebidConfig = {
  bidders: Array<{
    name: string;
    params: Record<string, any>;
  }>;
  timeout?: number; // Default 2000ms
  priceGranularity?: 'low' | 'medium' | 'high' | 'auto' | 'dense';
  enableSendAllBids?: boolean;
};

export class PrebidAdapter implements AdAdapter {
  private loaded = false;
  private loadPromise: Promise<void> | null = null;
  private adUnitCounter = 0;

  /**
   * Load Prebid.js library
   */
  async load(): Promise<void> {
    if (this.loaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise((resolve, reject) => {
      // Check if Prebid is already loaded
      if (window.pbjs && window.pbjs.que) {
        this.loaded = true;
        resolve();
        return;
      }

      // Initialize pbjs queue
      window.pbjs = window.pbjs || { que: [] };

      // Load Prebid.js from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/prebid.js@latest/dist/prebid.js';
      script.async = true;
      
      script.onload = () => {
        this.loaded = true;
        resolve();
      };

      script.onerror = () => {
        reject(new Error('Failed to load Prebid.js'));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  /**
   * Play an ad using Prebid header bidding
   */
  async play(config: PrebidConfig, ctx: PlayCtx): Promise<'ok' | 'skipped' | 'no_fill' | 'error' | 'timeout'> {
    if (!this.loaded) {
      await this.load();
    }

    return new Promise((resolve) => {
      const adUnitCode = `gbsdk-${ctx.kind}-${++this.adUnitCounter}`;
      const timeout = config.timeout || 2000;

      if (ctx.debug) {
        console.log('PrebidAdapter: Starting header bidding', { adUnitCode, config });
      }

      window.pbjs!.que.push(() => {
        try {
          // Configure Prebid
          window.pbjs!.setConfig({
            priceGranularity: config.priceGranularity || 'medium',
            enableSendAllBids: config.enableSendAllBids !== false,
            userSync: {
              syncEnabled: true,
              filterSettings: {
                iframe: {
                  bidders: '*',
                  filter: 'include'
                }
              }
            }
          });

          // Build ad unit
          const adUnit = {
            code: adUnitCode,
            mediaTypes: {
              video: {
                context: 'instream',
                playerSize: [640, 480],
                mimes: ['video/mp4', 'video/webm'],
                protocols: [2, 3, 5, 6],
                playbackmethod: [2],
                skip: ctx.kind === 'interstitial' ? 1 : 0,
              }
            },
            bids: config.bidders.map(bidder => ({
              bidder: bidder.name,
              params: bidder.params
            }))
          };

          // Add ad unit
          window.pbjs!.addAdUnits([adUnit]);

          // Request bids
          window.pbjs!.requestBids({
            adUnitCodes: [adUnitCode],
            timeout,
            bidsBackHandler: (bids: any) => {
              this.handleBidsBack(adUnitCode, bids, ctx, resolve);
            }
          });

          // Timeout fallback
          setTimeout(() => {
            if (ctx.debug) {
              console.log('PrebidAdapter: Timeout reached');
            }
            this.cleanup(adUnitCode);
            resolve('timeout');
          }, timeout + 500);

        } catch (error) {
          if (ctx.debug) {
            console.error('PrebidAdapter: Error', error);
          }
          this.cleanup(adUnitCode);
          resolve('error');
        }
      });
    });
  }

  /**
   * Handle bids back from Prebid
   */
  private handleBidsBack(
    adUnitCode: string,
    bids: any,
    ctx: PlayCtx,
    resolve: (result: 'ok' | 'skipped' | 'no_fill' | 'error' | 'timeout') => void
  ): void {
    try {
      const highestBids = window.pbjs!.getHighestCpmBids(adUnitCode);

      if (ctx.debug) {
        console.log('PrebidAdapter: Bids received', { highestBids });
      }

      if (!highestBids || highestBids.length === 0) {
        if (ctx.debug) {
          console.log('PrebidAdapter: No bids');
        }
        this.cleanup(adUnitCode);
        ctx.onEvent('no_fill', {});
        resolve('no_fill');
        return;
      }

      const winningBid = highestBids[0];

      if (!winningBid.vastUrl && !winningBid.vastXml) {
        if (ctx.debug) {
          console.log('PrebidAdapter: No VAST in winning bid');
        }
        this.cleanup(adUnitCode);
        ctx.onEvent('no_fill', {});
        resolve('no_fill');
        return;
      }

      // Get VAST URL or XML
      const vastUrl = winningBid.vastUrl;
      const vastXml = winningBid.vastXml;

      if (ctx.debug) {
        console.log('PrebidAdapter: Playing winning bid', {
          cpm: winningBid.cpm,
          bidder: winningBid.bidder,
          vastUrl,
          hasVastXml: !!vastXml
        });
      }

      // Play the ad using IMA adapter (we'll pass VAST URL/XML to it)
      this.playVastAd(vastUrl, vastXml, ctx, resolve);

    } catch (error) {
      if (ctx.debug) {
        console.error('PrebidAdapter: Error handling bids', error);
      }
      this.cleanup(adUnitCode);
      resolve('error');
    }
  }

  /**
   * Play VAST ad using Google IMA
   */
  private async playVastAd(
    vastUrl: string | undefined,
    vastXml: string | undefined,
    ctx: PlayCtx,
    resolve: (result: 'ok' | 'skipped' | 'no_fill' | 'error' | 'timeout') => void
  ): Promise<void> {
    try {
      // We'll use the IMA adapter to play the VAST
      // Import it dynamically to avoid circular dependencies
      const { ImaVastAdapter } = await import('./imaVastAdapter');
      const imaAdapter = new ImaVastAdapter();
      await imaAdapter.load();

      // Use VAST URL if available, otherwise we'd need to handle VAST XML
      // For now, we'll use VAST URL (most common case)
      if (vastUrl) {
        const result = await imaAdapter.play(vastUrl, ctx);
        resolve(result);
      } else {
        // VAST XML handling would require converting to URL or direct parsing
        // For simplicity, we'll treat this as no_fill for now
        ctx.onEvent('no_fill', {});
        resolve('no_fill');
      }
    } catch (error) {
      if (ctx.debug) {
        console.error('PrebidAdapter: Error playing VAST', error);
      }
      resolve('error');
    }
  }

  /**
   * Cleanup ad unit
   */
  private cleanup(adUnitCode: string): void {
    try {
      window.pbjs?.removeAdUnit(adUnitCode);
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  /**
   * Destroy adapter
   */
  destroy(): void {
    // Prebid doesn't need explicit cleanup
    this.loaded = false;
    this.loadPromise = null;
  }
}

