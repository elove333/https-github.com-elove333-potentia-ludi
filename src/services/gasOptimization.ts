import { GasOptimization } from '../types';

interface Transaction {
  to?: string;
  from?: string;
  data?: string;
  value?: bigint;
  gasLimit?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  type?: string;
}

class GasOptimizationService {
  private gasPriceCache: Map<number, bigint> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;
  private pendingTransactions: number = 0;

  /**
   * Initialize gas monitoring
   */
  init() {
    this.startGasMonitoring();
  }

  /**
   * Start monitoring gas prices across chains
   */
  private startGasMonitoring() {
    if (this.isMonitoring && this.updateInterval) return;
    
    this.isMonitoring = true;
    // Update gas prices every 15 seconds when monitoring is active
    this.updateInterval = setInterval(() => {
      // Only update if there are pending transactions; keep interval alive
      if (this.pendingTransactions > 0) {
        this.updateGasPrices();
      } else if (this.isMonitoring) {
        // Stop monitoring if no pending transactions
        this.stopGasMonitoring();
      }
    }, 15000);

    // Initial update
    this.updateGasPrices();
  }

  /**
   * Stop monitoring gas prices
   */
  private stopGasMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Update gas prices for all supported chains
   */
  private async updateGasPrices() {
    const chains = [1, 137, 56, 42161, 10, 8453]; // ETH, Polygon, BSC, Arbitrum, Optimism, Base
    
    // Fetch gas prices in parallel for better performance
    await Promise.all(
      chains.map(async (chainId) => {
        try {
          const gasPrice = await this.fetchGasPrice(chainId);
          this.gasPriceCache.set(chainId, gasPrice);
        } catch (error) {
          console.error(`Failed to fetch gas price for chain ${chainId}:`, error);
        }
      })
    );
  }

  /**
   * Fetch current gas price for a chain
   */
  private async fetchGasPrice(chainId: number): Promise<bigint> {
    // In production, this would call actual RPC endpoints
    // For demo, return mock values based on chain
    const mockPrices: Record<number, bigint> = {
      1: BigInt(30e9), // 30 gwei for Ethereum
      137: BigInt(50e9), // 50 gwei for Polygon
      56: BigInt(5e9), // 5 gwei for BSC
      42161: BigInt(0.1e9), // 0.1 gwei for Arbitrum
      10: BigInt(0.001e9), // 0.001 gwei for Optimism
      8453: BigInt(0.001e9), // 0.001 gwei for Base
    };

    return mockPrices[chainId] || BigInt(10e9);
  }

  /**
   * Get gas optimization recommendation
   */
  async getOptimization(chainId: number, _transactionType: string): Promise<GasOptimization> {
    const currentGasPrice = this.gasPriceCache.get(chainId) || BigInt(0);
    
    // Calculate optimal gas price (70% of current for non-urgent transactions)
    const optimizedGasPrice = (currentGasPrice * BigInt(70)) / BigInt(100);
    
    // Estimate savings in percentage
    const estimatedSavings = 30;

    // Determine recommendation based on gas price trends
    let recommendation: 'immediate' | 'wait' | 'schedule' = 'immediate';
    
    if (currentGasPrice > BigInt(50e9)) {
      recommendation = 'wait'; // High gas, wait for better prices
    } else if (currentGasPrice > BigInt(30e9)) {
      recommendation = 'schedule'; // Medium gas, schedule for optimal time
    }

    return {
      chainId,
      currentGasPrice,
      optimizedGasPrice,
      estimatedSavings,
      recommendation,
    };
  }

  /**
   * Optimize transaction parameters
   */
  async optimizeTransaction(
    chainId: number,
    transaction: Transaction
  ): Promise<Transaction> {
    // Track that we're preparing a transaction (increment before async operation)
    const wasIdle = this.pendingTransactions === 0;
    this.pendingTransactions++;
    
    // Restart monitoring if we were idle
    if (wasIdle) {
      this.startGasMonitoring();
    }
    
    try {
      const optimization = await this.getOptimization(chainId, transaction.type || 'default');
      
      // NOTE: This is demo code. In production:
      // - Don't use setTimeout for transaction tracking
      // - Decrement counter when tx is confirmed/failed via event listeners
      // - Track actual transaction hashes to avoid race conditions
      // For demo purposes, we simulate a delay to demonstrate conditional monitoring
      setTimeout(() => {
        this.pendingTransactions = Math.max(0, this.pendingTransactions - 1);
      }, 2000);
      
      return {
        ...transaction,
        maxFeePerGas: optimization.optimizedGasPrice,
        maxPriorityFeePerGas: optimization.optimizedGasPrice / BigInt(10),
      };
    } catch (error) {
      // Ensure counter is decremented even on error
      this.pendingTransactions = Math.max(0, this.pendingTransactions - 1);
      throw error;
    }
  }

  /**
   * Get current gas price for a chain
   */
  getCurrentGasPrice(chainId: number): bigint | null {
    return this.gasPriceCache.get(chainId) || null;
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

export const gasOptimizationService = new GasOptimizationService();
