/**
 * Waterfall Manager for GBSDK
 * Manages ad source waterfall: Prebid -> GAM -> VAST
 */

import type { AdSourceConfig, PlayCtx } from '../types';
import { PrebidAdapter } from './prebidAdapter';
import { GAMAdapter } from './gamAdapter';
import { ImaVastAdapter } from './imaVastAdapter';

export class WaterfallManager {
  private prebidAdapter: PrebidAdapter | null = null;
  private gamAdapter: GAMAdapter | null = null;
  private vastAdapter: ImaVastAdapter | null = null;

  /**
   * Execute waterfall for ad sources
   */
  async executeWaterfall(
    sources: AdSourceConfig[],
    ctx: PlayCtx
  ): Promise<'ok' | 'skipped' | 'no_fill' | 'error' | 'timeout'> {
    if (!sources || sources.length === 0) {
      if (ctx.debug) {
        console.log('WaterfallManager: No sources configured');
      }
      return 'no_fill';
    }

    if (ctx.debug) {
      console.log('WaterfallManager: Starting waterfall', {
        sources: sources.map(s => s.type),
        kind: ctx.kind
      });
    }

    // Try each source in order
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];

      if (ctx.debug) {
        console.log(`WaterfallManager: Trying source ${i + 1}/${sources.length}`, {
          type: source.type
        });
      }

      try {
        const result = await this.trySource(source, ctx);

        if (result === 'ok') {
          if (ctx.debug) {
            console.log(`WaterfallManager: Source ${i + 1} succeeded`, { type: source.type });
          }
          return 'ok';
        }

        if (ctx.debug) {
          console.log(`WaterfallManager: Source ${i + 1} failed`, {
            type: source.type,
            result
          });
        }

        // Continue to next source
      } catch (error) {
        if (ctx.debug) {
          console.error(`WaterfallManager: Source ${i + 1} error`, error);
        }
        // Continue to next source
      }
    }

    // All sources failed
    if (ctx.debug) {
      console.log('WaterfallManager: All sources failed');
    }
    return 'no_fill';
  }

  /**
   * Try a single ad source
   */
  private async trySource(
    source: AdSourceConfig,
    ctx: PlayCtx
  ): Promise<'ok' | 'skipped' | 'no_fill' | 'error' | 'timeout'> {
    switch (source.type) {
      case 'prebid':
        return this.tryPrebid(source, ctx);
      
      case 'gam':
        return this.tryGAM(source, ctx);
      
      case 'vast':
        return this.tryVAST(source, ctx);
      
      default:
        if (ctx.debug) {
          console.warn('WaterfallManager: Unknown source type', { type: source.type });
        }
        return 'error';
    }
  }

  /**
   * Try Prebid source
   */
  private async tryPrebid(
    source: AdSourceConfig,
    ctx: PlayCtx
  ): Promise<'ok' | 'skipped' | 'no_fill' | 'error' | 'timeout'> {
    if (!source.prebid) {
      if (ctx.debug) {
        console.warn('WaterfallManager: Prebid config missing');
      }
      return 'error';
    }

    if (source.prebid.enabled === false) {
      if (ctx.debug) {
        console.log('WaterfallManager: Prebid disabled');
      }
      return 'no_fill';
    }

    try {
      // Initialize adapter if needed
      if (!this.prebidAdapter) {
        this.prebidAdapter = new PrebidAdapter();
        await this.prebidAdapter.load();
      }

      // Execute Prebid
      const result = await this.prebidAdapter.play(source.prebid, ctx);
      return result;
    } catch (error) {
      if (ctx.debug) {
        console.error('WaterfallManager: Prebid error', error);
      }
      return 'error';
    }
  }

  /**
   * Try GAM source
   */
  private async tryGAM(
    source: AdSourceConfig,
    ctx: PlayCtx
  ): Promise<'ok' | 'skipped' | 'no_fill' | 'error' | 'timeout'> {
    if (!source.gam) {
      if (ctx.debug) {
        console.warn('WaterfallManager: GAM config missing');
      }
      return 'error';
    }

    if (source.gam.enabled === false) {
      if (ctx.debug) {
        console.log('WaterfallManager: GAM disabled');
      }
      return 'no_fill';
    }

    try {
      // Initialize adapter if needed
      if (!this.gamAdapter) {
        this.gamAdapter = new GAMAdapter();
        await this.gamAdapter.load();
      }

      // Execute GAM
      const result = await this.gamAdapter.play(source.gam, ctx);
      return result;
    } catch (error) {
      if (ctx.debug) {
        console.error('WaterfallManager: GAM error', error);
      }
      return 'error';
    }
  }

  /**
   * Try VAST source
   */
  private async tryVAST(
    source: AdSourceConfig,
    ctx: PlayCtx
  ): Promise<'ok' | 'skipped' | 'no_fill' | 'error' | 'timeout'> {
    if (!source.vastTags || source.vastTags.length === 0) {
      if (ctx.debug) {
        console.warn('WaterfallManager: VAST tags missing');
      }
      return 'error';
    }

    try {
      // Initialize adapter if needed
      if (!this.vastAdapter) {
        this.vastAdapter = new ImaVastAdapter();
        await this.vastAdapter.load();
      }

      // Try each VAST tag
      for (const tag of source.vastTags) {
        if (ctx.debug) {
          console.log('WaterfallManager: Trying VAST tag', { tag });
        }

        const result = await this.vastAdapter.play(tag, ctx);

        if (result === 'ok') {
          return 'ok';
        }

        if (ctx.debug) {
          console.log('WaterfallManager: VAST tag failed', { tag, result });
        }
      }

      // All VAST tags failed
      return 'no_fill';
    } catch (error) {
      if (ctx.debug) {
        console.error('WaterfallManager: VAST error', error);
      }
      return 'error';
    }
  }

  /**
   * Destroy all adapters
   */
  destroy(): void {
    if (this.prebidAdapter) {
      this.prebidAdapter.destroy?.();
      this.prebidAdapter = null;
    }

    if (this.gamAdapter) {
      this.gamAdapter.destroy?.();
      this.gamAdapter = null;
    }

    if (this.vastAdapter) {
      this.vastAdapter.destroy?.();
      this.vastAdapter = null;
    }
  }
}

