/**
 * TCF (Transparency and Consent Framework) utilities
 */

import type { TCFData } from '../types.js';

// TCF API interface
interface TCFApi {
  (command: string, version: number, callback: (tcData: any, success: boolean) => void): void;
}

declare global {
  interface Window {
    __tcfapi?: TCFApi;
  }
}

/**
 * Get TCF consent data
 * Returns { gdpr?: 0|1; tcString?: string; npa: 0|1 }
 */
export function getTCF(): Promise<TCFData> {
  return new Promise(resolve => {
    // Default to no personalization restrictions if no TCF
    const defaultResult: TCFData = { npa: 0 };

    // Check if TCF API is available
    if (typeof window.__tcfapi !== 'function') {
      resolve(defaultResult);
      return;
    }

    // Get TCF data with timeout
    const timeout = setTimeout(() => {
      resolve(defaultResult);
    }, 1000);

    try {
      window.__tcfapi!('getTCData', 2, (tcData, success) => {
        clearTimeout(timeout);

        if (!success || !tcData) {
          resolve(defaultResult);
          return;
        }

        const result: TCFData = {
          gdpr: tcData.gdprApplies ? 1 : 0,
          tcString: tcData.tcString,
          npa: 0, // Default to personalized ads allowed
        };

        // Check if GDPR applies and Purpose 1 (Store and/or access information) is not granted
        if (tcData.gdprApplies && tcData.purpose && tcData.purpose.consents) {
          // Purpose 1 is for storing/accessing information on device
          const purpose1Granted = tcData.purpose.consents['1'] === true;

          if (!purpose1Granted) {
            result.npa = 1; // Non-personalized ads
          }
        }

        resolve(result);
      });
    } catch (error) {
      clearTimeout(timeout);
      console.warn('GBSDK: Error getting TCF data:', error);
      resolve(defaultResult);
    }
  });
}

/**
 * Check if we have valid consent for personalized ads
 */
export function hasPersonalizedAdsConsent(tcData: TCFData): boolean {
  // If GDPR doesn't apply, assume consent
  if (tcData.gdpr === 0) return true;

  // If NPA flag is set, no personalized ads
  if (tcData.npa === 1) return false;

  return true;
}
