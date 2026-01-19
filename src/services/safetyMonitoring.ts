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
        violationType: 'high_revert_rate',
        reason: `Transaction failure rate (${failureRate.toFixed(2)}%) exceeds threshold (${this.thresholds.maxFailureRate}%)`,
        severity: failureRate >= this.thresholds.maxFailureRate * 2 ? 'critical' : 'warning',
        metadata: {
          failure_rate: failureRate,
          threshold: this.thresholds.maxFailureRate,
          execution_reliability: metrics.executionReliability,
        },
      });
    }

    // Check simulation success rate
    const simulationSuccessRate = 100 - metrics.revertRate;
    if (simulationSuccessRate < this.thresholds.minSimulationSuccessRate) {
      this.triggerGuardrail({
        violationType: 'high_revert_rate',
        reason: `Simulation success rate (${simulationSuccessRate.toFixed(2)}%) below threshold (${this.thresholds.minSimulationSuccessRate}%)`,
        severity: 'warning',
        metadata: {
          simulation_success_rate: simulationSuccessRate,
          threshold: this.thresholds.minSimulationSuccessRate,
          revert_rate: metrics.revertRate,
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
    this.violations = [];
  }
}

export const safetyMonitoringService = new SafetyMonitoringService();
