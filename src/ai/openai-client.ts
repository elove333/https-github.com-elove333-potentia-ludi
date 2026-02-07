/**
 * OpenAI Client for Conversational Web3 Wallet Hub
 * 
 * This module handles communication with the OpenAI Responses API
 * to convert natural language queries into structured intents.
 * 
 * Setup:
 * 1. Install OpenAI SDK: npm install openai
 * 2. Set OPENAI_API_KEY environment variable
 * 3. Configure model and parameters below
 */

/**
 * OpenAI Configuration
 */
export const OPENAI_CONFIG = {
  apiKey: process.env.OPENAI_API_KEY || '',
  model: 'gpt-4',
  maxTokens: 500,
  temperature: 0.1, // Low temperature for consistent parsing
};

/**
 * Context for NL processing
 */
export interface NLContext {
  /** User's wallet address */
  walletAddress: string;
  
  /** Connected chains */
  connectedChains: number[];
  
  /** Recent transaction history */
  recentTransactions?: Array<{
    hash: string;
    type: string;
    timestamp: number;
  }>;
  
  /** User preferences */
  preferences?: {
    defaultChain?: number;
    slippageTolerance?: number;
    gasPreference?: 'low' | 'medium' | 'high';
  };
}

/**
 * Natural language request
 */
export interface NLRequest {
  /** User's message */
  userMessage: string;
  
  /** Context about user and wallet */
  context: NLContext;
  
  /** Conversation history (for context) */
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

/**
 * Intent parsed from natural language
 */
export interface ParsedIntent {
  /** Intent type (e.g., 'balances.get', 'trade.swap') */
  intent: string;
  
  /** Confidence score (0-1) */
  confidence: number;
  
  /** Extracted parameters */
  parameters: Record<string, any>;
  
  /** Whether confirmation is required */
  requiresConfirmation: boolean;
  
  /** Estimated gas cost (if applicable) */
  estimatedGas?: string;
  
  /** Warnings or notes */
  warnings?: string[];
  
  /** User-friendly explanation */
  explanation?: string;
}

/**
 * System prompt for the OpenAI model
 */
const SYSTEM_PROMPT = `You are a Web3 wallet assistant that converts natural language queries into structured intents.

You support these intent types:
- balances.get: Get balance for an address/token
- balances.track: Track balance changes
- trade.swap: Swap tokens on a DEX
- trade.quote: Get swap quotes
- bridge.transfer: Bridge assets to another chain
- bridge.estimate: Get bridge cost estimates
- transfer.execute: Transfer tokens
- gas.estimate: Estimate gas costs
- history.get: View transaction history
- nft.query: Query NFT holdings

Extract these parameters based on the intent:
- address: Ethereum address (default to user's address if not specified)
- chainId: Chain ID (1=Ethereum, 137=Polygon, 56=BSC, 42161=Arbitrum, 10=Optimism, 8453=Base)
- tokenAddress: Token contract address (use 'native' for native token)
- amount: Amount in token units (e.g., "1 ETH", "100 USDC")
- recipient: Recipient address (for transfers)
- slippage: Slippage tolerance percentage
- fromChainId, toChainId: For bridge operations

Respond with a JSON object containing:
{
  "intent": "intent.type",
  "confidence": 0.0-1.0,
  "parameters": { ... },
  "requiresConfirmation": true/false,
  "warnings": ["warning1", "warning2"],
  "explanation": "What you understood"
}

Be conservative: if you're not confident (< 0.7), ask for clarification.`;

/**
 * Parse natural language to intent using OpenAI
 * 
 * @param request - Natural language request
 * @returns Parsed intent
 * 
 * @example
 * const intent = await parseNaturalLanguage({
 *   userMessage: "What's my USDC balance on Polygon?",
 *   context: {
 *     walletAddress: "0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4",
 *     connectedChains: [1, 137]
 *   }
 * });
 */
export async function parseNaturalLanguage(request: NLRequest): Promise<ParsedIntent> {
  // TODO: Implement actual OpenAI API call
  // 
  // Implementation steps:
  // 1. Import OpenAI SDK
  // 2. Create client instance
  // 3. Build messages array with system prompt and user message
  // 4. Include context in user message
  // 5. Call chat.completions.create()
  // 6. Parse JSON response
  // 7. Validate and return
  
  // Example implementation (commented):
  /*
  import OpenAI from 'openai';
  
  const openai = new OpenAI({
    apiKey: OPENAI_CONFIG.apiKey,
  });
  
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...request.conversationHistory || [],
    { 
      role: 'user', 
      content: `${request.userMessage}\n\nContext:\n${JSON.stringify(request.context, null, 2)}`
    },
  ];
  
  const response = await openai.chat.completions.create({
    model: OPENAI_CONFIG.model,
    messages,
    max_tokens: OPENAI_CONFIG.maxTokens,
    temperature: OPENAI_CONFIG.temperature,
    response_format: { type: 'json_object' },
  });
  
  const content = response.choices[0].message.content;
  const parsed = JSON.parse(content);
  
  return parsed as ParsedIntent;
  */
  
  // Placeholder mock implementation
  console.log('Parsing natural language:', request.userMessage);
  
  return mockParseIntent(request);
}

/**
 * Mock intent parser for development
 * TODO: Replace with actual OpenAI implementation
 */
function mockParseIntent(request: NLRequest): ParsedIntent {
  const message = request.userMessage.toLowerCase();
  
  // Simple pattern matching for common queries
  if (message.includes('balance')) {
    return {
      intent: 'balances.get',
      confidence: 0.95,
      parameters: {
        address: request.context.walletAddress,
        chainId: request.context.preferences?.defaultChain || 137,
        includeUsdValue: true,
      },
      requiresConfirmation: false,
      explanation: 'I understand you want to check your balance.',
    };
  }
  
  if (message.includes('swap')) {
    return {
      intent: 'trade.swap',
      confidence: 0.85,
      parameters: {
        chainId: 137,
        fromToken: 'native',
        toToken: '0x2791Bca1f2de4631BD6E1fA2d1AE6641Ed58b55d', // USDC
        amount: '1000000000000000000', // 1 ETH in wei
        slippage: 0.5,
      },
      requiresConfirmation: true,
      warnings: ['Please review the swap details carefully before confirming.'],
      explanation: 'I understand you want to swap tokens.',
    };
  }
  
  if (message.includes('bridge')) {
    return {
      intent: 'bridge.transfer',
      confidence: 0.88,
      parameters: {
        fromChainId: 137,
        toChainId: 1,
        token: 'native',
        amount: '100000000000000000000', // 100 tokens
        recipient: request.context.walletAddress,
      },
      requiresConfirmation: true,
      warnings: [
        'Bridge transfers can take several minutes to complete.',
        'Make sure you have sufficient balance for fees.',
      ],
      explanation: 'I understand you want to bridge assets to another chain.',
    };
  }
  
  // Default: unclear intent
  return {
    intent: 'unknown',
    confidence: 0.3,
    parameters: {},
    requiresConfirmation: false,
    warnings: ['I\'m not sure what you want to do. Could you rephrase your request?'],
    explanation: 'I couldn\'t understand your request.',
  };
}

/**
 * Validate OpenAI configuration
 * 
 * @throws Error if configuration is invalid
 */
export function validateOpenAIConfig(): void {
  if (!OPENAI_CONFIG.apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  
  if (OPENAI_CONFIG.apiKey === '') {
    throw new Error('OPENAI_API_KEY is empty');
  }
}

/**
 * Test OpenAI connection
 * 
 * @returns Whether connection is successful
 */
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    validateOpenAIConfig();
    
    // TODO: Implement actual connection test
    // Try a simple API call to verify credentials
    
    return true;
  } catch (error) {
    console.error('OpenAI connection test failed:', error);
    return false;
  }
}
