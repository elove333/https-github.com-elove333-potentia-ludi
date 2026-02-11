import { ChainReward } from '../types';
import { SUPPORTED_CHAIN_IDS, CHAIN_NAMES } from '../constants/chains';
import { PeriodicMonitor } from '../utils/monitoring';

class RewardTrackingService extends PeriodicMonitor {
  private trackedRewards: Map<string, ChainReward[]> = new Map();
  private currentWalletAddress: string | null = null;

  /**
   * Initialize reward tracking
   */
  init(walletAddress: string) {
    this.currentWalletAddress = walletAddress;
    this.startMonitoring(30000); // Update every 30 seconds
  }

  /**
   * Implementation of periodic update
   */
  protected async performUpdate() {
    if (this.currentWalletAddress) {
      await this.updateRewards(this.currentWalletAddress);
    }
  }

  /**
   * Update rewards from all chains
   */
  private async updateRewards(walletAddress: string) {
    for (const chainId of SUPPORTED_CHAIN_IDS) {
      try {
        const rewards = await this.fetchRewardsForChain(walletAddress, chainId);
        this.trackedRewards.set(`${walletAddress}-${chainId}`, rewards);
      } catch (error: unknown) {
        console.error(`Failed to fetch rewards for chain ${chainId}:`, error);
      }
    }
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

    // Simulate some rewards
    if (Math.random() > 0.5) {
      return [
        {
          chainId,
          chainName: CHAIN_NAMES[chainId] || `Chain ${chainId}`,
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
}

export const rewardTrackingService = new RewardTrackingService();
