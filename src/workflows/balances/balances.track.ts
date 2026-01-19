/**
 * Balance Tracking Workflow
 * 
 * This service provides real-time balance tracking by polling the blockchain
 * at regular intervals and notifying when changes occur.
 * 
 * Usage example:
 *   const subscription = await balancesTrack({
 *     address: '0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4',
 *     chainId: 137,
 *     onChange: (balance) => {
 *       console.log('Balance changed:', balance.formatted);
 *     }
 *   });
 *   
 *   // Later, to stop tracking:
 *   subscription.unsubscribe();
 */

import { TrackBalanceParams, TrackBalanceResult, Balance } from './types';
import { balancesGetWithCache } from './balances.get';

// Store active subscriptions
// TODO: In production, use a proper subscription management service
// that persists state and handles cleanup on server restart
const activeSubscriptions = new Map<string, NodeJS.Timeout>();

/**
 * Generate a unique subscription ID
 */
function generateSubscriptionId(params: TrackBalanceParams): string {
  const { address, chainId, tokenAddress } = params;
  const token = tokenAddress || 'native';
  return `${chainId}:${address}:${token}:${Date.now()}`;
}

/**
 * Track balance changes for an address
 * 
 * @param params - Tracking parameters including callback
 * @returns Subscription result with unsubscribe function
 */
export async function balancesTrack(params: TrackBalanceParams): Promise<TrackBalanceResult> {
  const { address, chainId, tokenAddress, onChange, pollingInterval = 15000 } = params;
  
  // Generate subscription ID
  const subscriptionId = generateSubscriptionId(params);
  
  // Get initial balance
  const initialBalance = await balancesGetWithCache({
    address,
    chainId,
    tokenAddress,
    includeUsdValue: true,
  });
  
  // Store last known balance
  let lastBalance = initialBalance;
  
  // Setup polling
  const intervalId = setInterval(async () => {
    try {
      const currentBalance = await balancesGetWithCache({
        address,
        chainId,
        tokenAddress,
        includeUsdValue: true,
      });
      
      // Check if balance changed
      if (currentBalance.raw !== lastBalance.raw) {
        lastBalance = currentBalance;
        onChange(currentBalance);
      }
    } catch (error) {
      console.error('Error tracking balance:', error);
      // Continue polling even on error
    }
  }, pollingInterval);
  
  // Store subscription
  activeSubscriptions.set(subscriptionId, intervalId);
  
  // Create unsubscribe function
  const unsubscribe = () => {
    const interval = activeSubscriptions.get(subscriptionId);
    if (interval) {
      clearInterval(interval);
      activeSubscriptions.delete(subscriptionId);
    }
  };
  
  return {
    subscriptionId,
    initialBalance,
    unsubscribe,
  };
}

/**
 * Unsubscribe from balance tracking by subscription ID
 * 
 * @param subscriptionId - The subscription ID to cancel
 */
export function balancesUntrack(subscriptionId: string): void {
  const interval = activeSubscriptions.get(subscriptionId);
  if (interval) {
    clearInterval(interval);
    activeSubscriptions.delete(subscriptionId);
  }
}

/**
 * Get all active subscription IDs
 * 
 * @returns Array of active subscription IDs
 */
export function getActiveSubscriptions(): string[] {
  return Array.from(activeSubscriptions.keys());
}

/**
 * Clear all active subscriptions
 * Useful for cleanup on application shutdown
 */
export function clearAllSubscriptions(): void {
  activeSubscriptions.forEach((interval) => {
    clearInterval(interval);
  });
  activeSubscriptions.clear();
}
