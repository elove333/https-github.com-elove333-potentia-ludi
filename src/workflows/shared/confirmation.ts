/**
 * Shared Confirmation Utilities
 * 
 * User confirmation handling for sensitive operations
 */

/**
 * Confirmation requirement level
 */
export enum ConfirmationLevel {
  NONE = 'none',           // No confirmation needed
  SIMPLE = 'simple',       // Simple yes/no confirmation
  TYPED = 'typed',         // User must type "CONFIRM"
  DOUBLE = 'double',       // Two-step confirmation
  MFA = 'mfa',            // Multi-factor authentication required
}

/**
 * Confirmation request
 */
export interface ConfirmationRequest {
  /** Unique ID for this confirmation */
  id: string;
  
  /** Type of operation requiring confirmation */
  operation: 'transfer' | 'swap' | 'bridge' | 'approval';
  
  /** Confirmation level required */
  level: ConfirmationLevel;
  
  /** Human-readable summary of the operation */
  summary: string;
  
  /** Detailed information about the operation */
  details: {
    from?: string;
    to?: string;
    amount?: string;
    token?: string;
    chainId?: number;
    estimatedGas?: string;
    estimatedCost?: string;
    warnings?: string[];
  };
  
  /** Timestamp when confirmation was requested */
  timestamp: number;
  
  /** Expiration time (unix timestamp) */
  expiresAt: number;
}

/**
 * Confirmation response
 */
export interface ConfirmationResponse {
  /** Confirmation request ID */
  requestId: string;
  
  /** Whether user confirmed */
  confirmed: boolean;
  
  /** Optional: typed confirmation text (for TYPED level) */
  typedText?: string;
  
  /** Optional: MFA code (for MFA level) */
  mfaCode?: string;
  
  /** Timestamp of response */
  timestamp: number;
}

/**
 * Determine confirmation level required for an operation
 * 
 * @param operation - Type of operation
 * @param valueUsd - USD value of operation
 * @param isFirstTime - Whether this is first time to this address/operation
 * @returns Required confirmation level
 */
export function getRequiredConfirmationLevel(
  operation: 'transfer' | 'swap' | 'bridge' | 'approval',
  valueUsd: number,
  isFirstTime: boolean = false
): ConfirmationLevel {
  // First time operations require higher confirmation
  if (isFirstTime) {
    if (valueUsd > 1000) return ConfirmationLevel.MFA;
    if (valueUsd > 100) return ConfirmationLevel.DOUBLE;
    return ConfirmationLevel.TYPED;
  }
  
  // Value-based confirmation levels
  if (valueUsd > 5000) return ConfirmationLevel.MFA;
  if (valueUsd > 1000) return ConfirmationLevel.DOUBLE;
  if (valueUsd > 50) return ConfirmationLevel.TYPED;
  if (valueUsd > 10) return ConfirmationLevel.SIMPLE;
  
  return ConfirmationLevel.SIMPLE;
}

/**
 * Create a confirmation request
 * 
 * @param params - Confirmation parameters
 * @returns Confirmation request object
 */
export function createConfirmationRequest(params: {
  operation: 'transfer' | 'swap' | 'bridge' | 'approval';
  summary: string;
  details: ConfirmationRequest['details'];
  level?: ConfirmationLevel;
  expiresIn?: number; // milliseconds
}): ConfirmationRequest {
  const { operation, summary, details, level, expiresIn = 300000 } = params;
  
  const now = Date.now();
  
  return {
    id: `confirm_${operation}_${now}_${Math.random().toString(36).substr(2, 9)}`,
    operation,
    level: level || ConfirmationLevel.SIMPLE,
    summary,
    details,
    timestamp: now,
    expiresAt: now + expiresIn,
  };
}

/**
 * Validate a confirmation response
 * 
 * @param request - Original confirmation request
 * @param response - User's confirmation response
 * @throws Error if confirmation is invalid
 */
export function validateConfirmation(
  request: ConfirmationRequest,
  response: ConfirmationResponse
): void {
  // Check request ID matches
  if (request.id !== response.requestId) {
    throw new Error('Confirmation request ID mismatch');
  }
  
  // Check not expired
  if (Date.now() > request.expiresAt) {
    throw new Error('Confirmation request expired');
  }
  
  // Check user confirmed
  if (!response.confirmed) {
    throw new Error('User declined confirmation');
  }
  
  // Validate based on confirmation level
  switch (request.level) {
    case ConfirmationLevel.TYPED:
      if (response.typedText !== 'CONFIRM') {
        throw new Error('Invalid confirmation text. Please type "CONFIRM" exactly.');
      }
      break;
      
    case ConfirmationLevel.DOUBLE:
      // In real implementation, this would check if user confirmed twice
      if (!response.typedText || response.typedText !== 'CONFIRM') {
        throw new Error('Double confirmation required');
      }
      break;
      
    case ConfirmationLevel.MFA:
      if (!response.mfaCode || response.mfaCode.length !== 6) {
        throw new Error('Valid 6-digit MFA code required');
      }
      // In real implementation, verify MFA code
      break;
      
    case ConfirmationLevel.SIMPLE:
    case ConfirmationLevel.NONE:
      // No additional validation needed
      break;
  }
}

/**
 * Format confirmation details for display
 * 
 * @param request - Confirmation request
 * @returns Formatted text for user display
 */
export function formatConfirmationForDisplay(request: ConfirmationRequest): string {
  const lines: string[] = [
    `Operation: ${request.operation.toUpperCase()}`,
    `Summary: ${request.summary}`,
    '',
  ];
  
  if (request.details.from) {
    lines.push(`From: ${request.details.from}`);
  }
  
  if (request.details.to) {
    lines.push(`To: ${request.details.to}`);
  }
  
  if (request.details.amount) {
    lines.push(`Amount: ${request.details.amount} ${request.details.token || ''}`);
  }
  
  if (request.details.chainId) {
    lines.push(`Chain: ${getChainName(request.details.chainId)}`);
  }
  
  if (request.details.estimatedGas) {
    lines.push(`Estimated Gas: ${request.details.estimatedGas}`);
  }
  
  if (request.details.estimatedCost) {
    lines.push(`Estimated Cost: ${request.details.estimatedCost}`);
  }
  
  if (request.details.warnings && request.details.warnings.length > 0) {
    lines.push('');
    lines.push('⚠️  WARNINGS:');
    request.details.warnings.forEach(warning => {
      lines.push(`  - ${warning}`);
    });
  }
  
  lines.push('');
  lines.push(getConfirmationInstructions(request.level));
  
  return lines.join('\n');
}

/**
 * Get confirmation instructions based on level
 */
function getConfirmationInstructions(level: ConfirmationLevel): string {
  switch (level) {
    case ConfirmationLevel.NONE:
      return 'No confirmation required.';
    case ConfirmationLevel.SIMPLE:
      return 'Please confirm to proceed.';
    case ConfirmationLevel.TYPED:
      return 'Please type "CONFIRM" to proceed.';
    case ConfirmationLevel.DOUBLE:
      return 'Please confirm twice to proceed with this high-value transaction.';
    case ConfirmationLevel.MFA:
      return 'Please enter your 6-digit MFA code to proceed.';
  }
}

/**
 * Get chain name from chain ID
 */
function getChainName(chainId: number): string {
  const names: Record<number, string> = {
    1: 'Ethereum',
    137: 'Polygon',
    56: 'BNB Chain',
    42161: 'Arbitrum',
    10: 'Optimism',
    8453: 'Base',
  };
  return names[chainId] || `Chain ${chainId}`;
}

/**
 * Check if confirmation is expired
 * 
 * @param request - Confirmation request
 * @returns Whether the confirmation has expired
 */
export function isConfirmationExpired(request: ConfirmationRequest): boolean {
  return Date.now() > request.expiresAt;
}

/**
 * Calculate time remaining for confirmation
 * 
 * @param request - Confirmation request
 * @returns Seconds remaining, or 0 if expired
 */
export function getTimeRemainingSeconds(request: ConfirmationRequest): number {
  const remaining = Math.max(0, request.expiresAt - Date.now());
  return Math.floor(remaining / 1000);
}
