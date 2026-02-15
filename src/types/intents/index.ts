// Intent type definitions for the Planner → Executor pipeline

export type IntentType = 'balances.get' | 'trade.swap' | 'bridge.transfer' | 'rewards.claim';

export type IntentStatus = 
  | 'planned'      // Initial state after parsing
  | 'preflight'    // Fetching balances, quotes, simulating
  | 'previewed'    // Preview generated, awaiting user confirmation
  | 'building'     // Building transaction with Permit2/allowances
  | 'submitted'    // Sent to wallet
  | 'completed'    // Transaction confirmed on-chain
  | 'failed';      // Error occurred

// Base intent interface
export interface BaseIntent {
  type: IntentType;
  takerAddress: string;
  chainId: number;
}

// balances.get intent - retrieve token balances and approvals
export interface BalancesGetIntent extends BaseIntent {
  type: 'balances.get';
  tokens?: string[];  // Optional: specific tokens to check, otherwise all
  includeApprovals?: boolean;
  includeNFTs?: boolean;
}

// trade.swap intent - perform a token swap
export interface TradeSwapIntent extends BaseIntent {
  type: 'trade.swap';
  from: {
    token: string;    // Token address or symbol
    amount: string;   // Amount in token units
    chain: string;
  };
  to: {
    token: string;
    chain: string;
    minAmount?: string;  // Minimum acceptable output
  };
  constraints?: {
    slippage_bps?: number;        // Slippage in basis points (default: 50 = 0.5%)
    prefer_sources?: string[];    // DEX preferences (e.g., ['Uniswap_V3'])
    max_gas_price?: string;       // Max gas price in gwei
    deadline?: number;            // Unix timestamp
    simulate?: boolean;           // Force simulation before execution
  };
}

// bridge.transfer intent - bridge tokens between chains
export interface BridgeTransferIntent extends BaseIntent {
  type: 'bridge.transfer';
  from: {
    token: string;
    amount: string;
    chain: string;
  };
  to: {
    chain: string;
    recipient?: string;  // Optional: different recipient address
  };
  constraints?: {
    max_delay_minutes?: number;   // Maximum acceptable bridging delay
    min_output?: string;          // Minimum output after fees
    preferred_bridge?: string;    // Preferred bridge protocol
  };
}

// rewards.claim intent - claim gaming rewards or airdrops
export interface RewardsClaimIntent extends BaseIntent {
  type: 'rewards.claim';
  rewards: Array<{
    contract: string;
    tokenId?: string;    // For NFT rewards
    amount?: string;     // For fungible rewards
    proof?: string[];    // Merkle proof if needed
  }>;
  claimAll?: boolean;     // Batch claim all available rewards
}

export type Intent = BalancesGetIntent | TradeSwapIntent | BridgeTransferIntent | RewardsClaimIntent;

// Transaction preview data
export interface TransactionPreview {
  summary: string;
  tokenDeltas: Array<{
    token: string;
    symbol: string;
    amount: string;
    usdValue?: number;
    direction: 'in' | 'out';
  }>;
  gasCost: {
    estimatedGas: string;
    gasPrice: string;
    totalCostEth: string;
    totalCostUsd?: number;
  };
  warnings?: string[];
  decodedCalls?: Array<{
    to: string;
    function: string;
    params: Record<string, any>;
  }>;
  simulationResult?: {
    success: boolean;
    revertReason?: string;
    traceUrl?: string;  // Link to Tenderly trace
  };
}

// Quote response from DEX aggregator
export interface SwapQuote {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  buyAmount: string;
  price: string;
  guaranteedPrice: string;
  route: Array<{
    source: string;
    percentage: number;
  }>;
  estimatedGas: string;
  gasPrice: string;
  protocolFee: string;
  minimumProtocolFee: string;
  buyTokenToEthRate: string;
  sellTokenToEthRate: string;
  expectedSlippage: string;
  permit2?: {
    eip712: any;
  };
  transaction: {
    to: string;
    data: string;
    value: string;
    gas: string;
    gasPrice: string;
  };
}

// Built transaction ready for wallet
export interface BuiltTransaction {
  to: string;
  data: string;
  value: string;
  gas: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
  chainId: number;
  permit2Signature?: string;
}

// Pipeline execution context
export interface ExecutionContext {
  intentId: string;
  userId: number;
  intent: Intent;
  status: IntentStatus;
  quote?: SwapQuote;
  preview?: TransactionPreview;
  transaction?: BuiltTransaction;
  txHash?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Safety limits
export interface UserLimits {
  dailyUsdCap?: number;
  maxApprovalUsd?: number;
  allowlist?: string[];  // Allowed contract addresses
  dailySpentUsd: number;
  lastResetAt: Date;
// Intent Type Definitions

export interface Intent {
  id: string;
  conversationId: string;
  userId: string;
  rawInput: string;
  parsedIntent: ParsedIntentData;
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'pending' | 'confirmed' | 'rejected' | 'executed' | 'failed';
  createdAt: Date;
  executedAt?: Date;
}

export interface ParsedIntentData {
  action: string;
  entities: Record<string, any>;
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requiresConfirmation: boolean;
}

export interface SwapIntent extends ParsedIntentData {
  action: 'trade.swap';
  entities: {
    fromAmount: string;
    fromToken: string;
    toToken: string;
  };
}

export interface TransferIntent extends ParsedIntentData {
  action: 'transfer.send';
  entities: {
    amount: string;
    token: string;
    recipient: string;
  };
}

export interface BridgeIntent extends ParsedIntentData {
  action: 'bridge.transfer';
  entities: {
    amount: string;
    token: string;
    fromChain: string;
    toChain: string;
  };
}

export interface BalanceIntent extends ParsedIntentData {
  action: 'balances.get' | 'balances.getNFTs';
  entities: Record<string, never>;
}

export interface ApprovalIntent extends ParsedIntentData {
  action: 'approvals.set';
  entities: {
    spender: string;
    amount: string;
    token: string;
  };
}

export type IntentAction =
  | 'trade.swap'
  | 'transfer.send'
  | 'bridge.transfer'
  | 'balances.get'
  | 'balances.getNFTs'
  | 'approvals.set';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IntentStatus = 'pending' | 'confirmed' | 'rejected' | 'executed' | 'failed';

// Intent execution context
export interface IntentExecutionContext {
  userId: string;
  conversationId: string;
  intentId: string;
  walletAddress: string;
  chainId?: number;
}

// Intent execution result
export interface IntentExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  transactionId?: string;
  requiresApproval?: boolean;
}

// Intent validation result
export interface IntentValidationResult {
  valid: boolean;
  errors: string[];
}

// Intent preview data
export interface IntentPreview {
  action: string;
  description: string;
  entities: Record<string, any>;
  riskLevel: RiskLevel;
  estimatedGas: string;
  warnings: string[];
}
