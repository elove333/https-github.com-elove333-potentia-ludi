/**
 * GameDetectionService Tests
 *
 * Tests for the initialization guard and cleanup behavior
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameDetectionService } from '../src/services/gameDetection';

describe('GameDetectionService', () => {
  let service: GameDetectionService;
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let setIntervalSpy: ReturnType<typeof vi.spyOn>;
  let clearIntervalSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Provide a minimal window mock so URL monitoring branches execute
    (globalThis as any).window = {
      location: { href: 'https://example.com' },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    addEventListenerSpy = vi.spyOn(globalThis.window as any, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(globalThis.window as any, 'removeEventListener');
    setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

    service = new GameDetectionService();
  });

  afterEach(() => {
    service.cleanup();
    vi.restoreAllMocks();
    delete (globalThis as any).window;
  });

  describe('init() - initialization guard', () => {
    it('should register a popstate listener on first init()', () => {
      service.init();

      const popstateCalls = addEventListenerSpy.mock.calls.filter(
        ([event]) => event === 'popstate'
      );
      expect(popstateCalls).toHaveLength(1);
    });

    it('should start exactly one interval timer on first init()', () => {
      service.init();
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    });

    it('should NOT register duplicate popstate listeners on repeated init() calls', () => {
      service.init();
      service.init();
      service.init();

      const popstateCalls = addEventListenerSpy.mock.calls.filter(
        ([event]) => event === 'popstate'
      );
      expect(popstateCalls).toHaveLength(1);
    });

    it('should NOT start additional interval timers on repeated init() calls', () => {
      service.init();
      service.init();
      service.init();

      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup()', () => {
    it('should remove the popstate listener', () => {
      service.init();
      service.cleanup();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'popstate',
        expect.any(Function)
      );
    });

    it('should clear the interval timer', () => {
      service.init();
      service.cleanup();

      expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
    });

    it('should allow re-initialization after cleanup', () => {
      service.init();
      service.cleanup();

      // Reset spy call counts
      addEventListenerSpy.mockClear();
      setIntervalSpy.mockClear();

      service.init();

      const popstateCalls = addEventListenerSpy.mock.calls.filter(
        ([event]) => event === 'popstate'
      );
      expect(popstateCalls).toHaveLength(1);
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    });

    it('should be safe to call cleanup() without prior init()', () => {
      expect(() => service.cleanup()).not.toThrow();
    });

    it('should be safe to call cleanup() multiple times', () => {
      service.init();
      expect(() => {
        service.cleanup();
        service.cleanup();
      }).not.toThrow();
    });
  });

  describe('getDetectedGames()', () => {
    it('should return empty array before any game is detected', () => {
      service.init();
      expect(service.getDetectedGames()).toEqual([]);
    });

    it('should return games added via addCustomGame()', () => {
      service.init();
      service.addCustomGame({
        id: 'test-game',
        name: 'Test Game',
        url: 'https://test.game',
        chainId: 1,
        contractAddresses: [],
        detected: true,
        lastActive: new Date(),
      });

      const games = service.getDetectedGames();
      expect(games).toHaveLength(1);
      expect(games[0].id).toBe('test-game');
    });
  });
});
