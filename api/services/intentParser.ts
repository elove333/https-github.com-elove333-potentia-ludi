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
    extractEntities: (regexMatch: RegExpMatchArray) => ({
      fromAmount: regexMatch[1],
      fromToken: regexMatch[2].toUpperCase(),
      toToken: regexMatch[3].toUpperCase()
    })
  },
  {
    pattern: /(?:send|transfer)\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:to)\s+(0x[a-fA-F0-9]{40})/i,
    action: 'transfer.send',
    riskLevel: 'HIGH' as const,
    extractEntities: (regexMatch: RegExpMatchArray) => ({
      amount: regexMatch[1],
      token: regexMatch[2].toUpperCase(),
      recipient: regexMatch[3]
    })
  },
  {
    pattern: /(?:bridge|move)\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(?:from)\s+(\w+)\s+(?:to)\s+(\w+)/i,
    action: 'bridge.transfer',
    riskLevel: 'HIGH' as const,
    extractEntities: (regexMatch: RegExpMatchArray) => ({
      amount: regexMatch[1],
      token: regexMatch[2].toUpperCase(),
      fromChain: regexMatch[3],
      toChain: regexMatch[4]
    })
  },
  {
    pattern: /(?:show|get|check)\s+(?:my\s+)?balance(?:s)?/i,
    action: 'balances.get',
    riskLevel: 'LOW' as const,
    extractEntities: () => ({})
  },
  {
    pattern: /(?:show|list|get)\s+(?:my\s+)?(?:nft|nfts)/i,
    action: 'balances.getNFTs',
    riskLevel: 'LOW' as const,
    extractEntities: () => ({})
  },
  {
    pattern: /(?:approve|allow)\s+(\w+)\s+(?:to\s+spend|for)\s+(\d+(?:\.\d+)?)\s+(\w+)/i,
    action: 'approvals.set',
    riskLevel: 'MEDIUM' as const,
    extractEntities: (regexMatch: RegExpMatchArray) => ({
      spender: regexMatch[1],
      amount: regexMatch[2],
      token: regexMatch[3].toUpperCase()
    })
  }
];

// Calculate confidence score based on pattern match
function calculateConfidence(
  userInput: string,
  patternRegex: RegExp,
  extractedEntities: Record<string, any>
): number {
  let confidenceScore = 0.7; // Base confidence for pattern match

  // Increase confidence if input is relatively clean
  const cleanInput = userInput.trim().toLowerCase();
  if (cleanInput.length > 0 && cleanInput.length < 200) {
    confidenceScore += 0.1;
  }

  // Increase confidence if we extracted concrete values
  const hasNumbers = Object.values(extractedEntities).some(value => 
    typeof value === 'string' && /\d/.test(value)
  );
  if (hasNumbers) {
    confidenceScore += 0.1;
  }

  // Increase confidence if we have addresses
  const hasAddress = Object.values(extractedEntities).some(value =>
    typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value)
  );
  if (hasAddress) {
    confidenceScore += 0.05;
  }

  // Cap at 0.95 (never 100% confident in NLP)
  return Math.min(confidenceScore, 0.95);
}

// Assess risk level based on action and entities
function assessRiskLevel(
  intentAction: string,
  extractedEntities: Record<string, any>,
  baseRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  let riskLevel = baseRisk;

  // Increase risk for large amounts
  const transactionAmount = parseFloat(extractedEntities.amount || extractedEntities.fromAmount || '0');
  if (transactionAmount > 10000) {
    riskLevel = 'CRITICAL';
  } else if (transactionAmount > 1000) {
    if (riskLevel === 'MEDIUM') riskLevel = 'HIGH';
    if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
  }

  // Bridge operations are inherently riskier
  if (intentAction.startsWith('bridge.')) {
    if (riskLevel === 'MEDIUM') riskLevel = 'HIGH';
  }

  return riskLevel;
}

// Main parser function
export async function parseIntent(userInput: string): Promise<ParsedIntent | null> {
  if (!userInput || userInput.trim().length === 0) {
    return null;
  }

  const sanitizedInput = userInput.trim();

  // Try each pattern
  for (const { pattern, action, riskLevel: baseRisk, extractEntities } of intentPatterns) {
    const regexMatch = sanitizedInput.match(pattern);
    
    if (regexMatch) {
      const extractedEntities = extractEntities(regexMatch);
      const confidenceScore = calculateConfidence(sanitizedInput, pattern, extractedEntities);
      const assessedRiskLevel = assessRiskLevel(action, extractedEntities, baseRisk);
      
      return {
        action,
        entities: extractedEntities,
        confidence: confidenceScore,
        riskLevel: assessedRiskLevel,
        requiresConfirmation: assessedRiskLevel === 'HIGH' || assessedRiskLevel === 'CRITICAL'
      };
    }
  }

  // No pattern matched
  return null;
}

// Validate parsed intent
export function validateIntent(parsedIntent: ParsedIntent): {
  valid: boolean;
  errors: string[];
} {
  const validationErrors: string[] = [];

  // Check action is valid
  if (!parsedIntent.action || parsedIntent.action.length === 0) {
    validationErrors.push('Missing action');
  }

  // Check confidence is in valid range
  if (parsedIntent.confidence < 0 || parsedIntent.confidence > 1) {
    validationErrors.push('Invalid confidence score');
  }

  // Validate entities based on action
  if (parsedIntent.action === 'trade.swap') {
    if (!parsedIntent.entities.fromAmount || !parsedIntent.entities.fromToken || !parsedIntent.entities.toToken) {
      validationErrors.push('Swap requires fromAmount, fromToken, and toToken');
    }
    
    const swapAmount = parseFloat(parsedIntent.entities.fromAmount);
    if (isNaN(swapAmount) || swapAmount <= 0) {
      validationErrors.push('Invalid swap amount');
    }
  }

  if (parsedIntent.action === 'transfer.send') {
    if (!parsedIntent.entities.amount || !parsedIntent.entities.token || !parsedIntent.entities.recipient) {
      validationErrors.push('Transfer requires amount, token, and recipient');
    }
    
    const transferAmount = parseFloat(parsedIntent.entities.amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      validationErrors.push('Invalid transfer amount');
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(parsedIntent.entities.recipient)) {
      validationErrors.push('Invalid recipient address');
    }
  }

  if (parsedIntent.action === 'bridge.transfer') {
    if (!parsedIntent.entities.amount || !parsedIntent.entities.token || 
        !parsedIntent.entities.fromChain || !parsedIntent.entities.toChain) {
      validationErrors.push('Bridge requires amount, token, fromChain, and toChain');
    }
    
    const bridgeAmount = parseFloat(parsedIntent.entities.amount);
    if (isNaN(bridgeAmount) || bridgeAmount <= 0) {
      validationErrors.push('Invalid bridge amount');
    }
  }

  return {
    valid: validationErrors.length === 0,
    errors: validationErrors
  };
}

// Enhanced parsing with AI fallback (placeholder for OpenAI integration)
export async function parseIntentWithAI(userInput: string): Promise<ParsedIntent | null> {
  // First try pattern matching
  const parsedIntent = await parseIntent(userInput);
  
  if (parsedIntent && parsedIntent.confidence >= 0.6) {
    return parsedIntent;
  }

  // TODO: Implement OpenAI fallback for low confidence or no match
  // This would integrate with lib/ai/openai.ts
  
  return parsedIntent;
}

// Get intent description for user confirmation
export function getIntentDescription(parsedIntent: ParsedIntent): string {
  switch (parsedIntent.action) {
    case 'trade.swap':
      return `Swap ${parsedIntent.entities.fromAmount} ${parsedIntent.entities.fromToken} for ${parsedIntent.entities.toToken}`;
    case 'transfer.send':
      return `Send ${parsedIntent.entities.amount} ${parsedIntent.entities.token} to ${parsedIntent.entities.recipient}`;
    case 'bridge.transfer':
      return `Bridge ${parsedIntent.entities.amount} ${parsedIntent.entities.token} from ${parsedIntent.entities.fromChain} to ${parsedIntent.entities.toChain}`;
    case 'balances.get':
      return 'Get your token balances';
    case 'balances.getNFTs':
      return 'Get your NFT collection';
    case 'approvals.set':
      return `Approve ${parsedIntent.entities.spender} to spend ${parsedIntent.entities.amount} ${parsedIntent.entities.token}`;
    default:
      return 'Unknown action';
  }
}
