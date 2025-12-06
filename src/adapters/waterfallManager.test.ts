import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WaterfallManager } from './waterfallManager';
import type { AdSourceConfig, PlayCtx } from '../types';

// Mock adapters
vi.mock('./prebidAdapter', () => ({
  PrebidAdapter: vi.fn().mockImplementation(() => ({
    load: vi.fn().mockResolvedValue(undefined),
    play: vi.fn().mockResolvedValue('ok'),
    destroy: vi.fn(),
  })),
}));

vi.mock('./gamAdapter', () => ({
  GAMAdapter: vi.fn().mockImplementation(() => ({
    load: vi.fn().mockResolvedValue(undefined),
    play: vi.fn().mockResolvedValue('ok'),
    destroy: vi.fn(),
  })),
}));

vi.mock('./imaVastAdapter', () => ({
  ImaVastAdapter: vi.fn().mockImplementation(() => ({
    load: vi.fn().mockResolvedValue(undefined),
    play: vi.fn().mockResolvedValue('ok'),
    destroy: vi.fn(),
  })),
}));

describe('WaterfallManager', () => {
  let manager: WaterfallManager;
  let mockPlayCtx: PlayCtx;

  beforeEach(() => {
    manager = new WaterfallManager();
    
    mockPlayCtx = {
      kind: 'interstitial',
      tc: null,
      mount: {
        overlay: document.createElement('div'),
        video: document.createElement('video'),
        closeBtn: document.createElement('button'),
      },
      onEvent: vi.fn(),
      debug: true,
    };
  });

  describe('executeWaterfall', () => {
    it('should return no_fill when no sources provided', async () => {
      const result = await manager.executeWaterfall([], mockPlayCtx);
      expect(result).toBe('no_fill');
    });

    it('should try VAST source successfully', async () => {
      const sources: AdSourceConfig[] = [
        {
          type: 'vast',
          vastTags: ['https://example.com/vast.xml'],
        },
      ];

      const result = await manager.executeWaterfall(sources, mockPlayCtx);
      expect(result).toBe('ok');
    });

    it('should try GAM source successfully', async () => {
      const sources: AdSourceConfig[] = [
        {
          type: 'gam',
          gam: {
            enabled: true,
            adUnitPath: '/test/ad-unit',
          },
        },
      ];

      const result = await manager.executeWaterfall(sources, mockPlayCtx);
      expect(result).toBe('ok');
    });

    it('should try Prebid source successfully', async () => {
      const sources: AdSourceConfig[] = [
        {
          type: 'prebid',
          prebid: {
            enabled: true,
            timeout: 2000,
            bidders: [
              {
                name: 'appnexus',
                params: { placementId: '123' },
              },
            ],
          },
        },
      ];

      const result = await manager.executeWaterfall(sources, mockPlayCtx);
      expect(result).toBe('ok');
    });

    it('should fallback to next source on failure', async () => {
      // Mock first source to fail
      const { ImaVastAdapter } = await import('./imaVastAdapter');
      (ImaVastAdapter as any).mockImplementationOnce(() => ({
        load: vi.fn().mockResolvedValue(undefined),
        play: vi.fn().mockResolvedValue('no_fill'),
        destroy: vi.fn(),
      }));

      const sources: AdSourceConfig[] = [
        {
          type: 'vast',
          vastTags: ['https://example.com/vast1.xml'],
        },
        {
          type: 'vast',
          vastTags: ['https://example.com/vast2.xml'],
        },
      ];

      const result = await manager.executeWaterfall(sources, mockPlayCtx);
      // Should try second source
      expect(result).toBe('ok');
    });

    it('should return no_fill when all sources fail', async () => {
      // Mock all sources to fail
      const { ImaVastAdapter } = await import('./imaVastAdapter');
      (ImaVastAdapter as any).mockImplementation(() => ({
        load: vi.fn().mockResolvedValue(undefined),
        play: vi.fn().mockResolvedValue('no_fill'),
        destroy: vi.fn(),
      }));

      const sources: AdSourceConfig[] = [
        {
          type: 'vast',
          vastTags: ['https://example.com/vast.xml'],
        },
      ];

      const result = await manager.executeWaterfall(sources, mockPlayCtx);
      expect(result).toBe('no_fill');
    });

    it('should handle errors gracefully', async () => {
      const sources: AdSourceConfig[] = [
        {
          type: 'vast',
          vastTags: [], // Empty tags should cause error
        },
      ];

      const result = await manager.executeWaterfall(sources, mockPlayCtx);
      expect(result).toBe('error');
    });

    it('should skip disabled sources', async () => {
      const sources: AdSourceConfig[] = [
        {
          type: 'prebid',
          prebid: {
            enabled: false,
            timeout: 2000,
            bidders: [],
          },
        },
      ];

      const result = await manager.executeWaterfall(sources, mockPlayCtx);
      expect(result).toBe('no_fill');
    });
  });

  describe('destroy', () => {
    it('should clean up all adapters', () => {
      expect(() => manager.destroy()).not.toThrow();
    });
  });
});

