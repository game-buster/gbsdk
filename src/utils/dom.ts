/**
 * DOM utilities for GBSDK overlay management
 */

import type { OverlayElements } from '../types.js';

// Track the currently focused element before showing overlay
let previouslyFocusedElement: HTMLElement | null = null;

/**
 * Create or get the overlay elements
 */
export function ensureOverlay(): OverlayElements {
  let overlay = document.getElementById('gbsdk-overlay') as HTMLElement;
  
  if (!overlay) {
    overlay = createOverlay();
  }
  
  const slot = overlay.querySelector('#gbsdk-slot') as HTMLElement;
  const video = overlay.querySelector('#gbsdk-video') as HTMLVideoElement;
  const closeBtn = overlay.querySelector('#gbsdk-close') as HTMLElement;
  
  if (!slot || !video || !closeBtn) {
    throw new Error('GBSDK: Overlay elements not found');
  }
  
  return { overlay, slot, video, closeBtn };
}

/**
 * Create the overlay DOM structure
 */
function createOverlay(): HTMLElement {
  const overlay = document.createElement('div');
  overlay.id = 'gbsdk-overlay';
  overlay.className = 'gbsdk-overlay';
  overlay.style.display = 'none';
  
  // Create slot container
  const slot = document.createElement('div');
  slot.id = 'gbsdk-slot';
  slot.className = 'gbsdk-slot';
  
  // Create video element
  const video = document.createElement('video');
  video.id = 'gbsdk-video';
  video.className = 'gbsdk-video';
  video.muted = true;
  video.playsInline = true;
  video.controls = false;
  
  // Create close button
  const closeBtn = document.createElement('button');
  closeBtn.id = 'gbsdk-close';
  closeBtn.className = 'gbsdk-close';
  closeBtn.innerHTML = '×';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.type = 'button';
  
  // Assemble structure
  slot.appendChild(video);
  overlay.appendChild(slot);
  overlay.appendChild(closeBtn);
  
  // Add to document
  document.body.appendChild(overlay);
  
  return overlay;
}

/**
 * Show the overlay
 */
export function showOverlay(overlay: HTMLElement): void {
  // Store currently focused element
  previouslyFocusedElement = document.activeElement as HTMLElement;
  
  // Show overlay
  overlay.style.display = 'flex';
  
  // Focus the close button for accessibility
  const closeBtn = overlay.querySelector('#gbsdk-close') as HTMLElement;
  if (closeBtn) {
    closeBtn.focus();
  }
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

/**
 * Hide the overlay
 */
export function hideOverlay(overlay: HTMLElement): void {
  // Hide overlay
  overlay.style.display = 'none';
  
  // Restore body scroll
  document.body.style.overflow = '';
  
  // Restore focus to previously focused element
  if (previouslyFocusedElement && document.contains(previouslyFocusedElement)) {
    try {
      previouslyFocusedElement.focus();
    } catch (error) {
      // Focus might fail, ignore
    }
  }
  
  previouslyFocusedElement = null;
}

/**
 * Clean up video element
 */
export function cleanupVideo(video: HTMLVideoElement): void {
  try {
    video.pause();
    video.src = '';
    video.load();
  } catch (error) {
    // Ignore cleanup errors
  }
}

/**
 * Get overlay dimensions for ad sizing
 */
export function getOverlayDimensions(overlay: HTMLElement): { width: number; height: number } {
  const rect = overlay.getBoundingClientRect();
  return {
    width: rect.width || window.innerWidth,
    height: rect.height || window.innerHeight,
  };
}

/**
 * Calculate 16:9 video dimensions within container
 */
export function calculate16x9Dimensions(
  containerWidth: number,
  containerHeight: number,
  maxWidth = 960
): { width: number; height: number } {
  const aspectRatio = 16 / 9;
  
  // Start with max width constraint
  let width = Math.min(containerWidth * 0.9, maxWidth);
  let height = width / aspectRatio;
  
  // If height is too tall, constrain by height instead
  if (height > containerHeight * 0.8) {
    height = containerHeight * 0.8;
    width = height * aspectRatio;
  }
  
  return { width: Math.floor(width), height: Math.floor(height) };
}
