import { ChainReward } from '../types';

class RewardTrackingService {
  private trackedRewards: Map<string, ChainReward[]> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize reward tracking
   */
  init(walletAddress: string) {
    this.startRewardTracking(walletAddress);
  }

  /**
   * Start tracking rewards across all chains
   */
  private startRewardTracking(walletAddress: string) {
    // Update rewards every 30 seconds
    this.updateInterval = setInterval(() => {
      this.updateRewards(walletAddress);
    }, 30000);

    // Initial update
    this.updateRewards(walletAddress);
  }

  /**
   * Update rewards from all chains
   */
  private async updateRewards(walletAddress: string) {
    const chains = [1, 137, 56, 42161, 10, 8453];
    
    // Fetch rewards in parallel for better performance
    await Promise.all(
      chains.map(async (chainId) => {
        try {
          const rewards = await this.fetchRewardsForChain(walletAddress, chainId);
          this.trackedRewards.set(`${walletAddress}-${chainId}`, rewards);
        } catch (error) {
          console.error(`Failed to fetch rewards for chain ${chainId}:`, error);
        }
      })
    );
  }

  /**
   * Fetch rewards for a specific chain
   */
  private async fetchRewardsForChain(
    _walletAddress: string,
    chainId: number
  ): Promise<ChainReward[]> {
    // In production, this would query blockchain data
    // For demo, return mock rewards
    const chainNames: Record<number, string> = {
      1: 'Ethereum',
      137: 'Polygon',
      56: 'BSC',
      42161: 'Arbitrum',
      10: 'Optimism',
      8453: 'Base',
    };

    // Simulate some rewards
    if (Math.random() > 0.5) {
      return [
        {
          chainId,
          chainName: chainNames[chainId] || `Chain ${chainId}`,
          tokenAddress: '0x1234567890123456789012345678901234567890',
          tokenSymbol: 'GAME',
          amount: (Math.random() * 100).toFixed(2),
          usdValue: Math.random() * 500,
          claimable: Math.random() > 0.3,
        },
      ];
    }

    return [];
  }

  /**
   * Get all rewards for a wallet
   */
  getAllRewards(walletAddress: string): ChainReward[] {
    const allRewards: ChainReward[] = [];
    
    this.trackedRewards.forEach((rewards, key) => {
      if (key.startsWith(walletAddress)) {
        allRewards.push(...rewards);
      }
    });

    return allRewards;
  }

  /**
   * Get rewards for a specific chain
   */
  getRewardsForChain(walletAddress: string, chainId: number): ChainReward[] {
    return this.trackedRewards.get(`${walletAddress}-${chainId}`) || [];
  }

  /**
   * Get total reward value in USD
   */
  getTotalRewardValue(walletAddress: string): number {
    const allRewards = this.getAllRewards(walletAddress);
    return allRewards.reduce((total, reward) => total + reward.usdValue, 0);
  }

  /**
   * Get claimable rewards
   */
  getClaimableRewards(walletAddress: string): ChainReward[] {
    return this.getAllRewards(walletAddress).filter((reward) => reward.claimable);
  }

  /**
   * Claim rewards
   */
  async claimReward(_walletAddress: string, reward: ChainReward): Promise<boolean> {
    // In production, this would execute the claim transaction
    console.log(`Claiming reward:`, reward);
    
    // Simulate claim
    reward.claimable = false;
    return true;
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

export const rewardTrackingService = new RewardTrackingService();
