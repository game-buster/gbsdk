/**
 * Google Ad Manager (GAM) Adapter for GBSDK
 * Handles programmatic ads via Google Ad Manager (formerly DFP)
 */

import type { AdAdapter, PlayCtx } from '../types';

declare global {
  interface Window {
    googletag?: {
      cmd: Array<() => void>;
      defineSlot: (adUnitPath: string, size: number[], divId: string) => any;
      defineOutOfPageSlot: (adUnitPath: string, divId: string) => any;
      pubads: () => any;
      enableServices: () => void;
      display: (divId: string) => void;
      destroySlots: (slots?: any[]) => boolean;
    };
  }
}

export type GAMConfig = {
  networkCode: string; // e.g., "21775744923"
  adUnitPath: string; // e.g., "/21775744923/rewarded_video"
  sizes?: number[][]; // e.g., [[640, 480], [1280, 720]]
  targeting?: Record<string, string | string[]>; // Custom targeting
  timeout?: number; // Default 3000ms
  isOutOfPage?: boolean; // Use defineOutOfPageSlot instead of defineSlot
};

export class GAMAdapter implements AdAdapter {
  private loaded = false;
  private loadPromise: Promise<void> | null = null;
  private slotCounter = 0;
  private currentSlot: any = null;

  /**
   * Load Google Publisher Tag (GPT) library
   */
  async load(): Promise<void> {
    if (this.loaded) return;
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise((resolve, reject) => {
      // Check if GPT is already loaded
      if (window.googletag && window.googletag.cmd) {
        this.loaded = true;
        resolve();
        return;
      }

      // Initialize googletag command queue
      window.googletag = window.googletag || ({ cmd: [] } as any);

      // Load GPT library
      const script = document.createElement('script');
      script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
      script.async = true;

      script.onload = () => {
        window.googletag!.cmd.push(() => {
          this.loaded = true;
          resolve();
        });
      };

      script.onerror = () => {
        reject(new Error('Failed to load Google Publisher Tag'));
      };

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  /**
   * Play an ad using Google Ad Manager
   */
  async play(
    config: GAMConfig,
    ctx: PlayCtx
  ): Promise<'ok' | 'skipped' | 'no_fill' | 'error' | 'timeout'> {
    if (!this.loaded) {
      await this.load();
    }

    return new Promise(resolve => {
      const divId = `gam-ad-${++this.slotCounter}`;
      const timeout = config.timeout || 3000;
      let timeoutHandle: number | null = null;
      let resolved = false;

      if (ctx.debug) {
        console.log('GAMAdapter: Starting ad request', { divId, config });
      }

      // Create ad container
      const adContainer = document.createElement('div');
      adContainer.id = divId;
      adContainer.style.cssText =
        'position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: none;';
      ctx.mount.overlay.appendChild(adContainer);

      window.googletag!.cmd.push(() => {
        try {
          // Build ad unit path (check if it already includes network code)
          const adUnitPath = config.adUnitPath.startsWith('/')
            ? config.adUnitPath
            : `/${config.networkCode}/${config.adUnitPath}`;

          // Define slot (out-of-page for interstitials or regular slot)
          if (config.isOutOfPage) {
            this.currentSlot = window.googletag!.defineOutOfPageSlot(adUnitPath, divId);
          } else {
            const sizes = config.sizes || [[640, 480]];
            this.currentSlot = window.googletag!.defineSlot(adUnitPath, sizes as any, divId);
          }

          if (!this.currentSlot) {
            if (ctx.debug) {
              console.error('GAMAdapter: Failed to define slot');
            }
            this.cleanup(divId, adContainer);
            resolve('error');
            return;
          }

          // Add service
          this.currentSlot.addService(window.googletag!.pubads());

          // Set targeting
          if (config.targeting) {
            Object.entries(config.targeting).forEach(([key, value]) => {
              this.currentSlot.setTargeting(key, value);
            });
          }

          // Set ad type targeting
          this.currentSlot.setTargeting('ad_type', ctx.kind);

          // Configure publisher ads service
          const pubads = window.googletag!.pubads();

          // Enable single request mode
          pubads.enableSingleRequest();

          // Disable initial load (we'll refresh manually)
          pubads.disableInitialLoad();

          // Enable services
          window.googletag!.enableServices();

          // Set up event listeners
          let adLoaded = false;
          let adStarted = false;

          // Slot render ended event
          const renderEndedListener = pubads.addEventListener('slotRenderEnded', (event: any) => {
            if (event.slot === this.currentSlot) {
              if (ctx.debug) {
                console.log('GAMAdapter: Slot render ended', {
                  isEmpty: event.isEmpty,
                  size: event.size,
                  advertiserId: event.advertiserId,
                });
              }

              if (event.isEmpty) {
                if (!resolved) {
                  resolved = true;
                  if (timeoutHandle) clearTimeout(timeoutHandle);
                  ctx.onEvent('no_fill', {});
                  this.cleanup(divId, adContainer);
                  resolve('no_fill');
                }
              } else {
                adLoaded = true;
                // Show the ad container
                adContainer.style.display = 'block';
                ctx.onEvent('loaded', {});
              }
            }
          });

          // Impression viewable event
          const impressionViewableListener = pubads.addEventListener(
            'impressionViewable',
            (event: any) => {
              if (event.slot === this.currentSlot) {
                if (ctx.debug) {
                  console.log('GAMAdapter: Impression viewable');
                }

                if (!adStarted) {
                  adStarted = true;
                  ctx.onEvent('started', {});
                }
              }
            }
          );

          // Slot visibility changed event
          const visibilityChangedListener = pubads.addEventListener(
            'slotVisibilityChanged',
            (event: any) => {
              if (event.slot === this.currentSlot) {
                if (ctx.debug) {
                  console.log('GAMAdapter: Visibility changed', {
                    inViewPercentage: event.inViewPercentage,
                  });
                }
              }
            }
          );

          // Display the ad
          window.googletag!.display(divId);

          // Refresh the slot to load the ad
          pubads.refresh([this.currentSlot]);

          // Set timeout
          timeoutHandle = window.setTimeout(() => {
            if (!resolved) {
              resolved = true;
              if (ctx.debug) {
                console.log('GAMAdapter: Timeout reached');
              }

              // Clean up listeners
              pubads.removeEventListener(renderEndedListener);
              pubads.removeEventListener(impressionViewableListener);
              pubads.removeEventListener(visibilityChangedListener);

              this.cleanup(divId, adContainer);
              resolve('timeout');
            }
          }, timeout);

          // For video ads, we need to handle completion differently
          // Since GAM doesn't provide a direct "ad completed" event for video,
          // we'll simulate it based on typical video ad duration (30 seconds max)
          if (adLoaded) {
            const estimatedDuration = 30000; // 30 seconds
            setTimeout(() => {
              if (!resolved && adLoaded) {
                resolved = true;
                if (timeoutHandle) clearTimeout(timeoutHandle);

                // Clean up listeners
                pubads.removeEventListener(renderEndedListener);
                pubads.removeEventListener(impressionViewableListener);
                pubads.removeEventListener(visibilityChangedListener);

                ctx.onEvent('complete', {});
                this.cleanup(divId, adContainer);
                resolve('ok');
              }
            }, estimatedDuration);
          }
        } catch (error) {
          if (ctx.debug) {
            console.error('GAMAdapter: Error', error);
          }
          if (!resolved) {
            resolved = true;
            if (timeoutHandle) clearTimeout(timeoutHandle);
            this.cleanup(divId, adContainer);
            resolve('error');
          }
        }
      });
    });
  }

  /**
   * Cleanup ad slot and container
   */
  private cleanup(_divId: string, adContainer: HTMLElement): void {
    try {
      // Destroy slot
      if (this.currentSlot) {
        window.googletag?.destroySlots([this.currentSlot]);
        this.currentSlot = null;
      }

      // Remove container
      if (adContainer && adContainer.parentNode) {
        adContainer.parentNode.removeChild(adContainer);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  /**
   * Destroy adapter
   */
  destroy(): void {
    if (this.currentSlot) {
      window.googletag?.destroySlots([this.currentSlot]);
      this.currentSlot = null;
    }
    this.loaded = false;
    this.loadPromise = null;
  }
}
