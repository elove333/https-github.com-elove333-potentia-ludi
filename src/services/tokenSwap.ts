import { TokenSwap } from '../types';
import { telemetryService } from './telemetry';

interface SwapRoute {
  dex: string;
  path: string[];
  estimatedOutput: string;
}

export interface TokenSwapServiceConfig {
  swapTTLMs?: number;       // TTL for completed/failed swaps (default: 24 hours)
  maxPerPair?: number;      // Max swaps to retain per pair (default: 50)
  enableAutoCleanup?: boolean; // Enable periodic TTL cleanup (default: true)
  cleanupInterval?: number; // Cleanup interval in ms (default: 5 minutes)
}

const DEFAULT_SWAP_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_MAX_PER_PAIR = 50;
const DEFAULT_CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

class TokenSwapService {
  private swapHistory: Map<string, TokenSwap[]> = new Map();
  private swapByIdMap: Map<string, TokenSwap> = new Map();
  private latestSwapPerPairMap: Map<string, TokenSwap> = new Map();
  private swapCounter: number = 0;
  private swapTTLMs: number;
  private maxPerPair: number;
  private enableAutoCleanup: boolean;
  private cleanupIntervalMs: number;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: TokenSwapServiceConfig = {}) {
    this.swapTTLMs = config.swapTTLMs ?? DEFAULT_SWAP_TTL_MS;
    this.maxPerPair = config.maxPerPair ?? DEFAULT_MAX_PER_PAIR;
    this.enableAutoCleanup = config.enableAutoCleanup ?? true;
    this.cleanupIntervalMs = config.cleanupInterval ?? DEFAULT_CLEANUP_INTERVAL_MS;

    if (this.enableAutoCleanup) {
      this.startAutoCleanup();
    }
  }

  /**
   * Add a swap entry, enforcing per-pair capacity limits and updating lookup maps.
   * Oldest swaps beyond maxPerPair are evicted from all structures.
   */
  private addOrEvictSwap(swap: TokenSwap): void {
    this.swapByIdMap.set(swap.id, swap);

    const pairSwaps = this.swapHistory.get(swap.pair) ?? [];
    pairSwaps.push(swap);

    // Sort descending by timestamp; use the monotonic counter embedded in the ID
    // as a tiebreaker so that swaps created in the same millisecond are ordered
    // correctly (higher counter = more recent).
    // ID format: "swap-{timestamp}-{counter}" — counter is the last segment.
    const getSeq = (swap: TokenSwap): number => {
      const parts = swap.id.split('-');
      return parseInt(parts[parts.length - 1], 10) || 0;
    };
    pairSwaps.sort((a, b) => {
      const timeDiff = b.timestamp - a.timestamp;
      return timeDiff !== 0 ? timeDiff : getSeq(b) - getSeq(a);
    });
    const kept = pairSwaps.slice(0, this.maxPerPair);
    this.swapHistory.set(swap.pair, kept);

    // Update the latest-swap map with the most recent entry for this pair
    this.latestSwapPerPairMap.set(swap.pair, kept[0]);

    // Remove evicted swaps from the ID map
    const evicted = pairSwaps.slice(this.maxPerPair);
    for (const evictedSwap of evicted) {
      this.swapByIdMap.delete(evictedSwap.id);
    }
  }

  /**
   * Remove completed/failed swaps older than the configured TTL.
   * Returns the number of entries removed.
   */
  pruneExpiredSwaps(): number {
    const now = Date.now();
    let removed = 0;

    for (const id of Array.from(this.swapByIdMap.keys())) {
      const swap = this.swapByIdMap.get(id);
      if (swap && swap.status !== 'pending' && now - swap.timestamp > this.swapTTLMs) {
        this.swapByIdMap.delete(id);
        removed++;

        // Evict from pair history
        const pairSwaps = this.swapHistory.get(swap.pair);
        if (pairSwaps) {
          const updated = pairSwaps.filter((s) => s.id !== id);
          if (updated.length > 0) {
            this.swapHistory.set(swap.pair, updated);
          } else {
            this.swapHistory.delete(swap.pair);
          }
        }

        // Evict from latest-per-pair map if this was the latest entry
        const latest = this.latestSwapPerPairMap.get(swap.pair);
        if (latest?.id === id) {
          this.latestSwapPerPairMap.delete(swap.pair);
        }
      }
    }

    return removed;
  }

  /**
   * Start periodic TTL-based cleanup
   */
  private startAutoCleanup(): void {
    if (this.cleanupTimer) {
      return;
    }
    this.cleanupTimer = setInterval(() => {
      const removed = this.pruneExpiredSwaps();
      if (removed > 0 && process.env.NODE_ENV === 'development') {
        console.log(`TokenSwapService: Pruned ${removed} expired swap(s)`);
      }
    }, this.cleanupIntervalMs);
  }

  /**
   * Stop periodic TTL-based cleanup
   */
  stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Get the best swap route across multiple DEXs
   */
  async getBestRoute(
    _chainId: number,
    fromToken: string,
    toToken: string,
    amount: string
  ): Promise<SwapRoute> {
    // In production, this would aggregate quotes from multiple DEX aggregators
    // like 1inch, Paraswap, Matcha, etc.
    
    // Mock implementation
    const routes = [
      {
        dex: 'Uniswap V3',
        path: [fromToken, toToken],
        estimatedOutput: (parseFloat(amount) * 0.998).toString(), // 0.2% slippage
      },
      {
        dex: 'Sushiswap',
        path: [fromToken, '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', toToken], // Route through WETH
        estimatedOutput: (parseFloat(amount) * 0.995).toString(), // 0.5% slippage
      },
    ];

    // Return best route (highest output)
    return routes.reduce((best, current) =>
      parseFloat(current.estimatedOutput) > parseFloat(best.estimatedOutput) ? current : best
    );
  }

  /**
   * Execute automatic token swap
   */
  async executeSwap(
    chainId: number,
    fromToken: string,
    toToken: string,
    amount: string,
    slippage: number = 0.5
  ): Promise<TokenSwap> {
    // Emit quote requested telemetry
    telemetryService.emitQuoteRequested(chainId, fromToken, toToken, amount);
    
    const route = await this.getBestRoute(chainId, fromToken, toToken, amount);

    this.swapCounter++;
    const pair = `${fromToken}-${toToken}`;
    const now = Date.now();
    const swap: TokenSwap = {
      id: `swap-${now}-${this.swapCounter}`,
      pair,
      timestamp: now,
      fromToken,
      toToken,
      amount,
      estimatedOutput: route.estimatedOutput,
      route: route.path,
      slippage,
      status: 'pending',
    };

    this.addOrEvictSwap(swap);

    // In production, this would execute the actual swap
    // For demo, simulate completion after delay
    setTimeout(() => {
      swap.status = 'completed';
      
      // Emit swap executed telemetry
      telemetryService.emitSwapExecuted(
        chainId,
        fromToken,
        toToken,
        amount,
        route.estimatedOutput,
        route.path
      );
    }, 2000);

    return swap;
  }

  /**
   * Auto-swap tokens based on game requirements
   */
  async autoSwapForGame(
    _gameId: string,
    userBalance: Record<string, string>,
    requiredToken: string,
    requiredAmount: string,
    chainId: number = 1
  ): Promise<TokenSwap | null> {
    // Check if user has enough of the required token
    if (userBalance[requiredToken] && parseFloat(userBalance[requiredToken]) >= parseFloat(requiredAmount)) {
      return null; // No swap needed
    }

    // Find best token to swap from
    const availableTokens = Object.entries(userBalance)
      .filter(([token, balance]) => token !== requiredToken && parseFloat(balance) > 0);

    if (availableTokens.length === 0) {
      throw new Error('No tokens available for swap');
    }

    // For simplicity, use the first available token
    const [fromToken, balance] = availableTokens[0];

    // Calculate amount to swap
    const swapAmount = Math.min(parseFloat(balance), parseFloat(requiredAmount) * 1.1).toString();

    return await this.executeSwap(chainId, fromToken, requiredToken, swapAmount);
  }

  /**
   * Get all swap history as a flat array (most recent first per pair)
   */
  getSwapHistory(): TokenSwap[] {
    const all: TokenSwap[] = [];
    for (const swaps of this.swapHistory.values()) {
      all.push(...swaps);
    }
    return all;
  }

  /**
   * Get the latest swap for a given token pair, or undefined if none exists
   */
  getSwapStatus(fromToken: string, toToken: string): TokenSwap | undefined {
    const pair = `${fromToken}-${toToken}`;
    return this.latestSwapPerPairMap.get(pair);
  }

  /**
   * Get swap by ID
   */
  getSwapById(id: string): TokenSwap | undefined {
    return this.swapByIdMap.get(id);
  }

  /**
   * Get service configuration
   */
  getConfig(): {
    swapTTLMs: number;
    maxPerPair: number;
    enableAutoCleanup: boolean;
    cleanupIntervalMs: number;
    totalSwapCount: number;
    pairCount: number;
  } {
    return {
      swapTTLMs: this.swapTTLMs,
      maxPerPair: this.maxPerPair,
      enableAutoCleanup: this.enableAutoCleanup,
      cleanupIntervalMs: this.cleanupIntervalMs,
      totalSwapCount: this.swapByIdMap.size,
      pairCount: this.swapHistory.size,
    };
  }

  /**
   * Clean up all resources (call when shutting down or in tests)
   */
  cleanup(): void {
    this.stopAutoCleanup();
    this.swapHistory.clear();
    this.swapByIdMap.clear();
    this.latestSwapPerPairMap.clear();
  }
}

export const tokenSwapService = new TokenSwapService();

// Export class for custom configurations or testing
export { TokenSwapService };
