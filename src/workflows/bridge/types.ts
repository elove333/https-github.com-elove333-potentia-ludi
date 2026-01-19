/**
 * Types for Bridge Workflow
 * 
 * These types define the structure for cross-chain bridge operations
 * in the Conversational Web3 Wallet Hub.
 */

import { Address } from 'viem';

/**
 * Parameters for getting a bridge quote
 */
export interface BridgeQuoteParams {
  /** Source chain ID */
  fromChainId: number;
  
  /** Destination chain ID */
  toChainId: number;
  
  /** Token to bridge (address or 'native') */
  token: Address | 'native';
  
  /** Amount to bridge in smallest unit */
  amount: bigint;
  
  /** Recipient address on destination chain */
  recipient: Address;
  
  /** Sender address on source chain */
  sender: Address;
}

/**
 * Bridge quote from a bridge provider
 */
export interface BridgeQuote {
  /** Bridge provider name (e.g., 'LayerZero', 'Stargate', 'Across') */
  provider: string;
  
  /** Estimated amount to receive on destination chain */
  estimatedOutput: bigint;
  
  /** Formatted output amount */
  estimatedOutputFormatted: string;
  
  /** Bridge fee in source token */
  bridgeFee: bigint;
  
  /** Bridge fee in USD */
  bridgeFeeUsd?: number;
  
  /** Estimated gas cost on source chain */
  estimatedSourceGas: bigint;
  
  /** Estimated gas cost on destination chain (if applicable) */
  estimatedDestinationGas?: bigint;
  
  /** Total cost in USD */
  totalCostUsd?: number;
  
  /** Estimated time to complete (in seconds) */
  estimatedTime: number;
  
  /** Transaction data for execution */
  txData?: {
    to: Address;
    data: `0x${string}`;
    value: bigint;
  };
}

/**
 * Result of getting bridge quotes
 */
export interface BridgeQuotesResult {
  /** Array of quotes from different providers */
  quotes: BridgeQuote[];
  
  /** Best quote (lowest cost) */
  bestQuote: BridgeQuote;
  
  /** Timestamp of quotes */
  timestamp: number;
}

/**
 * Parameters for executing a bridge transfer
 */
export interface BridgeTransferParams {
  /** The quote to execute */
  quote: BridgeQuote;
  
  /** Source chain ID */
  fromChainId: number;
  
  /** Destination chain ID */
  toChainId: number;
  
  /** Sender's address */
  sender: Address;
  
  /** Recipient's address on destination chain */
  recipient: Address;
  
  /** User's signature for transaction approval */
  signature?: `0x${string}`;
}

/**
 * Result of executing a bridge transfer
 */
export interface BridgeTransferResult {
  /** Transaction hash on source chain */
  sourceTxHash: `0x${string}`;
  
  /** Source chain ID */
  fromChainId: number;
  
  /** Destination chain ID */
  toChainId: number;
  
  /** Bridge tracking ID (if provided by bridge) */
  bridgeTrackingId?: string;
  
  /** Status of the bridge transfer */
  status: 'pending' | 'bridging' | 'completed' | 'failed';
  
  /** Transaction hash on destination chain (available after completion) */
  destinationTxHash?: `0x${string}`;
  
  /** Actual received amount (available after completion) */
  actualReceived?: bigint;
  
  /** Error message if failed */
  error?: string;
  
  /** Timestamp of execution */
  timestamp: number;
  
  /** Estimated completion time (unix timestamp) */
  estimatedCompletion: number;
}

/**
 * Bridge provider type
 */
export enum BridgeProvider {
  LAYERZERO = 'layerzero',
  STARGATE = 'stargate',
  ACROSS = 'across',
  HOP = 'hop',
  SYNAPSE = 'synapse',
  CELER = 'celer',
}

/**
 * Bridge route information
 */
export interface BridgeRoute {
  /** Source chain */
  fromChain: {
    chainId: number;
    name: string;
  };
  
  /** Destination chain */
  toChain: {
    chainId: number;
    name: string;
  };
  
  /** Bridge provider */
  provider: BridgeProvider;
  
  /** Whether route is available */
  available: boolean;
  
  /** Minimum bridge amount */
  minAmount?: bigint;
  
  /** Maximum bridge amount */
  maxAmount?: bigint;
}

/**
 * Bridge status tracking
 */
export interface BridgeStatus {
  /** Bridge tracking ID */
  trackingId: string;
  
  /** Current status */
  status: 'pending' | 'bridging' | 'completed' | 'failed';
  
  /** Source transaction status */
  sourceStatus: 'pending' | 'confirmed' | 'failed';
  
  /** Destination transaction status */
  destinationStatus?: 'pending' | 'confirmed' | 'failed';
  
  /** Progress percentage (0-100) */
  progress: number;
  
  /** Last updated timestamp */
  lastUpdated: number;
}
