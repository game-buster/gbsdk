/**
 * Remote configuration tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RemoteConfig } from './RemoteConfig';

describe('RemoteConfig', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const mockConfig = {
    version: '1.0.0',
    sdkMin: '1.0.0',
    cooldownSec: 90,
    sessionCap: 20,
    interstitial: {
      tags: ['https://example.com/vast.xml'],
      blockedCountries: [],
    },
    rewarded: {
      tags: ['https://example.com/vast.xml'],
      blockedCountries: [],
    },
    featureFlags: {
      killInterstitial: false,
      killRewarded: false,
    },
  };

  const createRemoteConfig = (overrides = {}) => {
    return new RemoteConfig({
      url: 'https://cdn.example.com/config.json',
      storageKey: 'test',
      refreshSec: 900,
      allowDomains: [],
      debug: false,
      ...overrides,
    });
  };

  describe('fetch', () => {
    it('should fetch config from network', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          headers: new Map([['etag', 'abc123']]),
          text: () => Promise.resolve(JSON.stringify(mockConfig)),
          json: () => Promise.resolve(mockConfig),
        } as any)
      );

      const rc = createRemoteConfig();
      const config = await rc.fetch();

      expect(config).toEqual(mockConfig);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should use cached config when fresh', async () => {
      const rc = createRemoteConfig();
      
      // First fetch
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          headers: new Map([['etag', 'abc123']]),
          text: () => Promise.resolve(JSON.stringify(mockConfig)),
          json: () => Promise.resolve(mockConfig),
        } as any)
      );

      await rc.fetch();
      
      // Second fetch should use cache
      const config = await rc.fetch();

      expect(config).toEqual(mockConfig);
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should revalidate when cache is stale', async () => {
      const rc = createRemoteConfig({ refreshSec: 0 }); // Immediate expiry
      
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          headers: new Map([['etag', 'abc123']]),
          text: () => Promise.resolve(JSON.stringify(mockConfig)),
          json: () => Promise.resolve(mockConfig),
        } as any)
      );

      await rc.fetch();
      await rc.fetch();

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle 304 Not Modified', async () => {
      const rc = createRemoteConfig({ refreshSec: 0 });
      
      // First fetch
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          headers: new Map([['etag', 'abc123']]),
          text: () => Promise.resolve(JSON.stringify(mockConfig)),
          json: () => Promise.resolve(mockConfig),
        } as any)
      );

      await rc.fetch();
      
      // Second fetch returns 304
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 304,
          headers: new Map(),
        } as any)
      );

      const config = await rc.fetch();

      expect(config).toEqual(mockConfig);
    });

    it('should use stale cache on network error', async () => {
      const rc = createRemoteConfig({ refreshSec: 0 });
      
      // First fetch succeeds
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          headers: new Map([['etag', 'abc123']]),
          text: () => Promise.resolve(JSON.stringify(mockConfig)),
          json: () => Promise.resolve(mockConfig),
        } as any)
      );

      await rc.fetch();
      
      // Second fetch fails
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

      const config = await rc.fetch();

      expect(config).toEqual(mockConfig); // Should return stale cache
    });

    it('should reject HTTP URLs', async () => {
      const rc = createRemoteConfig({ url: 'http://example.com/config.json' });
      
      const config = await rc.fetch();

      expect(config).toBeUndefined();
    });

    it('should validate allowed domains', async () => {
      const rc = createRemoteConfig({
        url: 'https://evil.com/config.json',
        allowDomains: ['example.com'],
      });
      
      const config = await rc.fetch();

      expect(config).toBeUndefined();
    });

    it('should handle invalid JSON', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          headers: new Map(),
          text: () => Promise.resolve('invalid json {'),
        } as any)
      );

      const rc = createRemoteConfig();
      const config = await rc.fetch();

      expect(config).toBeUndefined();
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', async () => {
      const rc = createRemoteConfig();
      
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          headers: new Map([['etag', 'abc123']]),
          text: () => Promise.resolve(JSON.stringify(mockConfig)),
          json: () => Promise.resolve(mockConfig),
        } as any)
      );

      await rc.fetch();
      rc.clearCache();
      
      // Should fetch again after cache clear
      await rc.fetch();

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});

