/**
 * TokenSwapService Tests
 *
 * Tests for TTL-based cleanup and capacity-based eviction to prevent
 * unbounded memory growth in long-running sessions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TokenSwapService } from '../src/services/tokenSwap';
import { TokenSwap } from '../src/types';

// Helper to build a minimal TokenSwap without calling executeSwap
function makeSwap(overrides: Partial<TokenSwap> & { id: string; pair: string; timestamp: number }): TokenSwap {
  return {
    fromToken: 'TokenA',
    toToken: 'TokenB',
    amount: '100',
    estimatedOutput: '99.8',
    route: ['TokenA', 'TokenB'],
    slippage: 0.5,
    status: 'pending',
    ...overrides,
  };
}

describe('TokenSwapService', () => {
  let service: TokenSwapService;

  beforeEach(() => {
    service = new TokenSwapService({
      maxPerPair: 5,
      swapTTLMs: 1000, // 1 second for faster testing
      enableAutoCleanup: false,
    });
  });

  afterEach(() => {
    service.cleanup();
  });

  // -----------------------------------------------------------------------
  // executeSwap
  // -----------------------------------------------------------------------
  describe('executeSwap', () => {
    it('should create a swap with id, pair, and timestamp', async () => {
      const swap = await service.executeSwap(1, 'ETH', 'USDC', '1.0');

      expect(swap.id).toBeDefined();
      expect(typeof swap.id).toBe('string');
      expect(swap.pair).toBe('ETH-USDC');
      expect(typeof swap.timestamp).toBe('number');
      expect(swap.timestamp).toBeGreaterThan(0);
      expect(swap.status).toBe('pending');
    });

    it('should generate unique IDs for each swap', async () => {
      const swap1 = await service.executeSwap(1, 'ETH', 'USDC', '1.0');
      const swap2 = await service.executeSwap(1, 'ETH', 'USDC', '2.0');

      expect(swap1.id).not.toBe(swap2.id);
    });

    it('should store swap in swapByIdMap and be retrievable', async () => {
      const swap = await service.executeSwap(1, 'ETH', 'USDC', '1.0');
      const found = service.getSwapById(swap.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(swap.id);
    });

    it('should update latestSwapPerPairMap so getSwapStatus returns the swap', async () => {
      await service.executeSwap(1, 'ETH', 'USDC', '1.0');
      const latest = service.getSwapStatus('ETH', 'USDC');

      expect(latest).toBeDefined();
      expect(latest?.pair).toBe('ETH-USDC');
    });
  });

  // -----------------------------------------------------------------------
  // Capacity-based eviction (addOrEvictSwap)
  // -----------------------------------------------------------------------
  describe('Capacity-based Eviction (maxPerPair)', () => {
    it('should not exceed maxPerPair entries per pair', async () => {
      for (let i = 0; i < 8; i++) {
        await service.executeSwap(1, 'ETH', 'USDC', String(i + 1));
      }

      const history = service.getSwapHistory();
      const pairSwaps = history.filter((s) => s.pair === 'ETH-USDC');
      expect(pairSwaps.length).toBeLessThanOrEqual(5);
    });

    it('should remove evicted swaps from swapByIdMap', async () => {
      const swaps: TokenSwap[] = [];
      for (let i = 0; i < 7; i++) {
        swaps.push(await service.executeSwap(1, 'ETH', 'USDC', String(i + 1)));
      }

      // Only the 5 most recent should remain in the ID map for this pair
      let found = 0;
      for (const swap of swaps) {
        if (service.getSwapById(swap.id)) found++;
      }
      expect(found).toBeLessThanOrEqual(5);
    });

    it('should keep the most recent entries, not oldest', async () => {
      const swaps: TokenSwap[] = [];
      for (let i = 0; i < 7; i++) {
        swaps.push(await service.executeSwap(1, 'ETH', 'USDC', String(i + 1)));
      }

      // The 5 most recent (indices 2–6) should be present
      for (let i = 2; i < 7; i++) {
        expect(service.getSwapById(swaps[i].id)).toBeDefined();
      }
    });

    it('should track multiple pairs independently', async () => {
      for (let i = 0; i < 7; i++) {
        await service.executeSwap(1, 'ETH', 'USDC', String(i + 1));
        await service.executeSwap(1, 'BTC', 'ETH', String(i + 1));
      }

      const ethUsdcSwaps = service.getSwapHistory().filter((s) => s.pair === 'ETH-USDC');
      const btcEthSwaps = service.getSwapHistory().filter((s) => s.pair === 'BTC-ETH');

      expect(ethUsdcSwaps.length).toBeLessThanOrEqual(5);
      expect(btcEthSwaps.length).toBeLessThanOrEqual(5);
    });

    it('should update latestSwapPerPairMap to the most recent entry', async () => {
      const swaps: TokenSwap[] = [];
      for (let i = 0; i < 3; i++) {
        swaps.push(await service.executeSwap(1, 'ETH', 'USDC', String(i + 1)));
      }

      const latest = service.getSwapStatus('ETH', 'USDC');
      expect(latest?.id).toBe(swaps[2].id);
    });
  });

  // -----------------------------------------------------------------------
  // TTL-based cleanup (pruneExpiredSwaps)
  // -----------------------------------------------------------------------
  describe('TTL Cleanup (pruneExpiredSwaps)', () => {
    it('should not remove pending swaps even if they are old', async () => {
      const swap = await service.executeSwap(1, 'ETH', 'USDC', '1.0');
      // Force an old timestamp but keep status as pending
      swap.timestamp = Date.now() - 2000; // 2 seconds ago, beyond 1s TTL

      const removed = service.pruneExpiredSwaps();
      expect(removed).toBe(0);
      expect(service.getSwapById(swap.id)).toBeDefined();
    });

    it('should remove completed swaps older than TTL', async () => {
      const swap = await service.executeSwap(1, 'ETH', 'USDC', '1.0');
      swap.status = 'completed';
      swap.timestamp = Date.now() - 2000; // 2 seconds ago, beyond 1s TTL

      const removed = service.pruneExpiredSwaps();
      expect(removed).toBe(1);
      expect(service.getSwapById(swap.id)).toBeUndefined();
    });

    it('should remove failed swaps older than TTL', async () => {
      const swap = await service.executeSwap(1, 'ETH', 'USDC', '1.0');
      swap.status = 'failed';
      swap.timestamp = Date.now() - 2000; // beyond TTL

      const removed = service.pruneExpiredSwaps();
      expect(removed).toBe(1);
      expect(service.getSwapById(swap.id)).toBeUndefined();
    });

    it('should not remove completed swaps within TTL', async () => {
      const swap = await service.executeSwap(1, 'ETH', 'USDC', '1.0');
      swap.status = 'completed';
      // timestamp is fresh (within TTL)

      const removed = service.pruneExpiredSwaps();
      expect(removed).toBe(0);
      expect(service.getSwapById(swap.id)).toBeDefined();
    });

    it('should remove expired swap from pair history', async () => {
      const swap = await service.executeSwap(1, 'ETH', 'USDC', '1.0');
      swap.status = 'completed';
      swap.timestamp = Date.now() - 2000;

      service.pruneExpiredSwaps();

      const history = service.getSwapHistory();
      expect(history.find((s) => s.id === swap.id)).toBeUndefined();
    });

    it('should clear latestSwapPerPairMap entry when that swap expires and no newer exists', async () => {
      const swap = await service.executeSwap(1, 'ETH', 'USDC', '1.0');
      swap.status = 'completed';
      swap.timestamp = Date.now() - 2000;

      service.pruneExpiredSwaps();

      expect(service.getSwapStatus('ETH', 'USDC')).toBeUndefined();
    });

    it('should return count of removed swaps', async () => {
      for (let i = 0; i < 3; i++) {
        const s = await service.executeSwap(1, 'ETH', 'USDC', String(i + 1));
        s.status = 'completed';
        s.timestamp = Date.now() - 2000;
      }
      // Add one recent swap
      await service.executeSwap(1, 'ETH', 'USDC', '10.0');

      const removed = service.pruneExpiredSwaps();
      expect(removed).toBe(3);
    });
  });

  // -----------------------------------------------------------------------
  // Auto cleanup
  // -----------------------------------------------------------------------
  describe('Automatic Cleanup', () => {
    it('should automatically prune expired swaps at the configured interval', async () => {
      vi.useFakeTimers();

      const autoService = new TokenSwapService({
        swapTTLMs: 100,      // 100ms TTL
        maxPerPair: 50,
        enableAutoCleanup: true,
        cleanupInterval: 200, // 200ms
      });

      try {
        const swap = await autoService.executeSwap(1, 'ETH', 'USDC', '1.0');
        swap.status = 'completed';
        swap.timestamp = Date.now() - 200; // already expired

        vi.advanceTimersByTime(250); // trigger the cleanup interval

        expect(autoService.getSwapById(swap.id)).toBeUndefined();
      } finally {
        autoService.cleanup();
        vi.useRealTimers();
      }
    });
  });

  // -----------------------------------------------------------------------
  // getSwapHistory / getSwapStatus
  // -----------------------------------------------------------------------
  describe('getSwapHistory', () => {
    it('should return all swaps across all pairs', async () => {
      await service.executeSwap(1, 'ETH', 'USDC', '1.0');
      await service.executeSwap(1, 'BTC', 'ETH', '0.5');

      const history = service.getSwapHistory();
      expect(history.length).toBe(2);
    });

    it('should return empty array when no swaps exist', () => {
      expect(service.getSwapHistory()).toEqual([]);
    });
  });

  describe('getSwapStatus', () => {
    it('should return undefined for an unknown pair', () => {
      expect(service.getSwapStatus('UNKNOWN', 'PAIR')).toBeUndefined();
    });

    it('should return the latest swap for a known pair', async () => {
      await service.executeSwap(1, 'ETH', 'USDC', '1.0');
      const second = await service.executeSwap(1, 'ETH', 'USDC', '2.0');

      const latest = service.getSwapStatus('ETH', 'USDC');
      expect(latest?.id).toBe(second.id);
    });
  });

  // -----------------------------------------------------------------------
  // cleanup / getConfig
  // -----------------------------------------------------------------------
  describe('cleanup', () => {
    it('should clear all internal state', async () => {
      await service.executeSwap(1, 'ETH', 'USDC', '1.0');
      service.cleanup();

      expect(service.getSwapHistory()).toEqual([]);
      expect(service.getSwapStatus('ETH', 'USDC')).toBeUndefined();
      expect(service.getConfig().totalSwapCount).toBe(0);
    });
  });

  describe('getConfig', () => {
    it('should return correct configuration', () => {
      const config = service.getConfig();
      expect(config.maxPerPair).toBe(5);
      expect(config.swapTTLMs).toBe(1000);
      expect(config.enableAutoCleanup).toBe(false);
      expect(config.totalSwapCount).toBe(0);
      expect(config.pairCount).toBe(0);
    });

    it('should reflect swap counts after adding swaps', async () => {
      await service.executeSwap(1, 'ETH', 'USDC', '1.0');
      await service.executeSwap(1, 'BTC', 'ETH', '0.5');

      const config = service.getConfig();
      expect(config.totalSwapCount).toBe(2);
      expect(config.pairCount).toBe(2);
    });
  });

  // -----------------------------------------------------------------------
  // autoSwapForGame
  // -----------------------------------------------------------------------
  describe('autoSwapForGame', () => {
    it('should return null when enough of the required token is already held', async () => {
      const result = await service.autoSwapForGame(
        'game1',
        { USDC: '200' },
        'USDC',
        '100',
        1
      );
      expect(result).toBeNull();
    });

    it('should execute a swap when required token balance is insufficient', async () => {
      const result = await service.autoSwapForGame(
        'game1',
        { ETH: '10' },
        'USDC',
        '100',
        1
      );
      expect(result).not.toBeNull();
      expect(result?.toToken).toBe('USDC');
      expect(result?.fromToken).toBe('ETH');
    });

    it('should throw when no tokens are available for swap', async () => {
      await expect(
        service.autoSwapForGame('game1', {}, 'USDC', '100', 1)
      ).rejects.toThrow('No tokens available for swap');
    });
  });

  // -----------------------------------------------------------------------
  // Long-running memory bounded behaviour
  // -----------------------------------------------------------------------
  describe('Memory bounded behaviour', () => {
    it('should keep memory bounded over many swaps on the same pair', async () => {
      for (let i = 0; i < 100; i++) {
        await service.executeSwap(1, 'ETH', 'USDC', String(i + 1));
      }

      const config = service.getConfig();
      expect(config.totalSwapCount).toBeLessThanOrEqual(5); // maxPerPair = 5
      expect(config.pairCount).toBe(1);
    });

    it('should keep memory bounded over many swaps across multiple pairs', async () => {
      const tokens = ['AAA', 'BBB', 'CCC', 'DDD'];
      for (let i = 0; i < 20; i++) {
        const from = tokens[i % tokens.length];
        const to = tokens[(i + 1) % tokens.length];
        await service.executeSwap(1, from, to, '1.0');
      }

      const history = service.getSwapHistory();
      // There are 4 unique pairs (AAA-BBB, BBB-CCC, CCC-DDD, DDD-AAA),
      // each capped at 5 => at most 20 total
      expect(history.length).toBeLessThanOrEqual(20);
      const config = service.getConfig();
      expect(config.totalSwapCount).toBeLessThanOrEqual(20);
    });
  });
});
