import { TokenSwap } from '../types';

interface SwapRoute {
  dex: string;
  path: string[];
  estimatedOutput: string;
}

class TokenSwapService {
  private swapHistory: TokenSwap[] = [];

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
    const availableRoutes = [
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
    return availableRoutes.reduce((bestRoute, currentRoute) =>
      parseFloat(currentRoute.estimatedOutput) > parseFloat(bestRoute.estimatedOutput) ? currentRoute : bestRoute
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
    const optimalRoute = await this.getBestRoute(chainId, fromToken, toToken, amount);

    const swapTransaction: TokenSwap = {
      fromToken,
      toToken,
      amount,
      estimatedOutput: optimalRoute.estimatedOutput,
      route: optimalRoute.path,
      slippage,
      status: 'pending',
    };

    this.swapHistory.push(swapTransaction);

    // In production, this would execute the actual swap
    // For demo, simulate completion after delay
    setTimeout(() => {
      swapTransaction.status = 'completed';
    }, 2000);

    return swapTransaction;
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
      .filter(([tokenAddress, tokenBalance]) => tokenAddress !== requiredToken && parseFloat(tokenBalance) > 0);

    if (availableTokens.length === 0) {
      throw new Error('No tokens available for swap');
    }

    // For simplicity, use the first available token
    const [sourceTokenAddress, sourceTokenBalance] = availableTokens[0];

    // Calculate amount to swap
    const swapAmount = Math.min(parseFloat(sourceTokenBalance), parseFloat(requiredAmount) * 1.1).toString();

    return await this.executeSwap(chainId, sourceTokenAddress, requiredToken, swapAmount);
  }

  /**
   * Get swap history
   */
  getSwapHistory(): TokenSwap[] {
    return this.swapHistory;
  }

  /**
   * Get swap status
   */
  getSwapStatus(fromToken: string, toToken: string): TokenSwap | undefined {
    return this.swapHistory.find(
      (swapTransaction) => swapTransaction.fromToken === fromToken && swapTransaction.toToken === toToken
    );
  }
}

export const tokenSwapService = new TokenSwapService();
