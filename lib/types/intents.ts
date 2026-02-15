import { z } from 'zod';

// Base intent schema
export const BaseIntentSchema = z.object({
  type: z.string(),
  timestamp: z.number().optional(),
});

// balances.get intent
export const BalancesGetIntentSchema = BaseIntentSchema.extend({
  type: z.literal('balances.get'),
  chains: z.array(z.number()).optional(),
  includeNFTs: z.boolean().optional(),
  includeApprovals: z.boolean().optional(),
});

// trade.swap intent
export const TradeSwapIntentSchema = BaseIntentSchema.extend({
  type: z.literal('trade.swap'),
  fromToken: z.string(),
  toToken: z.string(),
  amount: z.string(),
  chainId: z.number(),
  slippage: z.number().min(0).max(50).optional(),
  useUniswapOnly: z.boolean().optional(),
});

// bridge.transfer intent
export const BridgeTransferIntentSchema = BaseIntentSchema.extend({
  type: z.literal('bridge.transfer'),
  fromChainId: z.number(),
  toChainId: z.number(),
  token: z.string(),
  amount: z.string(),
  slippage: z.number().min(0).max(50).optional(),
});

// rewards.claim intent
export const RewardsClaimIntentSchema = BaseIntentSchema.extend({
  type: z.literal('rewards.claim'),
  platforms: z.array(z.enum(['galxe', 'rabbithole', 'layer3'])).optional(),
  rewardIds: z.array(z.string()).optional(),
});

// Union of all intent types
export const IntentSchema = z.discriminatedUnion('type', [
  BalancesGetIntentSchema,
  TradeSwapIntentSchema,
  BridgeTransferIntentSchema,
  RewardsClaimIntentSchema,
]);

export type Intent = z.infer<typeof IntentSchema>;
export type BalancesGetIntent = z.infer<typeof BalancesGetIntentSchema>;
export type TradeSwapIntent = z.infer<typeof TradeSwapIntentSchema>;
export type BridgeTransferIntent = z.infer<typeof BridgeTransferIntentSchema>;
export type RewardsClaimIntent = z.infer<typeof RewardsClaimIntentSchema>;

// Intent status
export enum IntentStatus {
  PLANNED = 'planned',
  PREFLIGHT = 'preflight',
  PREVIEWED = 'previewed',
  APPROVED = 'approved',
  EXECUTING = 'executing',
  EXECUTED = 'executed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

// Preview data schema
export const PreviewSchema = z.object({
  decodedCalls: z.array(z.object({
    target: z.string(),
    method: z.string(),
    params: z.any(),
  })),
  tokenDeltas: z.array(z.object({
    token: z.string(),
    symbol: z.string(),
    amount: z.string(),
    usdValue: z.number().optional(),
  })),
  risks: z.array(z.object({
    level: z.enum(['low', 'medium', 'high', 'critical']),
    message: z.string(),
  })),
  gasEstimate: z.object({
    gasLimit: z.string(),
    maxFeePerGas: z.string(),
    maxPriorityFeePerGas: z.string(),
    totalCostUsd: z.number().optional(),
  }),
  simulationSuccess: z.boolean(),
  revertReason: z.string().optional(),
});

export type PreviewData = z.infer<typeof PreviewSchema>;

// Database types
export interface User {
  id: number;
  address: Buffer;
  ens?: string;
  created_at: Date;
}

export interface Session {
  id: string;
  user_id: number;
  siwe_message: string;
  nonce: string;
  issued_at: Date;
  expires_at: Date;
  user_agent?: string;
  ip?: string;
  created_at: Date;
}

export interface IntentRecord {
  id: string;
  user_id: number;
  intent_type: string;
  intent_json: Intent;
  status: IntentStatus;
  preview?: PreviewData;
  tx_hash?: string;
  error?: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserLimits {
  user_id: number;
  daily_usd_cap: number;
  max_approval_usd: number;
  allowlist: string[];
  created_at: Date;
  updated_at: Date;
}

export interface TelemetryEvent {
  id: number;
  user_id?: number;
  session_id?: string;
  event: string;
  payload?: any;
  correlation_id?: string;
  created_at: Date;
}
