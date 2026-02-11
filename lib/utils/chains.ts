/**
 * Chain utilities and public client creation for viem
 * Provides configured public clients for interacting with different chains
 */

import { createPublicClient, http, PublicClient, Chain } from 'viem';
import { mainnet, polygon, polygonMumbai, arbitrum, optimism, base } from 'viem/chains';

/**
 * Map of chain IDs to viem chain configurations
 */
const CHAIN_MAP: Record<number, Chain> = {
  1: mainnet,
  137: polygon,
  80001: polygonMumbai,
  42161: arbitrum,
  10: optimism,
  8453: base,
};

/**
 * Get a public client for a specific chain
 * @param chainId - Chain ID (1 for Ethereum, 137 for Polygon, etc.)
 * @returns Configured viem public client
 */
export function getPublicClient(chainId: number): PublicClient {
  const chain = CHAIN_MAP[chainId];
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  return createPublicClient({
    chain,
    transport: http(),
  });
}

/**
 * Get the native currency symbol for a chain
 * @param chainId - Chain ID
 * @returns Native currency symbol (e.g., 'ETH', 'MATIC')
 */
export function getChainSymbol(chainId: number): string {
  const chain = CHAIN_MAP[chainId];
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return chain.nativeCurrency.symbol;
}

/**
 * Get the native currency decimals for a chain
 * @param chainId - Chain ID
 * @returns Native currency decimals (typically 18)
 */
export function getChainDecimals(chainId: number): number {
  const chain = CHAIN_MAP[chainId];
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return chain.nativeCurrency.decimals;
}
