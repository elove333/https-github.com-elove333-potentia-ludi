// Intent Parser Service
// Parses natural language input into structured intents

export interface ParsedIntent {
  action: string;
  entities: Record<string, any>;
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiresConfirmation: boolean;
}

// Intent patterns with explicit regex flags
const intentPatterns = [
  {
    pattern: /(?:swap|trade|exchange)\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:for|to)\s+(\w+)/i,
    action: 'trade.swap',
    riskLevel: 'MEDIUM' as const,
    extract: (match: RegExpMatchArray) => ({
      fromAmount: match[1],
      fromToken: match[2].toUpperCase(),
      toToken: match[3].toUpperCase()
    })
  },
  {
    pattern: /(?:send|transfer)\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:to)\s+(0x[a-fA-F0-9]{40})/i,
    action: 'transfer.send',
    riskLevel: 'HIGH' as const,
    extract: (match: RegExpMatchArray) => ({
      amount: match[1],
      token: match[2].toUpperCase(),
      recipient: match[3]
    })
  },
  {
    pattern: /(?:bridge|move)\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:from)\s+(\w+)\s+(?:to)\s+(\w+)/i,
    action: 'bridge.transfer',
    riskLevel: 'HIGH' as const,
    extract: (match: RegExpMatchArray) => ({
      amount: match[1],
      token: match[2].toUpperCase(),
      fromChain: match[3],
      toChain: match[4]
    })
  },
  {
    pattern: /(?:show|get|check)\s+(?:my\s+)?balance(?:s)?/i,
    action: 'balances.get',
    riskLevel: 'LOW' as const,
    extract: () => ({})
  },
  {
    pattern: /(?:show|list|get)\s+(?:my\s+)?(?:nft|nfts)/i,
    action: 'balances.getNFTs',
    riskLevel: 'LOW' as const,
    extract: () => ({})
  },
  {
    pattern: /(?:approve|allow)\s+(\w+)\s+(?:to\s+spend|for)\s+(\d+(?:\.\d+)?)\s+(\w+)/i,
    action: 'approvals.set',
    riskLevel: 'MEDIUM' as const,
    extract: (match: RegExpMatchArray) => ({
      spender: match[1],
      amount: match[2],
      token: match[3].toUpperCase()
    })
  }
];

// Calculate confidence score based on pattern match
function calculateConfidence(
  input: string,
  pattern: RegExp,
  entities: Record<string, any>
): number {
  let confidence = 0.7; // Base confidence for pattern match

  // Increase confidence if input is relatively clean
  const cleanInput = input.trim().toLowerCase();
  if (cleanInput.length > 0 && cleanInput.length < 200) {
    confidence += 0.1;
  }

  // Increase confidence if we extracted concrete values
  const hasNumbers = Object.values(entities).some(v => 
    typeof v === 'string' && /\d/.test(v)
  );
  if (hasNumbers) {
    confidence += 0.1;
  }

  // Increase confidence if we have addresses
  const hasAddress = Object.values(entities).some(v =>
    typeof v === 'string' && /^0x[a-fA-F0-9]{40}$/.test(v)
  );
  if (hasAddress) {
    confidence += 0.05;
  }

  // Cap at 0.95 (never 100% confident in NLP)
  return Math.min(confidence, 0.95);
}

// Assess risk level based on action and entities
function assessRiskLevel(
  action: string,
  entities: Record<string, any>,
  baseRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  let riskLevel = baseRisk;

  // Increase risk for large amounts
  const amount = parseFloat(entities.amount || entities.fromAmount || '0');
  if (amount > 10000) {
    riskLevel = 'CRITICAL';
  } else if (amount > 1000) {
    if (riskLevel === 'MEDIUM') riskLevel = 'HIGH';
    if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
  }

  // Bridge operations are inherently riskier
  if (action.startsWith('bridge.')) {
    if (riskLevel === 'MEDIUM') riskLevel = 'HIGH';
  }

  return riskLevel;
}

// Main parser function
export async function parseIntent(input: string): Promise<ParsedIntent | null> {
  if (!input || input.trim().length === 0) {
    return null;
  }

  const cleanInput = input.trim();

  // Try each pattern
  for (const { pattern, action, riskLevel: baseRisk, extract } of intentPatterns) {
    const match = cleanInput.match(pattern);
    
    if (match) {
      const entities = extract(match);
      const confidence = calculateConfidence(cleanInput, pattern, entities);
      const riskLevel = assessRiskLevel(action, entities, baseRisk);
      
      return {
        action,
        entities,
        confidence,
        riskLevel,
        requiresConfirmation: riskLevel === 'HIGH' || riskLevel === 'CRITICAL'
      };
    }
  }

  // No pattern matched
  return null;
}

// Validate parsed intent
export function validateIntent(intent: ParsedIntent): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check action is valid
  if (!intent.action || intent.action.length === 0) {
    errors.push('Missing action');
  }

  // Check confidence is in valid range
  if (intent.confidence < 0 || intent.confidence > 1) {
    errors.push('Invalid confidence score');
  }

  // Validate entities based on action
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
    if (!intent.entities.amount || !intent.entities.token || 
        !intent.entities.fromChain || !intent.entities.toChain) {
      errors.push('Bridge requires amount, token, fromChain, and toChain');
    }
    
    const amount = parseFloat(intent.entities.amount);
    if (isNaN(amount) || amount <= 0) {
      errors.push('Invalid bridge amount');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Enhanced parsing with AI fallback (placeholder for OpenAI integration)
export async function parseIntentWithAI(input: string): Promise<ParsedIntent | null> {
  // First try pattern matching
  const intent = await parseIntent(input);
  
  if (intent && intent.confidence >= 0.6) {
    return intent;
  }

  // TODO: Implement OpenAI fallback for low confidence or no match
  // This would integrate with lib/ai/openai.ts
  
  return intent;
}

// Get intent description for user confirmation
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
