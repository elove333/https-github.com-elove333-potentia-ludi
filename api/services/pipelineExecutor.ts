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
