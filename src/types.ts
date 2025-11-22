/**
 * GBSDK Types and Interfaces
 * Production-ready, zero-dependency in-game ads SDK
 */

// Main SDK initialization configuration
export type GBInit = {
  // Remote config first:
  configUrl?: string; // e.g. https://cdn.gamebuster.gg/ads/config.json?game_id=kartoon&env=prod
  configAuth?: { header: string; token: string }; // optional auth header
  refreshSec?: number; // default 900 (15m)
  allowDomains?: string[]; // e.g. ['cdn.gamebuster.gg']
  publicKey?: string; // base64 ed25519 (optional verification)

  // Local fallbacks if remote missing:
  interstitialTags?: string[];
  rewardedTags?: string[];

  cooldownSec?: number; // default 90
  sessionCap?: number; // default 20
  debug?: boolean; // default false
  storageKey?: string; // default 'gbsdk'
};

// Show ad result types
export type ShowOk = { success: true; type: 'interstitial' | 'rewarded' };
export type ShowNo = {
  success: false;
  reason: 'cooldown' | 'capped' | 'no_fill' | 'error' | 'timeout' | 'blocked';
};

// SDK events
export type GBEvent =
  | 'loaded'
  | 'started'
  | 'first_quartile'
  | 'midpoint'
  | 'third_quartile'
  | 'complete'
  | 'skipped'
  | 'all_completed'
  | 'error'
  | 'timeout'
  | 'no_fill'
  | 'game_started'
  | 'game_ended';

// Event listener type
export type GBEventListener = (data?: any) => void;

// Adapter interface for different ad providers
export interface Adapter {
  name: string;
  load(): Promise<void>;
  supports(kind: 'interstitial' | 'rewarded'): boolean;
  play(tagUrl: string, ctx: PlayCtx): Promise<'ok' | 'skipped' | 'no_fill' | 'error' | 'timeout'>;
  destroy?(): void;
}

// Generic ad adapter interface (for Prebid, GAM, etc.)
export interface AdAdapter {
  load(): Promise<void>;
  play(config: any, ctx: PlayCtx): Promise<'ok' | 'skipped' | 'no_fill' | 'error' | 'timeout'>;
  destroy?(): void;
}

// Play context passed to adapters
export type PlayCtx = {
  kind: 'interstitial' | 'rewarded';
  tc?: { gdpr?: 0 | 1; tcString?: string; npa: 0 | 1 };
  mount: { overlay: HTMLElement; slot: HTMLElement; video: HTMLVideoElement };
  onEvent: (ev: GBEvent, data?: any) => void;
  debug?: boolean;
};

// Prebid bidder configuration
export type PrebidBidder = {
  name: string;
  params: Record<string, any>;
};

// Prebid configuration
export type PrebidConfig = {
  enabled?: boolean;
  bidders: PrebidBidder[];
  timeout?: number;
  priceGranularity?: 'low' | 'medium' | 'high' | 'auto' | 'dense';
  enableSendAllBids?: boolean;
};

// Google Ad Manager configuration
export type GAMConfig = {
  enabled?: boolean;
  networkCode: string;
  adUnitPath: string;
  sizes?: number[][];
  targeting?: Record<string, string | string[]>;
  timeout?: number;
};

// Ad source configuration (for waterfall)
export type AdSourceConfig = {
  type: 'prebid' | 'gam' | 'vast';
  prebid?: PrebidConfig;
  gam?: GAMConfig;
  vastTags?: string[];
};

// Remote configuration schema
export type GBRemoteConfig = {
  version: string; // ISO or semver
  sdkMin?: string;
  cooldownSec?: number;
  sessionCap?: number;
  interstitial?: {
    tags?: string[]; // Legacy VAST tags
    sources?: AdSourceConfig[]; // New waterfall sources
    blockedCountries?: string[];
  };
  rewarded?: {
    tags?: string[]; // Legacy VAST tags
    sources?: AdSourceConfig[]; // New waterfall sources
    blockedCountries?: string[];
  };
  featureFlags?: { killInterstitial?: boolean; killRewarded?: boolean };
  ab?: { bucketing?: 'userId' | 'random'; groups?: Record<string, Partial<GBRemoteConfig>> };
  signature?: string; // optional; keep a verify stub
};

// TCF (Transparency and Consent Framework) data
export type TCFData = {
  gdpr?: 0 | 1;
  tcString?: string;
  npa: 0 | 1; // Non-Personalized Ads flag
};

// Storage interface
export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

// DOM overlay elements
export type OverlayElements = {
  overlay: HTMLElement;
  slot: HTMLElement;
  video: HTMLVideoElement;
  closeBtn: HTMLElement;
};

// Session tracking data
export type SessionData = {
  lastShown: number;
  count: number;
};

// Cache entry for remote config
export type CacheEntry = {
  data: GBRemoteConfig;
  etag: string;
  timestamp: number;
};

// Ad kind type
export type AdKind = 'interstitial' | 'rewarded';

// Internal SDK state
export type SDKState = {
  initialized: boolean;
  config: GBInit;
  remoteConfig?: GBRemoteConfig;
  adapter?: Adapter;
  overlay?: OverlayElements;
  sessionData: Record<AdKind, SessionData>;
};

// Network request options
export type RequestOptions = {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
};

// Network response
export type NetworkResponse = {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  text(): Promise<string>;
  json(): Promise<any>;
};

// Game metadata for auto-detection
export type GameMetadata = {
  gameId: string;
  gameTitle: string;
  category?: string;
  tags?: string[];
  version?: string;
  domain?: string;
  portalUrl?: string;
  uploadedAt?: string;
  detectionMethod?: 'injected' | 'meta_tags' | 'url';
};


