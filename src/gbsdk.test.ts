import { describe, it, expect, beforeEach } from 'vitest';
import { GBSDK } from './gbsdk';

describe('GBSDK', () => {
  let sdk: GBSDK;

  beforeEach(() => {
    sdk = new GBSDK();
  });

  describe('Initialization', () => {
    it('should create GBSDK instance', () => {
      expect(sdk).toBeDefined();
      expect(sdk).toBeInstanceOf(GBSDK);
    });
  });

  describe('Game Lifecycle', () => {
    it('should track game started', () => {
      expect(() => sdk.gameStarted()).not.toThrow();
    });

    it('should track game ended', () => {
      expect(() => sdk.gameEnded()).not.toThrow();
    });
  });

  describe('Ad Display', () => {
    it('should return error when not initialized', async () => {
      const result = await sdk.showInterstitial();
      expect(result.success).toBe(false);
      expect(result.reason).toBe('error');
    });

    it('should return error for rewarded when not initialized', async () => {
      const result = await sdk.showRewarded();
      expect(result.success).toBe(false);
      expect(result.reason).toBe('error');
    });
  });
});

