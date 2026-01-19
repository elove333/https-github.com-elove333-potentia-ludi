/**
 * Types for Balance Workflow
 * 
 * These types define the structure for balance-related operations
 * in the Conversational Web3 Wallet Hub.
 */

import { Address } from 'viem';

/**
 * Parameters for getting balance
 */
export interface BalanceParams {
  /** The wallet address to check balance for */
  address: Address;
  
  /** The chain ID to check balance on */
  chainId: number;
  
  /** Optional: specific token address (if not provided, returns native token balance) */
  tokenAddress?: Address;
  
  /** Optional: whether to include USD value */
  includeUsdValue?: boolean;
}

/**
 * Balance query result
 */
export interface Balance {
  /** Raw balance in smallest unit (wei for ETH) */
  raw: bigint;
  
  /** Formatted balance as string */
  formatted: string;
  
  /** Token symbol (e.g., 'ETH', 'USDC') */
  symbol: string;
  
  /** Token decimals */
  decimals: number;
  
  /** USD value if requested and available */
  usdValue?: number;
  
  /** Chain ID */
  chainId: number;
  
  /** Token address (undefined for native token) */
  tokenAddress?: Address;
  
  /** Timestamp of the query */
  timestamp: number;
}

/**
 * Parameters for tracking balance changes
 */
export interface TrackBalanceParams {
  /** The wallet address to track */
  address: Address;
  
  /** The chain ID to track on */
  chainId: number;
  
  /** Optional: specific token address to track */
  tokenAddress?: Address;
  
  /** Callback function when balance changes */
  onChange: (balance: Balance) => void;
  
  /** Polling interval in milliseconds (default: 15000) */
  pollingInterval?: number;
}

/**
 * Result of starting a balance tracking subscription
 */
export interface TrackBalanceResult {
  /** Subscription ID for later unsubscription */
  subscriptionId: string;
  
  /** Initial balance */
  initialBalance: Balance;
  
  /** Function to stop tracking */
  unsubscribe: () => void;
}
