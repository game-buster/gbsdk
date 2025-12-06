/**
 * Event emitter tests
 */

import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from './events';

describe('EventEmitter', () => {
  describe('on', () => {
    it('should register event listener', () => {
      const emitter = new EventEmitter();
      const listener = vi.fn();
      
      emitter.on('test', listener);
      
      expect(emitter.hasListeners('test')).toBe(true);
      expect(emitter.listenerCount('test')).toBe(1);
    });

    it('should register multiple listeners for same event', () => {
      const emitter = new EventEmitter();
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      emitter.on('test', listener1);
      emitter.on('test', listener2);
      
      expect(emitter.listenerCount('test')).toBe(2);
    });

    it('should not register same listener twice', () => {
      const emitter = new EventEmitter();
      const listener = vi.fn();
      
      emitter.on('test', listener);
      emitter.on('test', listener);
      
      expect(emitter.listenerCount('test')).toBe(1);
    });
  });

  describe('off', () => {
    it('should remove event listener', () => {
      const emitter = new EventEmitter();
      const listener = vi.fn();
      
      emitter.on('test', listener);
      emitter.off('test', listener);
      
      expect(emitter.hasListeners('test')).toBe(false);
    });

    it('should only remove specified listener', () => {
      const emitter = new EventEmitter();
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      emitter.on('test', listener1);
      emitter.on('test', listener2);
      emitter.off('test', listener1);
      
      expect(emitter.listenerCount('test')).toBe(1);
    });

    it('should handle removing non-existent listener', () => {
      const emitter = new EventEmitter();
      const listener = vi.fn();
      
      expect(() => emitter.off('test', listener)).not.toThrow();
    });
  });

  describe('emit', () => {
    it('should call all registered listeners', () => {
      const emitter = new EventEmitter();
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      emitter.on('test', listener1);
      emitter.on('test', listener2);
      emitter.emit('test');
      
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should pass data to listeners', () => {
      const emitter = new EventEmitter();
      const listener = vi.fn();
      const data = { foo: 'bar' };
      
      emitter.on('test', listener);
      emitter.emit('test', data);
      
      expect(listener).toHaveBeenCalledWith(data);
    });

    it('should handle listener errors gracefully', () => {
      const emitter = new EventEmitter();
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const goodListener = vi.fn();
      
      emitter.on('test', errorListener);
      emitter.on('test', goodListener);
      
      expect(() => emitter.emit('test')).not.toThrow();
      expect(goodListener).toHaveBeenCalled();
    });

    it('should not throw when emitting event with no listeners', () => {
      const emitter = new EventEmitter();
      
      expect(() => emitter.emit('test')).not.toThrow();
    });

    it('should call listeners in order of registration', () => {
      const emitter = new EventEmitter();
      const calls: number[] = [];
      
      emitter.on('test', () => calls.push(1));
      emitter.on('test', () => calls.push(2));
      emitter.on('test', () => calls.push(3));
      
      emitter.emit('test');
      
      expect(calls).toEqual([1, 2, 3]);
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners for specific event', () => {
      const emitter = new EventEmitter();
      
      emitter.on('test1', vi.fn());
      emitter.on('test1', vi.fn());
      emitter.on('test2', vi.fn());
      
      emitter.removeAllListeners('test1');
      
      expect(emitter.hasListeners('test1')).toBe(false);
      expect(emitter.hasListeners('test2')).toBe(true);
    });

    it('should remove all listeners for all events', () => {
      const emitter = new EventEmitter();
      
      emitter.on('test1', vi.fn());
      emitter.on('test2', vi.fn());
      emitter.on('test3', vi.fn());
      
      emitter.removeAllListeners();
      
      expect(emitter.hasListeners('test1')).toBe(false);
      expect(emitter.hasListeners('test2')).toBe(false);
      expect(emitter.hasListeners('test3')).toBe(false);
    });
  });

  describe('listenerCount', () => {
    it('should return correct count', () => {
      const emitter = new EventEmitter();
      
      expect(emitter.listenerCount('test')).toBe(0);
      
      emitter.on('test', vi.fn());
      expect(emitter.listenerCount('test')).toBe(1);
      
      emitter.on('test', vi.fn());
      expect(emitter.listenerCount('test')).toBe(2);
    });
  });

  describe('hasListeners', () => {
    it('should return true when listeners exist', () => {
      const emitter = new EventEmitter();
      
      emitter.on('test', vi.fn());
      
      expect(emitter.hasListeners('test')).toBe(true);
    });

    it('should return false when no listeners exist', () => {
      const emitter = new EventEmitter();
      
      expect(emitter.hasListeners('test')).toBe(false);
    });
  });

  describe('eventNames', () => {
    it('should return all event names', () => {
      const emitter = new EventEmitter();
      
      emitter.on('test1', vi.fn());
      emitter.on('test2', vi.fn());
      emitter.on('test3', vi.fn());
      
      const names = emitter.eventNames();
      
      expect(names).toContain('test1');
      expect(names).toContain('test2');
      expect(names).toContain('test3');
      expect(names.length).toBe(3);
    });

    it('should return empty array when no events', () => {
      const emitter = new EventEmitter();
      
      expect(emitter.eventNames()).toEqual([]);
    });
  });
});

