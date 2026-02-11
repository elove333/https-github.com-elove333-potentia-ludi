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

// Telemetry and Success Metrics Types

export type TelemetryEventType =
  | 'siwe_login_success'
  | 'siwe_login_failure'
  | 'simulation_ok'
  | 'simulation_revert'
  | 'tx_send'
  | 'tx_mined'
  | 'reward_found'
  | 'reward_claimed'
  | 'guardrail_violation'
  | 'quote_requested'
  | 'game_detected'
  | 'swap_executed';

export type TelemetryEventCategory =
  | 'auth'
  | 'transaction'
  | 'simulation'
  | 'reward'
  | 'guardrail'
  | 'game'
  | 'swap';

export interface TelemetryEvent {
  eventType: TelemetryEventType;
  eventCategory: TelemetryEventCategory;
  userAddress?: string;
  sessionId?: string;
  chainId?: number;
  payload: Record<string, unknown>;
  timestamp?: Date;
}

export interface TelemetryPayload {
  [key: string]: unknown;
}

// Success Metrics Types

export interface SuccessMetrics {
  firstSuccessRate: number; // Percentage
  quoteToSendConversion: number; // Percentage
  executionReliability: number; // Percentage
  averageTimeToFirstTransaction: number; // Minutes
  revertRate: number; // Percentage
  claimRate: number; // Percentage
}

export interface FunnelMetrics {
  newUsers: number;
  usersWithFirstTransaction: number;
  quoteRequests: number;
  successfulSimulations: number;
  transactionsSent: number;
  transactionsMined: number;
}

export interface SafetyThresholds {
  maxRevertRate: number; // Default 5%
  maxFailureRate: number; // Default 10%
  minSimulationSuccessRate: number; // Default 90%
}

export interface GuardrailViolation {
  violationType: 'high_revert_rate' | 'suspicious_approval' | 'unsafe_contract' | 'excessive_value';
  reason: string;
  severity: 'warning' | 'critical';
  metadata: Record<string, unknown>;
}
