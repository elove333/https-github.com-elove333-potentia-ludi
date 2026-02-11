/**
 * Workflow Index - Central export for all Web3 intent workflows
 * 
 * This module provides a unified interface for accessing all workflow implementations
 * and their metadata. Used by the intent parser and orchestration layer.
 */

export * from './balances';
export * from './swap';
export * from './bridge';

import { 
  balancesWorkflowMetadata, 
  executeBalancesWorkflow,
  type BalancesWorkflowParams,
} from './balances';
import { 
  swapWorkflowMetadata, 
  executeSwapWorkflow,
  type SwapParams,
} from './swap';
import { 
  bridgeWorkflowMetadata, 
  executeBridgeWorkflow,
  type BridgeParams,
} from './bridge';

/**
 * Registry of all available workflows
 * Maps intent action names to workflow implementations
 */
export const WORKFLOW_REGISTRY = {
  'balances.get': {
    metadata: balancesWorkflowMetadata,
    execute: executeBalancesWorkflow,
  },
  'trade.swap': {
    metadata: swapWorkflowMetadata,
    execute: executeSwapWorkflow,
  },
  'bridge.transfer': {
    metadata: bridgeWorkflowMetadata,
    execute: executeBridgeWorkflow,
  },
  // TODO: Add more workflows as they are implemented
  // 'send.transfer': { ... },
  // 'nft.transfer': { ... },
  // 'portfolio.analyze': { ... },
} as const;

/**
 * Get workflow by intent action name
 * 
 * @param action - Intent action name (e.g., 'balances.get')
 * @returns Workflow implementation or undefined if not found
 */
export function getWorkflow(action: string) {
  return WORKFLOW_REGISTRY[action as keyof typeof WORKFLOW_REGISTRY];
}

/**
 * Get all workflow metadata for documentation and discovery
 * 
 * @returns Array of workflow metadata
 */
export function getAllWorkflowMetadata() {
  return Object.values(WORKFLOW_REGISTRY).map(w => w.metadata);
}

/**
 * Check if a workflow exists for the given action
 * 
 * @param action - Intent action name
 * @returns True if workflow exists
 */
export function hasWorkflow(action: string): boolean {
  return action in WORKFLOW_REGISTRY;
}

/**
 * Workflow execution context
 * Passed to all workflows for consistent execution environment
 */
export interface WorkflowContext {
  userId: string;
  walletAddress: string;
  conversationId?: string;
  intentId?: string;
  requestId: string;
  timestamp: Date;
}

/**
 * Generic workflow result
 * All workflows should return results conforming to this interface
 */
export interface WorkflowResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  warnings?: string[];
  metadata?: {
    executionTime: number;
    cacheMiss?: boolean;
    fallbackUsed?: boolean;
  };
}

/**
 * Execute a workflow by action name
 * Provides unified error handling and logging
 * 
 * @param action - Intent action name
 * @param params - Workflow-specific parameters
 * @param context - Execution context
 * @returns Workflow result
 * 
 * TODO: Add execution telemetry
 * TODO: Implement retry logic for transient failures
 * TODO: Add circuit breaker for failing workflows
 */
export async function executeWorkflow<T = any>(
  action: string,
  params: any,
  context: WorkflowContext
): Promise<WorkflowResult<T>> {
  const startTime = Date.now();
  
  try {
    const workflow = getWorkflow(action);
    
    if (!workflow) {
      return {
        success: false,
        error: {
          code: 'WORKFLOW_NOT_FOUND',
          message: `No workflow found for action: ${action}`,
        },
      };
    }
    
    // Execute workflow
    // Note: Type casting needed as registry has generic types
    const result = await (workflow.execute as any)(params, context);
    
    return {
      success: true,
      data: result,
      metadata: {
        executionTime: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error(`Workflow execution failed for ${action}:`, error);
    
    return {
      success: false,
      error: {
        code: 'WORKFLOW_EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error,
      },
      metadata: {
        executionTime: Date.now() - startTime,
      },
    };
  }
}

/**
 * Validate workflow parameters
 * Each workflow should implement its own validation
 * 
 * @param action - Intent action name
 * @param params - Parameters to validate
 * @returns Validation result
 */
export async function validateWorkflowParams(
  action: string,
  params: any
): Promise<{
  valid: boolean;
  errors: string[];
}> {
  // TODO: Implement schema-based validation
  // For now, just check if workflow exists
  
  if (!hasWorkflow(action)) {
    return {
      valid: false,
      errors: [`Unknown workflow action: ${action}`],
    };
  }
  
  // TODO: Use Zod or similar for runtime validation
  // const schema = WORKFLOW_SCHEMAS[action];
  // const result = schema.safeParse(params);
  // return { valid: result.success, errors: result.errors };
  
  return { valid: true, errors: [] };
}

// Type exports for consumers
export type WorkflowAction = keyof typeof WORKFLOW_REGISTRY;
export type WorkflowParams<T extends WorkflowAction> = 
  T extends 'balances.get' ? BalancesWorkflowParams :
  T extends 'trade.swap' ? SwapParams :
  T extends 'bridge.transfer' ? BridgeParams :
  never;
