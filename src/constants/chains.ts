/**
 * Supported blockchain chain IDs
 * ETH (1), Polygon (137), BSC (56), Arbitrum (42161), Optimism (10), Base (8453)
 */
export const SUPPORTED_CHAIN_IDS = [1, 137, 56, 42161, 10, 8453] as const;

/**
 * Chain ID to name mapping
 */
export const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  137: 'Polygon',
  56: 'BSC',
  42161: 'Arbitrum',
  10: 'Optimism',
  8453: 'Base',
};
