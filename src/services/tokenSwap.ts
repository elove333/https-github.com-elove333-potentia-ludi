import { TokenSwap } from '../types';

interface SwapRoute {
  dex: string;
  path: string[];
  estimatedOutput: string;
}

class TokenSwapService {
  private swapHistory: TokenSwap[] = [];
  private swapByIdMap: Map<string, TokenSwap> = new Map(); // Track swaps by unique ID
  private latestSwapPerPairMap: Map<string, TokenSwap> = new Map(); // Track latest swap per pair

  /**
   * Generate a consistent key for token pair lookups
   */
  private getSwapKey(fromToken: string, toToken: string): string {
    // Use pipe delimiter which is safe for addresses
    return `${fromToken.toLowerCase()}|${toToken.toLowerCase()}`;
  }

  /**
   * Generate a unique ID for a swap
   */
  private generateSwapId(): string {
    return `swap-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
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
    const route = await this.getBestRoute(chainId, fromToken, toToken, amount);

    const swap: TokenSwap = {
      id: this.generateSwapId(),
      fromToken,
      toToken,
      amount,
      estimatedOutput: route.estimatedOutput,
      route: route.path,
      slippage,
      status: 'pending',
    };

    this.swapHistory.push(swap);
    
    // Store by unique ID for tracking individual swaps
    this.swapByIdMap.set(swap.id, swap);
    
    // Update latest swap per pair for quick status lookups
    const pairKey = this.getSwapKey(fromToken, toToken);
    this.latestSwapPerPairMap.set(pairKey, swap);

    // In production, this would execute the actual swap
    // For demo, simulate completion after delay
    setTimeout(() => {
      // Update status using the unique ID to avoid race conditions
      const swapToUpdate = this.swapByIdMap.get(swap.id);
      if (swapToUpdate) {
        swapToUpdate.status = 'completed';
        // Update latest per pair if this is still the latest
        const currentLatest = this.latestSwapPerPairMap.get(pairKey);
        if (currentLatest?.id === swap.id) {
          this.latestSwapPerPairMap.set(pairKey, swapToUpdate);
        }
      }
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
   * Get swap history
   */
  getSwapHistory(): TokenSwap[] {
    return this.swapHistory;
  }

  /**
   * Get swap status by token pair (returns latest swap for that pair)
   */
  getSwapStatus(fromToken: string, toToken: string): TokenSwap | undefined {
    // Use consistent key generation for O(1) lookup of latest swap per pair
    return this.latestSwapPerPairMap.get(this.getSwapKey(fromToken, toToken));
  }

  /**
   * Get swap by unique ID
   */
  getSwapById(id: string): TokenSwap | undefined {
    return this.swapByIdMap.get(id);
  }
}

export const tokenSwapService = new TokenSwapService();
