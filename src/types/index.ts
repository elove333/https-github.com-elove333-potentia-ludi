// Core types for the Gaming Wallet Hub

export interface Web3Game {
  id: string;
  name: string;
  url: string;
  chainId: number;
  contractAddresses: string[];
  detected: boolean;
  lastActive: Date;
}

export interface GasOptimization {
  chainId: number;
  currentGasPrice: bigint;
  optimizedGasPrice: bigint;
  estimatedSavings: number;
  recommendation: 'immediate' | 'wait' | 'schedule';
}

export interface TokenSwap {
  id: string; // Unique identifier for the swap
  fromToken: string;
  toToken: string;
  amount: string;
  estimatedOutput: string;
  route: string[];
  slippage: number;
  status: 'pending' | 'completed' | 'failed';
}

export interface ChainReward {
  chainId: number;
  chainName: string;
  tokenAddress: string;
  tokenSymbol: string;
  amount: string;
  usdValue: number;
  claimable: boolean;
}

export interface GameStats {
  gameId: string;
  playTime: number;
  transactions: number;
  gasSpent: string;
  rewardsEarned: string;
  winRate: number;
  achievements: string[];
}

export interface ClipMetadata {
  id: string;
  gameId: string;
  timestamp: Date;
  duration: number;
  stats: GameStats;
  thumbnailUrl: string;
  videoUrl: string;
}

export interface WalletState {
  address: string;
  chainId: number;
  balance: string;
  isConnected: boolean;
}
