/**
 * Network utilities for GBSDK
 */

import type { NetworkResponse, RequestOptions } from '../types.js';

// Cache for loaded scripts to avoid duplicate loads
const loadedScripts = new Set<string>();

/**
 * Load a script once and cache the result
 */
export function loadScriptOnce(src: string): Promise<void> {
  if (loadedScripts.has(src)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    
    script.onload = () => {
      loadedScripts.add(src);
      resolve();
    };
    
    script.onerror = () => {
      reject(new Error(`Failed to load script: ${src}`));
    };
    
    document.head.appendChild(script);
  });
}

/**
 * Append query parameters to a URL
 */
export function appendQuery(url: string, params: Record<string, string | number>): string {
  const urlObj = new URL(url);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      urlObj.searchParams.set(key, String(value));
    }
  });
  
  return urlObj.toString();
}

/**
 * Simple fetch wrapper with timeout and better error handling
 */
export async function fetchWithTimeout(
  url: string, 
  options: RequestOptions = {}
): Promise<NetworkResponse> {
  const { timeout = 10000, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // Convert Headers to plain object
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });
    
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers,
      text: () => response.text(),
      json: () => response.json(),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timeout: ${url}`);
    }
    
    throw error;
  }
}

/**
 * Validate that a URL is HTTPS
 */
export function validateHttpsUrl(url: string): void {
  const urlObj = new URL(url);
  if (urlObj.protocol !== 'https:') {
    throw new Error(`GBSDK: Only HTTPS URLs are allowed: ${url}`);
  }
}

/**
 * Validate that a URL's hostname is in the allowed domains list
 */
export function validateAllowedDomain(url: string, allowedDomains: string[]): void {
  if (allowedDomains.length === 0) return;
  
  const urlObj = new URL(url);
  const hostname = urlObj.hostname;
  
  const isAllowed = allowedDomains.some(domain => {
    // Exact match or subdomain match
    return hostname === domain || hostname.endsWith(`.${domain}`);
  });
  
  if (!isAllowed) {
    throw new Error(`GBSDK: Domain not allowed: ${hostname}. Allowed: ${allowedDomains.join(', ')}`);
  }
}
