/**
 * Storage utilities tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SafeStorage, localStorage, sessionStorage, getJSON, setJSON } from './storage';

describe('Storage Utilities', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  describe('SafeStorage', () => {
    it('should get and set items', () => {
      const storage = new SafeStorage(window.localStorage);
      
      storage.setItem('test', 'value');
      expect(storage.getItem('test')).toBe('value');
    });

    it('should return null for non-existent items', () => {
      const storage = new SafeStorage(window.localStorage);
      
      expect(storage.getItem('non-existent')).toBeNull();
    });

    it('should remove items', () => {
      const storage = new SafeStorage(window.localStorage);
      
      storage.setItem('test', 'value');
      storage.removeItem('test');
      
      expect(storage.getItem('test')).toBeNull();
    });

    it('should handle storage errors gracefully', () => {
      const mockStorage = {
        getItem: () => { throw new Error('Storage error'); },
        setItem: () => { throw new Error('Storage error'); },
        removeItem: () => { throw new Error('Storage error'); },
      } as Storage;
      
      const storage = new SafeStorage(mockStorage);
      
      // Should not throw
      expect(() => storage.getItem('test')).not.toThrow();
      expect(() => storage.setItem('test', 'value')).not.toThrow();
      expect(() => storage.removeItem('test')).not.toThrow();
      
      // Should return null on error
      expect(storage.getItem('test')).toBeNull();
    });
  });

  describe('getJSON', () => {
    it('should parse JSON from storage', () => {
      const storage = new SafeStorage(window.localStorage);
      const data = { foo: 'bar', num: 123 };
      
      window.localStorage.setItem('test', JSON.stringify(data));
      
      const result = getJSON(storage, 'test');
      expect(result).toEqual(data);
    });

    it('should return null for non-existent keys', () => {
      const storage = new SafeStorage(window.localStorage);
      
      const result = getJSON(storage, 'non-existent');
      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      const storage = new SafeStorage(window.localStorage);
      
      window.localStorage.setItem('test', 'invalid json {');
      
      const result = getJSON(storage, 'test');
      expect(result).toBeNull();
    });

    it('should handle complex nested objects', () => {
      const storage = new SafeStorage(window.localStorage);
      const data = {
        nested: {
          array: [1, 2, 3],
          object: { key: 'value' },
        },
        bool: true,
        null: null,
      };
      
      window.localStorage.setItem('test', JSON.stringify(data));
      
      const result = getJSON(storage, 'test');
      expect(result).toEqual(data);
    });
  });

  describe('setJSON', () => {
    it('should stringify and store JSON', () => {
      const storage = new SafeStorage(window.localStorage);
      const data = { foo: 'bar', num: 123 };
      
      setJSON(storage, 'test', data);
      
      const stored = window.localStorage.getItem('test');
      expect(stored).toBe(JSON.stringify(data));
    });

    it('should handle complex objects', () => {
      const storage = new SafeStorage(window.localStorage);
      const data = {
        nested: { deep: { value: 'test' } },
        array: [1, 2, 3],
        bool: false,
      };
      
      setJSON(storage, 'test', data);
      
      const result = getJSON(storage, 'test');
      expect(result).toEqual(data);
    });

    it('should handle storage errors gracefully', () => {
      const mockStorage = {
        setItem: () => { throw new Error('Storage full'); },
      } as any;
      
      const storage = new SafeStorage(mockStorage);
      
      // Should not throw
      expect(() => setJSON(storage, 'test', { data: 'value' })).not.toThrow();
    });
  });

  describe('localStorage and sessionStorage', () => {
    it('should provide localStorage instance', () => {
      expect(localStorage).toBeDefined();
      expect(localStorage).toBeInstanceOf(SafeStorage);
    });

    it('should provide sessionStorage instance', () => {
      expect(sessionStorage).toBeDefined();
      expect(sessionStorage).toBeInstanceOf(SafeStorage);
    });

    it('should persist data in localStorage', () => {
      localStorage.setItem('test', 'value');
      expect(window.localStorage.getItem('test')).toBe('value');
    });

    it('should persist data in sessionStorage', () => {
      sessionStorage.setItem('test', 'value');
      expect(window.sessionStorage.getItem('test')).toBe('value');
    });
  });
});

