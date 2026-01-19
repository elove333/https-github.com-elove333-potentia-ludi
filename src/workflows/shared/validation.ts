/**
 * Shared Validation Utilities
 * 
 * Common validation functions used across all workflows
 */

import { Address, isAddress } from 'viem';

/**
 * Validate an Ethereum address
 * 
 * @param address - Address to validate
 * @throws Error if address is invalid
 */
export function validateAddress(address: string): asserts address is Address {
  if (!isAddress(address)) {
    throw new Error(`Invalid Ethereum address: ${address}`);
  }
  
  if (address === '0x0000000000000000000000000000000000000000') {
    throw new Error('Zero address is not allowed');
  }
}

/**
 * Validate a chain ID
 * 
 * @param chainId - Chain ID to validate
 * @throws Error if chain ID is invalid or unsupported
 */
export function validateChainId(chainId: number): void {
  const supportedChains = [1, 137, 56, 42161, 10, 8453];
  
  if (!Number.isInteger(chainId) || chainId <= 0) {
    throw new Error(`Invalid chain ID: ${chainId}`);
  }
  
  if (!supportedChains.includes(chainId)) {
    throw new Error(`Unsupported chain ID: ${chainId}. Supported chains: ${supportedChains.join(', ')}`);
  }
}

/**
 * Validate an amount
 * 
 * @param amount - Amount to validate
 * @param min - Minimum allowed amount
 * @param max - Maximum allowed amount
 * @throws Error if amount is invalid
 */
export function validateAmount(amount: bigint, min?: bigint, max?: bigint): void {
  if (amount <= 0n) {
    throw new Error('Amount must be greater than 0');
  }
  
  if (min !== undefined && amount < min) {
    throw new Error(`Amount ${amount} is below minimum ${min}`);
  }
  
  if (max !== undefined && amount > max) {
    throw new Error(`Amount ${amount} exceeds maximum ${max}`);
  }
}

/**
 * Validate slippage tolerance
 * 
 * @param slippage - Slippage percentage (e.g., 0.5 for 0.5%)
 * @throws Error if slippage is invalid
 */
export function validateSlippage(slippage: number): void {
  if (slippage < 0 || slippage > 50) {
    throw new Error(`Invalid slippage: ${slippage}%. Must be between 0 and 50.`);
  }
  
  if (slippage > 5) {
    console.warn(`High slippage warning: ${slippage}%. Consider using a lower value.`);
  }
}

/**
 * Validate a signature
 * 
 * @param signature - Signature to validate
 * @throws Error if signature is invalid
 */
export function validateSignature(signature: string): asserts signature is `0x${string}` {
  if (!signature.startsWith('0x')) {
    throw new Error('Signature must start with 0x');
  }
  
  // Basic length check (65 bytes = 130 hex chars + 0x prefix)
  if (signature.length !== 132) {
    throw new Error(`Invalid signature length: ${signature.length}. Expected 132 characters.`);
  }
}

/**
 * Check if user has sufficient balance
 * 
 * @param userBalance - User's current balance
 * @param requiredAmount - Amount needed for transaction
 * @param gasEstimate - Estimated gas cost (for native token)
 * @throws Error if balance is insufficient
 */
export function validateSufficientBalance(
  userBalance: bigint,
  requiredAmount: bigint,
  gasEstimate?: bigint
): void {
  const totalRequired = gasEstimate ? requiredAmount + gasEstimate : requiredAmount;
  
  if (userBalance < totalRequired) {
    const deficit = totalRequired - userBalance;
    throw new Error(
      `Insufficient balance. Required: ${totalRequired}, Available: ${userBalance}, Deficit: ${deficit}`
    );
  }
}

/**
 * Validate transaction value limits
 * 
 * @param valueUsd - Transaction value in USD
 * @param userTier - User tier ('new' | 'verified')
 * @throws Error if value exceeds limits
 */
export function validateTransactionLimits(
  valueUsd: number,
  userTier: 'new' | 'verified' = 'new'
): void {
  const limits = {
    new: {
      transfer: 100,
      swap: 500,
      bridge: 200,
    },
    verified: {
      transfer: 10000,
      swap: 50000,
      bridge: 20000,
    },
  };
  
  // For now, use the highest limit
  const maxLimit = userTier === 'verified' ? 50000 : 500;
  
  if (valueUsd > maxLimit) {
    throw new Error(
      `Transaction value $${valueUsd} exceeds limit of $${maxLimit} for ${userTier} users`
    );
  }
}

/**
 * Validate deadline timestamp
 * 
 * @param deadline - Unix timestamp
 * @throws Error if deadline is invalid or in the past
 */
export function validateDeadline(deadline: number): void {
  const now = Math.floor(Date.now() / 1000);
  
  if (deadline <= now) {
    throw new Error('Deadline must be in the future');
  }
  
  const maxDeadline = now + 3600; // 1 hour from now
  if (deadline > maxDeadline) {
    throw new Error(`Deadline too far in future. Maximum is ${maxDeadline}`);
  }
}

/**
 * Sanitize user input string
 * 
 * @param input - User input to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  // Remove any potential script injections
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/**
 * Validate price impact
 * 
 * @param priceImpact - Price impact percentage
 * @param maxAllowed - Maximum allowed price impact
 * @throws Error if price impact is too high
 */
export function validatePriceImpact(priceImpact: number, maxAllowed: number = 5): void {
  if (priceImpact > maxAllowed) {
    throw new Error(
      `Price impact ${priceImpact.toFixed(2)}% exceeds maximum allowed ${maxAllowed}%`
    );
  }
  
  if (priceImpact > 1) {
    console.warn(`High price impact: ${priceImpact.toFixed(2)}%`);
  }
}

/**
 * Validate gas price
 * 
 * @param gasPrice - Gas price in gwei
 * @param chainId - Chain ID
 * @throws Error if gas price is unreasonable
 */
export function validateGasPrice(gasPrice: number, chainId: number): void {
  // Maximum gas prices per chain (in gwei)
  const maxGasPrices: Record<number, number> = {
    1: 500,    // Ethereum: 500 gwei
    137: 1000, // Polygon: 1000 gwei
    56: 100,   // BSC: 100 gwei
    42161: 10, // Arbitrum: 10 gwei
    10: 10,    // Optimism: 10 gwei
    8453: 10,  // Base: 10 gwei
  };
  
  const maxGas = maxGasPrices[chainId] || 1000;
  
  if (gasPrice > maxGas) {
    throw new Error(
      `Gas price ${gasPrice} gwei exceeds maximum ${maxGas} gwei for chain ${chainId}`
    );
  }
}
