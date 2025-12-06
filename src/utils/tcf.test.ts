/**
 * TCF (Transparency & Consent Framework) utilities tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getTCF } from './tcf';

describe('TCF Utilities', () => {
  beforeEach(() => {
    // Clear any existing __tcfapi
    delete (window as any).__tcfapi;
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('getTCF', () => {
    it('should return default values when TCF API is not available', async () => {
      const result = await getTCF();
      
      expect(result).toEqual({ npa: 0 });
    });

    it('should get TCF data when API is available', async () => {
      const mockTCFData = {
        gdprApplies: true,
        tcString: 'TCSTRING123',
        purpose: {
          consents: {
            1: true, // Storage and access
          },
        },
      };

      (window as any).__tcfapi = (command: string, version: number, callback: Function) => {
        if (command === 'getTCData') {
          callback(mockTCFData, true);
        }
      };

      const result = await getTCF();
      
      expect(result.gdpr).toBe(1);
      expect(result.tcString).toBe('TCSTRING123');
      expect(result.npa).toBe(0);
    });

    it('should set npa=1 when consent for purpose 1 is denied', async () => {
      const mockTCFData = {
        gdprApplies: true,
        tcString: 'TCSTRING123',
        purpose: {
          consents: {
            1: false, // Storage and access denied
          },
        },
      };

      (window as any).__tcfapi = (command: string, version: number, callback: Function) => {
        if (command === 'getTCData') {
          callback(mockTCFData, true);
        }
      };

      const result = await getTCF();
      
      expect(result.npa).toBe(1);
    });

    it('should handle GDPR not applying', async () => {
      const mockTCFData = {
        gdprApplies: false,
        tcString: '',
        purpose: {
          consents: {},
        },
      };

      (window as any).__tcfapi = (command: string, version: number, callback: Function) => {
        if (command === 'getTCData') {
          callback(mockTCFData, true);
        }
      };

      const result = await getTCF();
      
      expect(result.gdpr).toBe(0);
      expect(result.npa).toBe(0);
    });

    it('should timeout after 1 second', async () => {
      vi.useFakeTimers();

      (window as any).__tcfapi = (command: string, version: number, callback: Function) => {
        // Never call callback
      };

      const promise = getTCF();
      
      vi.advanceTimersByTime(1000);
      
      const result = await promise;
      
      expect(result).toEqual({ npa: 0 });
      
      vi.useRealTimers();
    });

    it('should handle TCF API errors gracefully', async () => {
      (window as any).__tcfapi = (command: string, version: number, callback: Function) => {
        throw new Error('TCF API error');
      };

      const result = await getTCF();
      
      expect(result).toEqual({ npa: 0 });
    });

    it('should handle invalid TCF data', async () => {
      (window as any).__tcfapi = (command: string, version: number, callback: Function) => {
        if (command === 'getTCData') {
          callback(null, false);
        }
      };

      const result = await getTCF();
      
      expect(result).toEqual({ npa: 0 });
    });

    it('should handle missing purpose consents', async () => {
      const mockTCFData = {
        gdprApplies: true,
        tcString: 'TCSTRING123',
        purpose: {
          consents: {}, // No consents
        },
      };

      (window as any).__tcfapi = (command: string, version: number, callback: Function) => {
        if (command === 'getTCData') {
          callback(mockTCFData, true);
        }
      };

      const result = await getTCF();
      
      expect(result.gdpr).toBe(1);
      expect(result.tcString).toBe('TCSTRING123');
      expect(result.npa).toBe(1); // Should be 1 when purpose 1 is not explicitly true
    });

    it('should handle missing purpose object', async () => {
      const mockTCFData = {
        gdprApplies: true,
        tcString: 'TCSTRING123',
        // No purpose object
      };

      (window as any).__tcfapi = (command: string, version: number, callback: Function) => {
        if (command === 'getTCData') {
          callback(mockTCFData, true);
        }
      };

      const result = await getTCF();
      
      expect(result.gdpr).toBe(1);
      expect(result.tcString).toBe('TCSTRING123');
      expect(result.npa).toBe(0);
    });
  });
});

