/**
 * Storage utilities with try/catch wrappers
 */

import type { StorageAdapter } from '../types.js';

class SafeStorageAdapter implements StorageAdapter {
  constructor(private storage: Storage) {}

  getItem(key: string): string | null {
    try {
      return this.storage.getItem(key);
    } catch (error) {
      console.warn(`GBSDK: Failed to get item from storage: ${key}`, error);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      this.storage.setItem(key, value);
    } catch (error) {
      console.warn(`GBSDK: Failed to set item in storage: ${key}`, error);
    }
  }

  removeItem(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.warn(`GBSDK: Failed to remove item from storage: ${key}`, error);
    }
  }
}

// Safe wrappers for localStorage and sessionStorage
export const localStorage = new SafeStorageAdapter(window.localStorage);
export const sessionStorage = new SafeStorageAdapter(window.sessionStorage);

// Helper functions for JSON storage
export function getStoredJSON<T>(storage: StorageAdapter, key: string): T | null {
  const value = storage.getItem(key);
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn(`GBSDK: Failed to parse JSON from storage: ${key}`, error);
    return null;
  }
}

export function setStoredJSON<T>(storage: StorageAdapter, key: string, value: T): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`GBSDK: Failed to store JSON: ${key}`, error);
  }
}
