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

// Export singleton instance with default configuration
export const safetyMonitoringService = new SafetyMonitoringService();

// Export class for custom configurations or testing
export { SafetyMonitoringService };
