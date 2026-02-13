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
