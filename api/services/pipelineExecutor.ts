// Pipeline executor: orchestrates Preflight → Preview → Build → Wallet stages
import {
  Intent,
  ExecutionContext,
  IntentStatus,
  TransactionPreview,
  SwapQuote,
  BuiltTransaction,
} from '../../src/types/intents';
import { intentQueries, limitsQueries, telemetryQueries } from '../lib/database';

export class PipelineExecutor {
  /**
   * Execute the full pipeline for an intent
   */
  async execute(context: ExecutionContext): Promise<ExecutionContext> {
    try {
      // Stage 1: Preflight
      context = await this.preflight(context);

      // Stage 2: Preview
      context = await this.preview(context);

      // Stage 3: Build (requires user confirmation in production)
      // Skipped in this implementation - requires UI interaction

      return context;
    } catch (error: any) {
      context.status = 'failed';
      context.error = error.message;
      await intentQueries.updateStatus(context.intentId, 'failed', undefined, undefined, error.message);
      await telemetryQueries.log(context.userId, 'intent_failed', {
        intentId: context.intentId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Stage 1: Preflight - fetch balances, quotes, simulate
   */
  private async preflight(context: ExecutionContext): Promise<ExecutionContext> {
    context.status = 'preflight';
    await intentQueries.updateStatus(context.intentId, 'preflight');
    await telemetryQueries.log(context.userId, 'preflight_start', { intentId: context.intentId });

    const intent = context.intent;

    switch (intent.type) {
      case 'balances.get':
        // Fetch balances from chain
        await this.fetchBalances(intent, context);
        break;

      case 'trade.swap':
        // Check balance, fetch quote
        await this.fetchSwapQuote(intent, context);
        break;

      case 'bridge.transfer':
        // Check balance, get bridge quote
        await this.fetchBridgeQuote(intent, context);
        break;

      case 'rewards.claim':
        // Check claimable rewards
        await this.fetchClaimableRewards(intent, context);
        break;
    }

    await telemetryQueries.log(context.userId, 'preflight_complete', { intentId: context.intentId });
    return context;
  }

  /**
   * Stage 2: Preview - generate human-readable summary
   */
  private async preview(context: ExecutionContext): Promise<ExecutionContext> {
    context.status = 'previewed';
    await telemetryQueries.log(context.userId, 'preview_start', { intentId: context.intentId });

    const preview = await this.generatePreview(context);
    context.preview = preview;

    // Check safety limits
    await this.checkSafetyLimits(context);

    await intentQueries.updateStatus(context.intentId, 'previewed', preview);
    await telemetryQueries.log(context.userId, 'preview_complete', {
      intentId: context.intentId,
      preview,
    });

    return context;
  }

  /**
   * Stage 3: Build - create transaction with Permit2 or bounded allowances
   */
  async buildTransaction(context: ExecutionContext): Promise<ExecutionContext> {
    context.status = 'building';
    await intentQueries.updateStatus(context.intentId, 'building');
    await telemetryQueries.log(context.userId, 'build_start', { intentId: context.intentId });

    const transaction = await this.craftTransaction(context);
    context.transaction = transaction;

    await telemetryQueries.log(context.userId, 'build_complete', {
      intentId: context.intentId,
      transaction,
    });

    return context;
  }

  /**
   * Fetch balances for balances.get intent
   */
  private async fetchBalances(intent: any, context: ExecutionContext): Promise<void> {
    // Mock implementation - in production, call Alchemy/Moralis API
    context.preview = {
      summary: `Fetching balances for ${intent.takerAddress}`,
      tokenDeltas: [],
      gasCost: {
        estimatedGas: '0',
        gasPrice: '0',
        totalCostEth: '0',
      },
    };
  }

  /**
   * Fetch swap quote from 0x API
   */
  private async fetchSwapQuote(intent: any, context: ExecutionContext): Promise<void> {
    // Mock implementation - in production, call 0x Swap API v2
    const mockQuote: SwapQuote = {
      sellToken: intent.from.token,
      buyToken: intent.to.token,
      sellAmount: intent.from.amount,
      buyAmount: '0', // Would be filled by API
      price: '1.0',
      guaranteedPrice: '0.995',
      route: [{ source: 'Uniswap_V3', percentage: 100 }],
      estimatedGas: '200000',
      gasPrice: '30000000000',
      protocolFee: '0',
      minimumProtocolFee: '0',
      buyTokenToEthRate: '1',
      sellTokenToEthRate: '1',
      expectedSlippage: '0.5',
      transaction: {
        to: '0x0000000000000000000000000000000000000000',
        data: '0x',
        value: '0',
        gas: '200000',
        gasPrice: '30000000000',
      },
    };

    context.quote = mockQuote;
  }

  /**
   * Fetch bridge quote
   */
  private async fetchBridgeQuote(intent: any, context: ExecutionContext): Promise<void> {
    // Mock implementation - in production, call bridge aggregator API
    context.preview = {
      summary: `Bridge ${intent.from.amount} ${intent.from.token} from ${intent.from.chain} to ${intent.to.chain}`,
      tokenDeltas: [],
      gasCost: {
        estimatedGas: '150000',
        gasPrice: '30000000000',
        totalCostEth: '0.0045',
      },
      warnings: ['Bridge transfers may take 10-30 minutes'],
    };
  }

  /**
   * Fetch claimable rewards
   */
  private async fetchClaimableRewards(intent: any, context: ExecutionContext): Promise<void> {
    // Mock implementation - in production, query contracts for claimable amounts
    context.preview = {
      summary: 'No claimable rewards found',
      tokenDeltas: [],
      gasCost: {
        estimatedGas: '0',
        gasPrice: '0',
        totalCostEth: '0',
      },
    };
  }

  /**
   * Generate human-readable preview
   */
  private async generatePreview(context: ExecutionContext): Promise<TransactionPreview> {
    const intent = context.intent;

    switch (intent.type) {
      case 'trade.swap': {
        const quote = context.quote;
        return {
          summary: `Swap ${intent.from.amount} ${intent.from.token} → ${quote?.buyAmount || '0'} ${intent.to.token}`,
          tokenDeltas: [
            {
              token: intent.from.token,
              symbol: intent.from.token,
              amount: intent.from.amount,
              direction: 'out',
            },
            {
              token: intent.to.token,
              symbol: intent.to.token,
              amount: quote?.buyAmount || '0',
              direction: 'in',
            },
          ],
          gasCost: {
            estimatedGas: quote?.estimatedGas || '200000',
            gasPrice: quote?.gasPrice || '30000000000',
            totalCostEth: '0.006',
            totalCostUsd: 15.0,
          },
          warnings: this.generateWarnings(context),
        };
      }

      case 'bridge.transfer':
        return context.preview || {
          summary: `Bridge ${intent.from.amount} ${intent.from.token}`,
          tokenDeltas: [],
          gasCost: {
            estimatedGas: '150000',
            gasPrice: '30000000000',
            totalCostEth: '0.0045',
          },
        };

      default:
        return context.preview || {
          summary: 'Preview not available',
          tokenDeltas: [],
          gasCost: {
            estimatedGas: '0',
            gasPrice: '0',
            totalCostEth: '0',
          },
        };
    }
  }

  /**
   * Generate warnings based on context
   */
  private generateWarnings(context: ExecutionContext): string[] {
    const warnings: string[] = [];
    const intent = context.intent;

    if (intent.type === 'trade.swap') {
      const quote = context.quote;
      if (quote) {
        // Check slippage
        const slippage = parseFloat(quote.expectedSlippage);
        if (slippage > 1.0) {
          warnings.push(`High slippage detected: ${slippage.toFixed(2)}%`);
        }

        // Check gas price
        const gasPrice = parseInt(quote.gasPrice);
        if (gasPrice > 50000000000) {
          warnings.push('Gas prices are currently high. Consider waiting.');
        }
      }
    }

    return warnings;
  }

  /**
   * Check safety limits before execution
   */
  private async checkSafetyLimits(context: ExecutionContext): Promise<void> {
    const limits = await limitsQueries.get(context.userId);
    
    if (!limits) {
      return; // No limits set
    }

    const intent = context.intent;
    let usdValue = 0;

    // Calculate USD value based on intent type
    if (intent.type === 'trade.swap') {
      // Mock USD calculation - in production, fetch from price oracle
      usdValue = parseFloat(intent.from.amount) * 1.0; // Assume $1 per token
    }

    // Check daily cap
    if (limits.daily_usd_cap) {
      const newSpent = limits.daily_spent_usd + usdValue;
      if (newSpent > limits.daily_usd_cap) {
        throw new Error(`Daily spending limit exceeded: ${newSpent} > ${limits.daily_usd_cap}`);
      }
    }

    // Check allowlist
    if (limits.allowlist && limits.allowlist.length > 0) {
      const quote = context.quote;
      if (quote && !limits.allowlist.includes(quote.transaction.to)) {
        throw new Error(`Contract ${quote.transaction.to} not in allowlist`);
      }
    }

    // Increment spent amount
    if (usdValue > 0) {
      await limitsQueries.incrementSpent(context.userId, usdValue);
    }
  }

  /**
   * Craft final transaction with Permit2 or bounded allowances
   */
  private async craftTransaction(context: ExecutionContext): Promise<BuiltTransaction> {
    const intent = context.intent;
    const quote = context.quote;

    if (!quote) {
      throw new Error('No quote available to build transaction');
    }

    // Prefer Permit2 if available
    const usePermit2 = quote.permit2 !== undefined;

    const transaction: BuiltTransaction = {
      to: quote.transaction.to,
      data: quote.transaction.data,
      value: quote.transaction.value,
      gas: quote.transaction.gas,
      gasPrice: quote.transaction.gasPrice,
      chainId: intent.chainId,
    };

    if (usePermit2 && quote.permit2) {
      // In production: sign Permit2 EIP-712 message
      transaction.permit2Signature = '0x'; // Mock signature
    } else {
      // Fallback: bounded allowance with expiry
      // In production: generate approve() transaction first
      await telemetryQueries.log(context.userId, 'using_bounded_allowance', {
        intentId: context.intentId,
      });
    }

    return transaction;
// Pipeline Executor Service
// Executes parsed intents through the appropriate workflow

import { ParsedIntent } from './intentParser';
import { executeWorkflow, getWorkflow } from '../../lib/workflows';
import { intentQueries, transactionQueries } from '../lib/database';

export interface ExecutionContext {
  userId: string;
  conversationId: string;
  intentId: string;
  walletAddress: string;
  chainId?: number;
}

export interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  transactionId?: string;
}

// Validate intent can be executed
export async function validateExecution(
  intent: ParsedIntent,
  context: ExecutionContext
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  // Check if workflow exists
  const workflow = getWorkflow(intent.action);
  if (!workflow) {
    errors.push(`Unknown workflow: ${intent.action}`);
    return { valid: false, errors };
  }

  // Validate based on risk level
  if (intent.riskLevel === 'CRITICAL') {
    // Additional validation for critical operations
    if (!context.walletAddress || context.walletAddress.length === 0) {
      errors.push('Wallet address required for critical operations');
    }
  }

  // Check required entities based on action
  if (intent.action.startsWith('trade.')) {
    if (!context.chainId || context.chainId <= 0) {
      errors.push('Chain ID required for trade operations');
    }
  }

  if (intent.action.startsWith('bridge.')) {
    if (!intent.entities.fromChain || !intent.entities.toChain) {
      errors.push('Source and destination chains required for bridge operations');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Execute intent through workflow pipeline
export async function executeIntent(
  intent: ParsedIntent,
  context: ExecutionContext
): Promise<ExecutionResult> {
  try {
    // Validate execution
    const validation = await validateExecution(intent, context);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }

    // Update intent status to executing
    await intentQueries.updateStatus(context.intentId, 'executing');

    // Prepare workflow parameters
    const workflowParams = {
      ...intent.entities,
      userAddress: context.walletAddress,
      chainId: context.chainId
    };

    // Prepare workflow context
    const workflowContext = {
      userId: context.userId,
      walletAddress: context.walletAddress,
      conversationId: context.conversationId,
      intentId: context.intentId,
      requestId: context.intentId,
      timestamp: new Date()
    };

    // Execute workflow
    const result = await executeWorkflow(intent.action, workflowParams, workflowContext);

    // Check if workflow requires transaction (check in data or result structure)
    if (result.data && (result.data as any).transaction) {
      const transactionData = (result.data as any).transaction;
      // Create transaction record
      const tx = await transactionQueries.create(
        context.userId,
        context.intentId,
        transactionData.chainId || context.chainId || 1,
        context.walletAddress,
        transactionData.to || null,
        transactionData.value || '0',
        transactionData.data ? { data: transactionData.data } : {}
      );

      // Update intent with transaction preview
      await intentQueries.updateStatus(
        context.intentId,
        'pending_approval',
        undefined,
        {
          transactionId: tx.id,
          preview: (result.data as any).preview
        }
      );

      return {
        success: true,
        data: {
          ...result,
          transactionId: tx.id,
          requiresApproval: true
        },
        transactionId: tx.id
      };
    }

    // Workflow completed without transaction
    await intentQueries.updateStatus(
      context.intentId,
      'executed',
      new Date()
    );

    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Pipeline execution error:', error);

    // Update intent status to failed
    await intentQueries.updateStatus(context.intentId, 'failed');

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Execute pending transaction
export async function executeTransaction(
  transactionId: string,
  txHash: string,
  context: ExecutionContext
): Promise<ExecutionResult> {
  try {
    // Update transaction with hash
    await transactionQueries.updateHash(transactionId, txHash);

    // Update intent status
    await intentQueries.updateStatus(
      context.intentId,
      'executed',
      new Date()
    );

    return {
      success: true,
      data: { txHash }
    };
  } catch (error) {
    console.error('Transaction execution error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Monitor transaction status
export async function monitorTransaction(
  transactionId: string,
  status: 'confirmed' | 'failed' | 'reverted',
  gasUsed?: string,
  gasPrice?: string,
  errorMessage?: string
): Promise<void> {
  try {
    await transactionQueries.updateStatus(
      transactionId,
      status,
      gasUsed,
      gasPrice,
      errorMessage
    );
  } catch (error) {
    console.error('Transaction monitoring error:', error);
  }
}

// Build execution preview without executing
export async function buildExecutionPreview(
  intent: ParsedIntent,
  context: ExecutionContext
): Promise<ExecutionResult> {
  try {
    // Validate execution
    const validation = await validateExecution(intent, context);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }

    // Get workflow
    const workflow = getWorkflow(intent.action);
    if (!workflow) {
      return {
        success: false,
        error: 'Workflow not found'
      };
    }

    // Build preview data
    const preview = {
      action: intent.action,
      description: workflow.metadata?.description || 'Unknown action',
      entities: intent.entities,
      riskLevel: intent.riskLevel,
      estimatedGas: '0', // TODO: Implement gas estimation
      warnings: (workflow.metadata as any)?.warnings || []
    };

    return {
      success: true,
      data: preview
    };
  } catch (error) {
    console.error('Preview build error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Cancel pending intent
export async function cancelIntent(
  intentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await intentQueries.updateStatus(intentId, 'rejected');
    
    return { success: true };
  } catch (error) {
    console.error('Intent cancellation error:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get intent execution status
export async function getIntentStatus(
  intentId: string
): Promise<{
  status: string;
  result?: any;
  error?: string;
}> {
  try {
    const intent = await intentQueries.findById(intentId);
    
    if (!intent) {
      return {
        status: 'not_found',
        error: 'Intent not found'
      };
    }

    return {
      status: intent.status,
      result: intent.parsed_intent
    };
  } catch (error) {
    console.error('Status check error:', error);
    
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
