/**
 * GBSDK - GameBuster Ads SDK
 * Production-ready, zero-dependency in-game ads SDK
 *
 * @version 1.0.0
 * @author GameBuster
 * @license MIT
 */

// Main SDK class
export { GBSDK } from './gbsdk.js';

// Types for TypeScript users
export type {
  GBInit,
  ShowOk,
  ShowNo,
  GBEvent,
  GBEventListener,
  GBRemoteConfig,
  Adapter,
  PlayCtx,
  TCFData,
  AdKind,
} from './types.js';

// Utilities that might be useful for advanced users
export { getTCF } from './utils/tcf.js';
export { SDK_VERSION } from './utils/version.js';

// Default export for convenience
export { GBSDK as default } from './gbsdk.js';
