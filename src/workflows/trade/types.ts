/**
 * Types for Trade Workflow
 * 
 * These types define the structure for token swap operations
 * in the Conversational Web3 Wallet Hub.
 */

import { Address } from 'viem';

/**
 * Parameters for getting a swap quote
 */
export interface SwapQuoteParams {
  /** Chain ID to perform swap on */
  chainId: number;
  
  /** Token to sell (address or 'native') */
  fromToken: Address | 'native';
  
  /** Token to buy (address or 'native') */
  toToken: Address | 'native';
  
  /** Amount to sell in smallest unit (wei) */
  amount: bigint;
  
  /** User's wallet address */
  userAddress: Address;
  
  /** Maximum acceptable slippage (0.5 = 0.5%) */
  slippage?: number;
}

/**
 * Swap quote from a DEX
 */
export interface SwapQuote {
  /** DEX name (e.g., 'Uniswap', '1inch', 'Paraswap') */
  dex: string;
  
  /** Estimated output amount */
  estimatedOutput: bigint;
  
  /** Formatted output amount */
  estimatedOutputFormatted: string;
  
  /** Estimated gas cost in native token */
  estimatedGas: bigint;
  
  /** Gas cost in USD */
  estimatedGasUsd?: number;
  
  /** Exchange rate */
  rate: string;
  
  /** Price impact percentage */
  priceImpact: number;
  
  /** Route taken (array of token addresses) */
  route: Address[];
  
  /** Transaction data for execution */
  txData?: {
    to: Address;
    data: `0x${string}`;
    value: bigint;
  };
}

/**
 * Result of getting quotes from multiple DEXs
 */
export interface SwapQuotesResult {
  /** Array of quotes from different DEXs */
  quotes: SwapQuote[];
  
  /** Best quote (highest output) */
  bestQuote: SwapQuote;
  
  /** Timestamp of quotes */
  timestamp: number;
}

/**
 * Parameters for executing a swap
 */
export interface SwapExecuteParams {
  /** The quote to execute */
  quote: SwapQuote;
  
  /** User's address */
  userAddress: Address;
  
  /** Optional: transaction deadline (unix timestamp) */
  deadline?: number;
  
  /** User's signature for transaction approval */
  signature?: `0x${string}`;
}

/**
 * Result of executing a swap
 */
export interface SwapExecuteResult {
  /** Transaction hash */
  txHash: `0x${string}`;
  
  /** Chain ID */
  chainId: number;
  
  /** Status of execution */
  status: 'pending' | 'confirmed' | 'failed';
  
  /** Actual output amount (available after confirmation) */
  actualOutput?: bigint;
  
  /** Error message if failed */
  error?: string;
  
  /** Timestamp of execution */
  timestamp: number;
}

/**
 * Supported DEX type
 */
export enum DEXType {
  UNISWAP_V2 = 'uniswap_v2',
  UNISWAP_V3 = 'uniswap_v3',
  SUSHISWAP = 'sushiswap',
  PANCAKESWAP = 'pancakeswap',
  ONEINCH = '1inch',
  PARASWAP = 'paraswap',
}

/**
 * DEX configuration
 */
export interface DEXConfig {
  /** DEX type */
  type: DEXType;
  
  /** DEX name */
  name: string;
  
  /** Supported chain IDs */
  supportedChains: number[];
  
  /** Router address per chain */
  routerAddresses: Record<number, Address>;
  
  /** Whether DEX is enabled */
  enabled: boolean;
}
