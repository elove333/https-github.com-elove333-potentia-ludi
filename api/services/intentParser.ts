// Intent parser: converts natural language to structured intent schemas
import {
  Intent,
  IntentType,
  BalancesGetIntent,
  TradeSwapIntent,
  BridgeTransferIntent,
  RewardsClaimIntent,
} from '../../src/types/intents';

// Simple keyword-based parser (can be enhanced with LLM)
export class IntentParser {
  /**
   * Parse natural language input into structured intent
   */
  static parse(input: string, takerAddress: string, defaultChainId = 1): Intent {
    const normalized = input.toLowerCase().trim();

    // Check for balance query
    if (this.isBalanceQuery(normalized)) {
      return this.parseBalanceIntent(input, takerAddress, defaultChainId);
    }

    // Check for swap/trade
    if (this.isSwapQuery(normalized)) {
      return this.parseSwapIntent(input, takerAddress, defaultChainId);
    }

    // Check for bridge/transfer
    if (this.isBridgeQuery(normalized)) {
      return this.parseBridgeIntent(input, takerAddress, defaultChainId);
    }

    // Check for rewards claim
    if (this.isRewardsQuery(normalized)) {
      return this.parseRewardsIntent(input, takerAddress, defaultChainId);
    }

    throw new Error('Unable to parse intent. Please specify: balance, swap, bridge, or claim');
  }

  private static isBalanceQuery(text: string): boolean {
    return /\b(balance|balances|check|show|get|holdings?|tokens?)\b/.test(text);
  }

  private static isSwapQuery(text: string): boolean {
    return /\b(swap|trade|exchange|buy|sell|convert)\b/.test(text);
  }

  private static isBridgeQuery(text: string): boolean {
    return /\b(bridge|transfer|move|send|cross-chain)\b/.test(text);
  }

  private static isRewardsQuery(text: string): boolean {
    return /\b(claim|reward|airdrop|collect|redeem)\b/.test(text);
  }

  private static parseBalanceIntent(
    input: string,
    takerAddress: string,
    chainId: number
  ): BalancesGetIntent {
    const includeApprovals = /\b(approval|allowance)\b/i.test(input);
    const includeNFTs = /\b(nft|nfts|collectible)\b/i.test(input);

    return {
      type: 'balances.get',
      takerAddress,
      chainId,
      includeApprovals,
      includeNFTs,
    };
  }

  private static parseSwapIntent(
    input: string,
    takerAddress: string,
    chainId: number
  ): TradeSwapIntent {
    // Extract amounts: "100 USDC", "0.5 ETH", etc.
    const amountMatch = input.match(/(\d+\.?\d*)\s*([A-Z]+)/i);
    
    // Extract "to" token: "to USDC", "for ETH", etc.
    const toTokenMatch = input.match(/(?:to|for|into|get)\s+([A-Z]+)/i);
    
    // Extract chain: "on polygon", "on base", etc.
    const chainMatch = input.match(/(?:on|using)\s+(ethereum|polygon|base|arbitrum|optimism)/i);

    const fromAmount = amountMatch?.[1] || '0';
    const fromToken = amountMatch?.[2] || 'ETH';
    const toToken = toTokenMatch?.[1] || 'USDC';
    const chain = chainMatch?.[1] || 'ethereum';

    // Extract slippage if specified
    const slippageMatch = input.match(/(\d+\.?\d*)%?\s*slippage/i);
    const slippage_bps = slippageMatch ? Math.round(parseFloat(slippageMatch[1]) * 100) : 50;

    // Check if Uniswap preference mentioned
    const prefer_sources = /uniswap/i.test(input) ? ['Uniswap_V3'] : undefined;

    return {
      type: 'trade.swap',
      takerAddress,
      chainId: this.getChainId(chain),
      from: {
        token: fromToken,
        amount: fromAmount,
        chain,
      },
      to: {
        token: toToken,
        chain,
      },
      constraints: {
        slippage_bps,
        prefer_sources,
        simulate: true,
      },
    };
  }

  private static parseBridgeIntent(
    input: string,
    takerAddress: string,
    chainId: number
  ): BridgeTransferIntent {
    const amountMatch = input.match(/(\d+\.?\d*)\s*([A-Z]+)/i);
    const fromChainMatch = input.match(/from\s+(ethereum|polygon|base|arbitrum|optimism)/i);
    const toChainMatch = input.match(/to\s+(ethereum|polygon|base|arbitrum|optimism)/i);

    const fromToken = amountMatch?.[2] || 'USDC';
    const amount = amountMatch?.[1] || '0';
    const fromChain = fromChainMatch?.[1] || 'polygon';
    const toChain = toChainMatch?.[1] || 'ethereum';

    return {
      type: 'bridge.transfer',
      takerAddress,
      chainId: this.getChainId(fromChain),
      from: {
        token: fromToken,
        amount,
        chain: fromChain,
      },
      to: {
        chain: toChain,
      },
      constraints: {
        max_delay_minutes: 30,
      },
    };
  }

  private static parseRewardsIntent(
    input: string,
    takerAddress: string,
    chainId: number
  ): RewardsClaimIntent {
    const claimAll = /\b(all|everything)\b/i.test(input);

    // For now, return a template - in production, fetch actual claimable rewards
    return {
      type: 'rewards.claim',
      takerAddress,
      chainId,
      rewards: [],
      claimAll,
    };
  }

  private static getChainId(chain: string): number {
    const chainIds: Record<string, number> = {
      ethereum: 1,
      polygon: 137,
      base: 8453,
      arbitrum: 42161,
      optimism: 10,
      bsc: 56,
    };
    return chainIds[chain.toLowerCase()] || 1;
  }
}

// Validation helpers
export function validateIntent(intent: Intent): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Basic validation
  if (!intent.takerAddress || !/^0x[a-fA-F0-9]{40}$/.test(intent.takerAddress)) {
    errors.push('Invalid taker address');
  }

  if (!intent.chainId || intent.chainId <= 0) {
    errors.push('Invalid chain ID');
  }

  // Type-specific validation
  switch (intent.type) {
    case 'trade.swap':
      if (!intent.from?.amount || parseFloat(intent.from.amount) <= 0) {
        errors.push('Invalid swap amount');
      }
      if (!intent.from?.token || !intent.to?.token) {
        errors.push('Missing token information');
      }
      break;

    case 'bridge.transfer':
      if (!intent.from?.amount || parseFloat(intent.from.amount) <= 0) {
        errors.push('Invalid bridge amount');
      }
      if (intent.from?.chain === intent.to?.chain) {
        errors.push('Cannot bridge to the same chain');
      }
      break;

    case 'rewards.claim':
      if (!intent.rewards || intent.rewards.length === 0) {
        if (!intent.claimAll) {
          errors.push('No rewards specified');
        }
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
