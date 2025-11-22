/**
 * Revenue Tracking Utilities
 * Tracks ad impressions and revenue for developer payouts
 */

export interface AdImpressionData {
  gameId: string;
  developerId: string;
  adType: 'interstitial' | 'rewarded';
  adNetwork: string; // e.g., 'FilthySelection', 'GameBuster', 'AdButler'
  timestamp: number;
  sessionId: string;
  userAgent: string;
  referrer: string;
  // Revenue data (if available from ad network callbacks)
  revenue?: number;
  currency?: string;
}

/**
 * Send ad impression data to tracking backend
 */
export async function trackAdImpression(
  trackingUrl: string,
  data: AdImpressionData
): Promise<void> {
  try {
    // Use sendBeacon for reliability (works even if page is closing)
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon(trackingUrl, blob);
    } else {
      // Fallback to fetch
      await fetch(trackingUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true,
      });
    }
  } catch (error) {
    // Silent fail - don't break ad flow
    console.warn('Failed to track ad impression:', error);
  }
}

/**
 * Generate a session ID for tracking
 */
export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Extract ad network name from tag URL
 */
export function getAdNetworkFromTag(tagUrl: string): string {
  if (tagUrl.includes('filthyselection')) return 'FilthySelection';
  if (tagUrl.includes('doubleclick.net') || tagUrl.includes('googlesyndication'))
    return 'GameBuster';
  if (tagUrl.includes('adbutler')) return 'AdButler';
  if (tagUrl.includes('youradexchange')) return 'YourAdExchange';
  return 'Unknown';
}

