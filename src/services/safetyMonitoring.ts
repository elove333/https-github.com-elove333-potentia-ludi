import { SafetyThresholds, GuardrailViolation } from '../types';
import { telemetryService } from './telemetry';
import { successMetricsService } from './successMetrics';

/**
 * Safety Monitoring Service
 * 
 * Monitors system health and safety thresholds.
 * Triggers guardrails when suspicious patterns or unsafe conditions are detected.
 */
class SafetyMonitoringService {
  private thresholds: SafetyThresholds = {
    maxRevertRate: 5.0, // 5%
    maxFailureRate: 10.0, // 10%
    minSimulationSuccessRate: 90.0, // 90%
  };

  private monitoringInterval: number = 60000; // 1 minute
  private intervalId?: NodeJS.Timeout;
  private violations: GuardrailViolation[] = [];

  constructor() {
    this.startMonitoring();
  }

  /**
   * Start periodic safety monitoring
   */
  private startMonitoring(): void {
    this.intervalId = setInterval(() => {
      this.checkSafetyThresholds();
    }, this.monitoringInterval);

    console.log('[Safety] Monitoring started with thresholds:', this.thresholds);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  /**
   * Update safety thresholds
   */
  setThresholds(thresholds: Partial<SafetyThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
    console.log('[Safety] Thresholds updated:', this.thresholds);
  }

  /**
   * Check all safety thresholds
   */
  private checkSafetyThresholds(): void {
    const metrics = successMetricsService.calculateSuccessMetrics();

    // Check revert rate
    if (metrics.revertRate >= this.thresholds.maxRevertRate) {
      this.triggerGuardrail({
        violationType: 'high_revert_rate',
        reason: `Revert rate (${metrics.revertRate.toFixed(2)}%) exceeds threshold (${this.thresholds.maxRevertRate}%)`,
        severity: metrics.revertRate >= this.thresholds.maxRevertRate * 2 ? 'critical' : 'warning',
        metadata: {
          current_rate: metrics.revertRate,
          threshold: this.thresholds.maxRevertRate,
          execution_reliability: metrics.executionReliability,
        },
      });
    }

    // Check execution reliability (inverse of failure rate)
    const failureRate = 100 - metrics.executionReliability;
    if (failureRate >= this.thresholds.maxFailureRate) {
      this.triggerGuardrail({
        violationType: 'high_failure_rate',
        reason: `Transaction failure rate (${failureRate.toFixed(2)}%) exceeds threshold (${this.thresholds.maxFailureRate}%)`,
        severity: failureRate >= this.thresholds.maxFailureRate * 2 ? 'critical' : 'warning',
        metadata: {
          failure_rate: failureRate,
          threshold: this.thresholds.maxFailureRate,
          execution_reliability: metrics.executionReliability,
          violation_subtype: 'high_failure_rate',
        },
      });
    }

    // Check simulation success rate
    const simulationSuccessRate = 100 - metrics.revertRate;
    if (simulationSuccessRate < this.thresholds.minSimulationSuccessRate) {
      this.triggerGuardrail({
        violationType: 'low_simulation_success_rate',
        reason: `Simulation success rate (${simulationSuccessRate.toFixed(2)}%) below threshold (${this.thresholds.minSimulationSuccessRate}%)`,
        severity: 'warning',
        metadata: {
          simulation_success_rate: simulationSuccessRate,
          threshold: this.thresholds.minSimulationSuccessRate,
          revert_rate: metrics.revertRate,
          violation_subtype: 'low_simulation_success_rate',
        },
      });
    }
  }

  /**
   * Trigger a guardrail violation
   */
  private triggerGuardrail(violation: GuardrailViolation): void {
    this.violations.push(violation);

    // Emit telemetry event
    telemetryService.emitGuardrailViolation(
      violation.violationType,
      violation.reason,
      violation.severity,
      violation.metadata
    );

    // Log violation
    const logLevel = violation.severity === 'critical' ? 'error' : 'warn';
    console[logLevel]('[Safety] Guardrail violation:', violation);

    // In production, this might trigger alerts, notifications, or automatic safety measures
    if (violation.severity === 'critical') {
      this.handleCriticalViolation(violation);
    }
  }

  /**
   * Handle critical violations with automatic safety measures
   */
  private handleCriticalViolation(violation: GuardrailViolation): void {
    console.error('[Safety] CRITICAL VIOLATION - Automatic safety measures may be triggered:', violation);
    
    // In production, this might:
    // - Temporarily pause certain operations
    // - Send alerts to operations team
    // - Increase monitoring frequency
    // - Trigger automated rollback procedures
  }

  /**
   * Check if a transaction should be approved based on safety rules
   */
  checkTransactionSafety(
    to: string,
    value: string,
    data?: string,
    chainId?: number
  ): { safe: boolean; violations: GuardrailViolation[] } {
    const violations: GuardrailViolation[] = [];

    // Check for suspicious approval patterns
    if (data && this.isUnlimitedApproval(data)) {
      violations.push({
        violationType: 'suspicious_approval',
        reason: 'Unlimited token approval detected',
        severity: 'warning',
        metadata: {
          to,
          data,
          chainId,
        },
      });
    }

    // Check for high value transactions
    const valueEth = parseFloat(value) / 1e18;
    if (valueEth > 10) {
      violations.push({
        violationType: 'excessive_value',
        reason: `High value transaction (${valueEth.toFixed(2)} ETH)`,
        severity: valueEth > 100 ? 'critical' : 'warning',
        metadata: {
          value_eth: valueEth,
          to,
          chainId,
        },
      });
    }

    // Check contract safety (simplified check)
    if (this.isKnownUnsafeContract(to)) {
      violations.push({
        violationType: 'unsafe_contract',
        reason: 'Interaction with potentially unsafe contract',
        severity: 'critical',
        metadata: {
          contract: to,
          chainId,
        },
      });
    }

    // Emit any violations found
    violations.forEach(violation => {
      telemetryService.emitGuardrailViolation(
        violation.violationType,
        violation.reason,
        violation.severity,
        violation.metadata
      );
    });

    return {
      safe: violations.filter(v => v.severity === 'critical').length === 0,
      violations,
    };
  }

  /**
   * Check if data contains unlimited approval
   */
  private isUnlimitedApproval(data: string): boolean {
    // Check for common unlimited approval patterns
    // ERC20 approve with max uint256
    const maxUint256 = 'f'.repeat(64);
    return data.toLowerCase().includes(maxUint256);
  }

  /**
   * Check if contract is known to be unsafe
   */
  private isKnownUnsafeContract(address: string): boolean {
    // In production, this would check against a database of known unsafe contracts
    // For now, just a placeholder
    const unsafeContracts: string[] = [
      // Add known unsafe contract addresses here
    ];

    return unsafeContracts.includes(address.toLowerCase());
  }

  /**
   * Get recent violations
   */
  getRecentViolations(limit: number = 10): GuardrailViolation[] {
    return this.violations.slice(-limit);
  }

  /**
   * Get violation statistics
   */
  getViolationStats(): {
    total: number;
    bySeverity: { warning: number; critical: number };
    byType: Record<string, number>;
  } {
    const bySeverity = {
      warning: this.violations.filter(v => v.severity === 'warning').length,
      critical: this.violations.filter(v => v.severity === 'critical').length,
    };

    const byType: Record<string, number> = {};
    this.violations.forEach(v => {
      byType[v.violationType] = (byType[v.violationType] || 0) + 1;
    });

    return {
      total: this.violations.length,
      bySeverity,
      byType,
    };
  }

  /**
   * Clear violations history (for testing)
   */
  clearViolations(): void {
/**
 * Safety Monitoring Service
 * 
 * Monitors and tracks safety violations/guardrail triggers
 * with bounded memory management to prevent memory leaks.
 */

const RANDOM_ID_LENGTH = 9;

export interface SafetyViolation {
  id: string;
  timestamp: Date;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  metadata?: Record<string, any>;
}

export interface SafetyMonitoringConfig {
  maxViolations?: number; // Maximum violations to keep in memory (default: 1000)
  violationTTL?: number; // Time-to-live for violations in milliseconds (default: 30 minutes)
  enableAutoCleanup?: boolean; // Enable automatic time-based cleanup (default: true)
  cleanupInterval?: number; // Cleanup interval in milliseconds (default: 5 minutes)
}

class SafetyMonitoringService {
  private violations: SafetyViolation[] = [];
  private maxViolations: number;
  private violationTTL: number;
  private enableAutoCleanup: boolean;
  private cleanupInterval: number;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private violationCounter: number = 0;

  constructor(config: SafetyMonitoringConfig = {}) {
    this.maxViolations = config.maxViolations ?? 1000;
    this.violationTTL = config.violationTTL ?? 30 * 60 * 1000; // 30 minutes default
    this.enableAutoCleanup = config.enableAutoCleanup ?? true;
    this.cleanupInterval = config.cleanupInterval ?? 5 * 60 * 1000; // 5 minutes default

    if (this.enableAutoCleanup) {
      this.startAutoCleanup();
    }
  }

  /**
   * Trigger a guardrail violation
   * Automatically manages memory by enforcing size limits
   */
  triggerGuardrail(
    type: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    description: string,
    metadata?: Record<string, any>
  ): SafetyViolation {
    this.violationCounter++;
    const violation: SafetyViolation = {
      id: `violation-${Date.now()}-${this.violationCounter}-${Math.random().toString(36).substring(2, 2 + RANDOM_ID_LENGTH)}`,
      timestamp: new Date(),
      type,
      severity,
      description,
      metadata,
    };

    this.violations.push(violation);

    // Enforce maximum size limit - remove oldest violations if exceeded
    if (this.violations.length > this.maxViolations) {
      this.violations.shift(); // Remove the oldest violation (FIFO)
    }

    return violation;
  }

  /**
   * Get all violations
   */
  getViolations(): SafetyViolation[] {
    return [...this.violations];
  }

  /**
   * Get violations by type
   */
  getViolationsByType(type: string): SafetyViolation[] {
    return this.violations.filter((v) => v.type === type);
  }

  /**
   * Get violations by severity
   */
  getViolationsBySeverity(severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): SafetyViolation[] {
    return this.violations.filter((v) => v.severity === severity);
  }

  /**
   * Get recent violations within a time window
   */
  getRecentViolations(withinMs: number): SafetyViolation[] {
    const cutoff = Date.now() - withinMs;
    return this.violations.filter((v) => v.timestamp.getTime() >= cutoff);
  }

  /**
   * Get count of violations
   */
  getViolationCount(): number {
    return this.violations.length;
  }

  /**
   * Clear all violations
   */
  clearViolations(): void {
    this.violations = [];
  }

  /**
   * Remove violations older than the configured TTL
   */
  cleanupOldViolations(): number {
    const cutoff = Date.now() - this.violationTTL;
    const initialCount = this.violations.length;
    
    this.violations = this.violations.filter((v) => v.timestamp.getTime() >= cutoff);
    
    const removed = initialCount - this.violations.length;
    return removed;
  }

  /**
   * Start automatic cleanup of old violations
   */
  private startAutoCleanup(): void {
    if (this.cleanupTimer) {
      return; // Already running
    }

    this.cleanupTimer = setInterval(() => {
      const removed = this.cleanupOldViolations();
      // Silent cleanup - only log in debug mode or if using a proper logging framework
      // In production, consider emitting events or metrics instead of logging
      if (removed > 0 && process.env.NODE_ENV === 'development') {
        console.log(`SafetyMonitoringService: Cleaned up ${removed} old violations`);
      }
    }, this.cleanupInterval);
  }

  /**
   * Stop automatic cleanup
   */
  stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Get service configuration
   */
  getConfig(): {
    maxViolations: number;
    violationTTL: number;
    enableAutoCleanup: boolean;
    cleanupInterval: number;
    currentViolationCount: number;
  } {
    return {
      maxViolations: this.maxViolations,
      violationTTL: this.violationTTL,
      enableAutoCleanup: this.enableAutoCleanup,
      cleanupInterval: this.cleanupInterval,
      currentViolationCount: this.violations.length,
    };
  }

  /**
   * Clean up resources (call when shutting down)
   */
  cleanup(): void {
    this.stopAutoCleanup();
    this.violations = [];
  }
}

export const safetyMonitoringService = new SafetyMonitoringService();
// Export singleton instance with default configuration
export const safetyMonitoringService = new SafetyMonitoringService();

// Export class for custom configurations or testing
export { SafetyMonitoringService };
