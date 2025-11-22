/**
 * Mini EventEmitter for GBSDK
 */

import type { GBEvent, GBEventListener } from './types.js';

export class EventEmitter {
  private listeners: Map<GBEvent, Set<GBEventListener>> = new Map();

  /**
   * Add an event listener
   */
  on(event: GBEvent, listener: GBEventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  /**
   * Remove an event listener
   */
  off(event: GBEvent, listener: GBEventListener): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Remove all listeners for an event, or all listeners if no event specified
   */
  removeAllListeners(event?: GBEvent): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Emit an event to all listeners
   */
  emit(event: GBEvent, data?: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      // Create a copy of listeners to avoid issues if listeners are modified during emission
      const listenersArray = Array.from(eventListeners);
      for (const listener of listenersArray) {
        try {
          listener(data);
        } catch (error) {
          console.error(`GBSDK: Error in event listener for ${event}:`, error);
        }
      }
    }
  }

  /**
   * Get the number of listeners for an event
   */
  listenerCount(event: GBEvent): number {
    const eventListeners = this.listeners.get(event);
    return eventListeners ? eventListeners.size : 0;
  }

  /**
   * Check if there are any listeners for an event
   */
  hasListeners(event: GBEvent): boolean {
    return this.listenerCount(event) > 0;
  }

  /**
   * Get all event names that have listeners
   */
  eventNames(): GBEvent[] {
    return Array.from(this.listeners.keys());
  }
}
