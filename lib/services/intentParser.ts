// Intent parser - converts natural language to structured intents
import { Intent } from '@/lib/types/intents';
import { logger } from '@/lib/db/client';

export interface ParsedIntent {
  intent: Intent;
  confidence: number;
  originalText: string;
}

// Simple keyword-based parser (MVP - would use ML models in production)
export function parseNaturalLanguage(text: string): ParsedIntent | null {
  const lowerText = text.toLowerCase();

  // Check for balance queries
  if (lowerText.includes('balance') || lowerText.includes('what do i have')) {
    return {
      intent: {
        type: 'balances.get',
        includeNFTs: lowerText.includes('nft'),
        includeApprovals: lowerText.includes('approval'),
      },
      confidence: 0.85,
      originalText: text,
    };
  }

  // Check for swap intents
  const swapMatch = lowerText.match(/swap|exchange|trade/);
  if (swapMatch) {
    // Try to extract token symbols and amounts
    const amountMatch = text.match(/(\d+\.?\d*)\s*(\w+)/i);
    const toTokenMatch = text.match(/(?:to|for)\s+(\w+)/i);

    if (amountMatch && toTokenMatch) {
      return {
        intent: {
          type: 'trade.swap',
          fromToken: amountMatch[2].toUpperCase(),
          toToken: toTokenMatch[1].toUpperCase(),
          amount: amountMatch[1],
          chainId: 1, // Default to Ethereum
          slippage: 1,
        },
        confidence: 0.75,
        originalText: text,
      };
    }
  }

  // Check for bridge intents
  if (lowerText.includes('bridge') || lowerText.includes('transfer to')) {
    const chainMatch = text.match(/to\s+(polygon|arbitrum|optimism|base)/i);
    if (chainMatch) {
      const chainMap: Record<string, number> = {
        polygon: 137,
        arbitrum: 42161,
        optimism: 10,
        base: 8453,
      };

      return {
        intent: {
          type: 'bridge.transfer',
          fromChainId: 1,
          toChainId: chainMap[chainMatch[1].toLowerCase()],
          token: 'ETH', // Default
          amount: '1000000',
        },
        confidence: 0.7,
        originalText: text,
      };
    }
  }

  // Check for rewards
  if (lowerText.includes('reward') || lowerText.includes('quest') || lowerText.includes('claim')) {
    return {
      intent: {
        type: 'rewards.claim',
      },
      confidence: 0.8,
      originalText: text,
    };
  }

  logger.warn({ text }, 'Failed to parse natural language intent');
  return null;
}

// Validation helper
export function validateIntent(intent: Intent): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  switch (intent.type) {
    case 'trade.swap':
      if (!intent.fromToken) errors.push('Missing fromToken');
      if (!intent.toToken) errors.push('Missing toToken');
      if (!intent.amount || parseFloat(intent.amount) <= 0) {
        errors.push('Invalid amount');
      }
      if (!intent.chainId) errors.push('Missing chainId');
      break;

    case 'bridge.transfer':
      if (!intent.fromChainId) errors.push('Missing fromChainId');
      if (!intent.toChainId) errors.push('Missing toChainId');
      if (intent.fromChainId === intent.toChainId) {
        errors.push('Cannot bridge to same chain');
      }
      break;

    case 'rewards.claim':
      // Minimal validation for rewards
      break;

    case 'balances.get':
      // No required fields
      break;
  }

  return { valid: errors.length === 0, errors };
}

// Intent examples for documentation/testing
export const INTENT_EXAMPLES = [
  {
    text: 'Show me my balance',
    expected: { type: 'balances.get' },
  },
  {
    text: 'Swap 100 USDC for ETH',
    expected: { type: 'trade.swap', fromToken: 'USDC', toToken: 'ETH' },
  },
  {
    text: 'Bridge 0.5 ETH to Polygon',
    expected: { type: 'bridge.transfer', toChainId: 137 },
  },
  {
    text: 'Show my claimable rewards',
    expected: { type: 'rewards.claim' },
  },
];
