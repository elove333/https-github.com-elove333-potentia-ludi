// Intent Parser Service
// Parses natural language input into structured intents, and validates both
// structured intents (Intent) and parsed NL intents (ParsedIntent).

import {
  Intent,
  BalancesGetIntent,
  TradeSwapIntent,
  BridgeTransferIntent,
  RewardsClaimIntent,
} from '../../src/types/intents';

// ─── Structured Intent Parser (class-based) ──────────────────────────────────

// Simple keyword-based parser (can be enhanced with LLM)
export class IntentParser {
  /**
   * Parse natural language input into a structured intent schema
   */
  static parse(input: string, takerAddress: string, defaultChainId = 1): Intent {
    const normalized = input.toLowerCase().trim();

    if (this.isBalanceQuery(normalized)) {
      return this.parseBalanceIntent(input, takerAddress, defaultChainId);
    }
    if (this.isSwapQuery(normalized)) {
      return this.parseSwapIntent(input, takerAddress, defaultChainId);
    }
    if (this.isBridgeQuery(normalized)) {
      return this.parseBridgeIntent(input, takerAddress, defaultChainId);
    }
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
    return {
      type: 'balances.get',
      takerAddress,
      chainId,
      includeApprovals: /\b(approvals?|allowance)\b/i.test(input),
      includeNFTs: /\b(nft|nfts|collectible)\b/i.test(input),
    };
  }

  private static parseSwapIntent(
    input: string,
    takerAddress: string,
    chainId: number
  ): TradeSwapIntent {
    const amountMatch = input.match(/(\d+\.?\d*)\s*([A-Z]+)/i);
    const toTokenMatch = input.match(/(?:to|for|into|get)\s+([A-Z]+)/i);
    const chainMatch = input.match(/(?:on|using)\s+(ethereum|polygon|base|arbitrum|optimism)/i);
    const slippageMatch = input.match(/(\d+\.?\d*)%?\s*slippage/i);

    const fromAmount = amountMatch?.[1] || '0';
    const fromToken = amountMatch?.[2] || 'ETH';
    const toToken = toTokenMatch?.[1] || 'USDC';
    const chain = chainMatch?.[1] || 'ethereum';
    const slippage_bps = slippageMatch ? Math.round(parseFloat(slippageMatch[1]) * 100) : 50;
    const prefer_sources = /uniswap/i.test(input) ? ['Uniswap_V3'] : undefined;

    return {
      type: 'trade.swap',
      takerAddress,
      chainId: this.getChainId(chain),
      from: { token: fromToken, amount: fromAmount, chain },
      to: { token: toToken, chain },
      constraints: { slippage_bps, prefer_sources, simulate: true },
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
      from: { token: fromToken, amount, chain: fromChain },
      to: { chain: toChain },
      constraints: { max_delay_minutes: 30 },
    };
  }

  private static parseRewardsIntent(
    input: string,
    takerAddress: string,
    chainId: number
  ): RewardsClaimIntent {
    return {
      type: 'rewards.claim',
      takerAddress,
      chainId,
      rewards: [],
      claimAll: /\b(all|everything)\b/i.test(input),
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

// Validate a structured intent (Intent type from src/types/intents)
export function validateStructuredIntent(intent: Intent): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!intent.takerAddress || !/^0x[a-fA-F0-9]{40}$/.test(intent.takerAddress)) {
    errors.push('Invalid taker address');
  }

  if (!intent.chainId || intent.chainId <= 0) {
    errors.push('Invalid chain ID');
  }

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
      if ((!intent.rewards || intent.rewards.length === 0) && !intent.claimAll) {
        errors.push('No rewards specified');
      }
      break;
  }

  return { valid: errors.length === 0, errors };
}

// ─── Pattern-based NL Intent Parser ─────────────────────────────────────────

export interface ParsedIntent {
  action: string;
  entities: Record<string, any>;
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiresConfirmation: boolean;
}

const intentPatterns = [
  {
    pattern: /(?:swap|trade|exchange)\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:for|to)\s+(\w+)/i,
    action: 'trade.swap',
    riskLevel: 'MEDIUM' as const,
    extract: (match: RegExpMatchArray) => ({
      fromAmount: match[1],
      fromToken: match[2].toUpperCase(),
      toToken: match[3].toUpperCase(),
    }),
  },
  {
    pattern: /(?:send|transfer)\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:to)\s+(0x[a-fA-F0-9]{40})/i,
    action: 'transfer.send',
    riskLevel: 'HIGH' as const,
    extract: (match: RegExpMatchArray) => ({
      amount: match[1],
      token: match[2].toUpperCase(),
      recipient: match[3],
    }),
  },
  {
    pattern: /(?:bridge|move)\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:from)\s+(\w+)\s+(?:to)\s+(\w+)/i,
    action: 'bridge.transfer',
    riskLevel: 'HIGH' as const,
    extract: (match: RegExpMatchArray) => ({
      amount: match[1],
      token: match[2].toUpperCase(),
      fromChain: match[3],
      toChain: match[4],
    }),
  },
  {
    pattern: /(?:show|get|check)\s+(?:my\s+)?balance(?:s)?/i,
    action: 'balances.get',
    riskLevel: 'LOW' as const,
    extract: () => ({}),
  },
  {
    pattern: /(?:show|list|get)\s+(?:my\s+)?(?:nft|nfts)/i,
    action: 'balances.getNFTs',
    riskLevel: 'LOW' as const,
    extract: () => ({}),
  },
  {
    pattern: /(?:approve|allow)\s+(\w+)\s+(?:to\s+spend|for)\s+(\d+(?:\.\d+)?)\s+(\w+)/i,
    action: 'approvals.set',
    riskLevel: 'MEDIUM' as const,
    extract: (match: RegExpMatchArray) => ({
      spender: match[1],
      amount: match[2],
      token: match[3].toUpperCase(),
    }),
  },
];

function calculateConfidence(
  input: string,
  entities: Record<string, any>
): number {
  let confidence = 0.7;

  const cleanInput = input.trim().toLowerCase();
  if (cleanInput.length > 0 && cleanInput.length < 200) {
    confidence += 0.1;
  }

  const hasNumbers = Object.values(entities).some(
    (v) => typeof v === 'string' && /\d/.test(v)
  );
  if (hasNumbers) confidence += 0.1;

  const hasAddress = Object.values(entities).some(
    (v) => typeof v === 'string' && /^0x[a-fA-F0-9]{40}$/.test(v)
  );
  if (hasAddress) confidence += 0.05;

  return Math.min(confidence, 0.95);
}

function assessRiskLevel(
  action: string,
  entities: Record<string, any>,
  baseRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  let riskLevel = baseRisk;

  const amount = parseFloat(entities.amount || entities.fromAmount || '0');
  if (amount > 10000) {
    riskLevel = 'CRITICAL';
  } else if (amount > 1000) {
    if (riskLevel === 'MEDIUM') riskLevel = 'HIGH';
    if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
  }

  if (action.startsWith('bridge.') && riskLevel === 'MEDIUM') {
    riskLevel = 'HIGH';
  }

  return riskLevel;
}

export async function parseIntent(input: string): Promise<ParsedIntent | null> {
  if (!input || input.trim().length === 0) {
    return null;
  }

  const cleanInput = input.trim();

  for (const { pattern, action, riskLevel: baseRisk, extract } of intentPatterns) {
    const match = cleanInput.match(pattern);
    if (match) {
      const entities = extract(match);
      const confidence = calculateConfidence(cleanInput, entities);
      const riskLevel = assessRiskLevel(action, entities, baseRisk);
      return {
        action,
        entities,
        confidence,
        riskLevel,
        requiresConfirmation: riskLevel === 'HIGH' || riskLevel === 'CRITICAL',
      };
    }
  }

  return null;
}

// Validate a parsed NL intent (ParsedIntent type)
export function validateIntent(intent: ParsedIntent): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!intent.action || intent.action.length === 0) {
    errors.push('Missing action');
  }

  if (intent.confidence < 0 || intent.confidence > 1) {
    errors.push('Invalid confidence score');
  }

  if (intent.action === 'trade.swap') {
    if (!intent.entities.fromAmount || !intent.entities.fromToken || !intent.entities.toToken) {
      errors.push('Swap requires fromAmount, fromToken, and toToken');
    }
    const amount = parseFloat(intent.entities.fromAmount);
    if (isNaN(amount) || amount <= 0) {
      errors.push('Invalid swap amount');
    }
  }

  if (intent.action === 'transfer.send') {
    if (!intent.entities.amount || !intent.entities.token || !intent.entities.recipient) {
      errors.push('Transfer requires amount, token, and recipient');
    }
    const amount = parseFloat(intent.entities.amount);
    if (isNaN(amount) || amount <= 0) {
      errors.push('Invalid transfer amount');
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(intent.entities.recipient)) {
      errors.push('Invalid recipient address');
    }
  }

  if (intent.action === 'bridge.transfer') {
    if (
      !intent.entities.amount ||
      !intent.entities.token ||
      !intent.entities.fromChain ||
      !intent.entities.toChain
    ) {
      errors.push('Bridge requires amount, token, fromChain, and toChain');
    }
    const amount = parseFloat(intent.entities.amount);
    if (isNaN(amount) || amount <= 0) {
      errors.push('Invalid bridge amount');
    }
  }

  return { valid: errors.length === 0, errors };
}

// Enhanced parsing with AI fallback (placeholder for OpenAI integration)
export async function parseIntentWithAI(input: string): Promise<ParsedIntent | null> {
  const intent = await parseIntent(input);

  if (intent && intent.confidence >= 0.6) {
    return intent;
  }

  // TODO: Implement OpenAI fallback for low confidence or no match
  // This would integrate with lib/ai/openai.ts
  return intent;
}

export function getIntentDescription(intent: ParsedIntent): string {
  switch (intent.action) {
    case 'trade.swap':
      return `Swap ${intent.entities.fromAmount} ${intent.entities.fromToken} for ${intent.entities.toToken}`;
    case 'transfer.send':
      return `Send ${intent.entities.amount} ${intent.entities.token} to ${intent.entities.recipient}`;
    case 'bridge.transfer':
      return `Bridge ${intent.entities.amount} ${intent.entities.token} from ${intent.entities.fromChain} to ${intent.entities.toChain}`;
    case 'balances.get':
      return 'Get your token balances';
    case 'balances.getNFTs':
      return 'Get your NFT collection';
    case 'approvals.set':
      return `Approve ${intent.entities.spender} to spend ${intent.entities.amount} ${intent.entities.token}`;
    default:
      return 'Unknown action';
  }
}
