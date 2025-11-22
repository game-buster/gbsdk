/**
 * Remote Configuration System for GBSDK
 * Handles HTTPS-only fetching, ETag caching, and stale-while-revalidate logic
 */

import type { GBRemoteConfig, CacheEntry } from '../types.js';
import { fetchWithTimeout, validateHttpsUrl, validateAllowedDomain } from '../utils/net.js';
import { localStorage, getStoredJSON, setStoredJSON } from '../utils/storage.js';

export interface RemoteConfigOptions {
  url: string;
  storageKey: string;
  refreshSec: number;
  allowDomains: string[];
  publicKey?: string;
  auth?: { header: string; token: string };
  debug?: boolean;
}

export class RemoteConfig {
  private options: RemoteConfigOptions;
  private cacheKeyData: string;
  private cacheKeyEtag: string;
  private cacheKeyTimestamp: string;

  constructor(options: RemoteConfigOptions) {
    this.options = options;
    this.cacheKeyData = `${options.storageKey}:rc:data`;
    this.cacheKeyEtag = `${options.storageKey}:rc:etag`;
    this.cacheKeyTimestamp = `${options.storageKey}:rc:ts`;
  }

  /**
   * Fetch remote configuration with stale-while-revalidate caching
   */
  async fetch(): Promise<GBRemoteConfig | undefined> {
    try {
      // Validate URL security
      validateHttpsUrl(this.options.url);
      if (this.options.allowDomains.length > 0) {
        validateAllowedDomain(this.options.url, this.options.allowDomains);
      }

      // Check cache first
      const cached = this.getCachedConfig();
      const now = Date.now();

      // If cache is fresh, return it immediately
      if (cached && now - cached.timestamp < this.options.refreshSec * 1000) {
        if (this.options.debug) {
          console.log('GBSDK: Using fresh cached config');
        }
        return cached.data;
      }

      // Try to fetch new config
      try {
        const newConfig = await this.fetchFromNetwork(cached?.etag);

        if (newConfig) {
          if (this.options.debug) {
            console.log('GBSDK: Fetched new config from network');
          }
          return newConfig;
        }

        // 304 Not Modified - refresh timestamp and return cached
        if (cached) {
          this.updateCacheTimestamp();
          if (this.options.debug) {
            console.log('GBSDK: Config not modified, using cached version');
          }
          return cached.data;
        }
      } catch (error) {
        console.warn('GBSDK: Failed to fetch remote config:', error);

        // Return cached config if available, even if stale
        if (cached) {
          if (this.options.debug) {
            console.log('GBSDK: Using stale cached config due to fetch error');
          }
          return cached.data;
        }
      }

      return undefined;
    } catch (error) {
      console.error('GBSDK: Error in remote config fetch:', error);
      return undefined;
    }
  }

  /**
   * Fetch configuration from network
   */
  private async fetchFromNetwork(etag?: string): Promise<GBRemoteConfig | null> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    // Add ETag for conditional request
    if (etag) {
      headers['If-None-Match'] = etag;
    }

    // Add authentication if provided
    if (this.options.auth) {
      headers[this.options.auth.header] = this.options.auth.token;
    }

    const response = await fetchWithTimeout(this.options.url, {
      method: 'GET',
      headers,
      timeout: 10000,
    });

    // 304 Not Modified
    if (response.status === 304) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const configText = await response.text();
    const config = JSON.parse(configText) as GBRemoteConfig;

    // Validate the configuration
    this.validateConfig(config);

    // Verify signature if public key is provided
    if (this.options.publicKey && config.signature) {
      const isValid = await this.verifySignature(configText, config.signature);
      if (!isValid) {
        throw new Error('Invalid configuration signature');
      }
    }

    // Cache the new configuration
    const newEtag = response.headers.etag || '';
    this.cacheConfig(config, newEtag);

    return config;
  }

  /**
   * Get cached configuration
   */
  private getCachedConfig(): CacheEntry | null {
    const data = getStoredJSON<GBRemoteConfig>(localStorage, this.cacheKeyData);
    const etag = localStorage.getItem(this.cacheKeyEtag);
    const timestampStr = localStorage.getItem(this.cacheKeyTimestamp);

    if (!data || !timestampStr) {
      return null;
    }

    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) {
      return null;
    }

    return {
      data,
      etag: etag || '',
      timestamp,
    };
  }

  /**
   * Cache configuration data
   */
  private cacheConfig(config: GBRemoteConfig, etag: string): void {
    const timestamp = Date.now();

    setStoredJSON(localStorage, this.cacheKeyData, config);
    localStorage.setItem(this.cacheKeyEtag, etag);
    localStorage.setItem(this.cacheKeyTimestamp, timestamp.toString());
  }

  /**
   * Update cache timestamp (for 304 responses)
   */
  private updateCacheTimestamp(): void {
    const timestamp = Date.now();
    localStorage.setItem(this.cacheKeyTimestamp, timestamp.toString());
  }

  /**
   * Validate configuration schema
   */
  private validateConfig(config: GBRemoteConfig): void {
    if (!config || typeof config !== 'object') {
      throw new Error('Invalid config: must be an object');
    }

    if (!config.version || typeof config.version !== 'string') {
      throw new Error('Invalid config: version is required and must be a string');
    }

    // Validate optional fields
    if (
      config.cooldownSec !== undefined &&
      (typeof config.cooldownSec !== 'number' || config.cooldownSec < 0)
    ) {
      throw new Error('Invalid config: cooldownSec must be a non-negative number');
    }

    if (
      config.sessionCap !== undefined &&
      (typeof config.sessionCap !== 'number' || config.sessionCap < 0)
    ) {
      throw new Error('Invalid config: sessionCap must be a non-negative number');
    }

    // Validate ad configurations
    if (config.interstitial && !Array.isArray(config.interstitial.tags)) {
      throw new Error('Invalid config: interstitial.tags must be an array');
    }

    if (config.rewarded && !Array.isArray(config.rewarded.tags)) {
      throw new Error('Invalid config: rewarded.tags must be an array');
    }
  }

  /**
   * Verify configuration signature (stub implementation)
   * TODO: Implement ed25519 signature verification
   */
  private async verifySignature(_data: string, _signature: string): Promise<boolean> {
    // Stub implementation - always return true when publicKey is not set
    if (!this.options.publicKey) {
      return true;
    }

    // TODO: Implement actual ed25519 signature verification
    // For now, return true to allow the system to work
    console.warn('GBSDK: Signature verification not implemented - accepting all signatures');
    return true;
  }

  /**
   * Clear cached configuration
   */
  clearCache(): void {
    localStorage.removeItem(this.cacheKeyData);
    localStorage.removeItem(this.cacheKeyEtag);
    localStorage.removeItem(this.cacheKeyTimestamp);
  }
}
