/**
 * Safety Monitoring Service Tests
 * 
 * Tests for bounded memory management and violation tracking
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SafetyMonitoringService, SafetyViolation } from '../src/services/safetyMonitoring';

describe('SafetyMonitoringService', () => {
  let service: SafetyMonitoringService;

  beforeEach(() => {
    // Create a fresh service instance for each test
    service = new SafetyMonitoringService({
      maxViolations: 10, // Use smaller limit for testing
      violationTTL: 1000, // 1 second for faster testing
      enableAutoCleanup: false, // Disable auto cleanup for most tests
    });
  });

  afterEach(() => {
    // Clean up resources
    service.cleanup();
  });

  describe('triggerGuardrail', () => {
    it('should add a violation', () => {
      const violation = service.triggerGuardrail(
        'test_violation',
        'MEDIUM',
        'Test violation description'
      );

      expect(violation).toBeDefined();
      expect(violation.id).toBeDefined();
      expect(violation.timestamp).toBeInstanceOf(Date);
      expect(violation.type).toBe('test_violation');
      expect(violation.severity).toBe('MEDIUM');
      expect(violation.description).toBe('Test violation description');
      expect(service.getViolationCount()).toBe(1);
    });

    it('should add violation with metadata', () => {
      const metadata = { userId: '123', action: 'swap' };
      const violation = service.triggerGuardrail(
        'guardrail_triggered',
        'HIGH',
        'High risk action detected',
        metadata
      );

      expect(violation.metadata).toEqual(metadata);
    });

    it('should generate unique IDs for each violation', () => {
      const violation1 = service.triggerGuardrail('test', 'LOW', 'Test 1');
      const violation2 = service.triggerGuardrail('test', 'LOW', 'Test 2');

      expect(violation1.id).not.toBe(violation2.id);
    });
  });

  describe('Memory Management - Max Size Limit', () => {
    it('should enforce maximum violation limit', () => {
      // Add more violations than the limit (10)
      for (let i = 0; i < 15; i++) {
        service.triggerGuardrail('test', 'LOW', `Violation ${i}`);
      }

      expect(service.getViolationCount()).toBe(10);
    });

    it('should remove oldest violations first (FIFO)', () => {
      // Add violations with identifiable descriptions
      for (let i = 0; i < 15; i++) {
        service.triggerGuardrail('test', 'LOW', `Violation ${i}`);
      }

      const violations = service.getViolations();
      
      // Should have kept violations 5-14 (the last 10)
      expect(violations[0].description).toBe('Violation 5');
      expect(violations[9].description).toBe('Violation 14');
    });

    it('should continuously maintain limit as new violations are added', () => {
      // Add initial batch
      for (let i = 0; i < 10; i++) {
        service.triggerGuardrail('test', 'LOW', `Violation ${i}`);
      }
      expect(service.getViolationCount()).toBe(10);

      // Add more one by one
      service.triggerGuardrail('test', 'LOW', 'Violation 10');
      expect(service.getViolationCount()).toBe(10);
      
      service.triggerGuardrail('test', 'LOW', 'Violation 11');
      expect(service.getViolationCount()).toBe(10);

      const violations = service.getViolations();
      expect(violations[0].description).toBe('Violation 2');
      expect(violations[9].description).toBe('Violation 11');
    });
  });

  describe('getViolations', () => {
    it('should return all violations', () => {
      service.triggerGuardrail('type1', 'LOW', 'Test 1');
      service.triggerGuardrail('type2', 'HIGH', 'Test 2');

      const violations = service.getViolations();
      expect(violations).toHaveLength(2);
    });

    it('should return a copy of violations array', () => {
      service.triggerGuardrail('test', 'LOW', 'Test');
      
      const violations = service.getViolations();
      violations.push({
        id: 'fake',
        timestamp: new Date(),
        type: 'fake',
        severity: 'LOW',
        description: 'Fake',
      });

      expect(service.getViolationCount()).toBe(1); // Original not affected
    });
  });

  describe('getViolationsByType', () => {
    it('should filter violations by type', () => {
      service.triggerGuardrail('slippage_exceeded', 'MEDIUM', 'Test 1');
      service.triggerGuardrail('amount_too_high', 'HIGH', 'Test 2');
      service.triggerGuardrail('slippage_exceeded', 'LOW', 'Test 3');

      const slippageViolations = service.getViolationsByType('slippage_exceeded');
      expect(slippageViolations).toHaveLength(2);
      expect(slippageViolations.every(v => v.type === 'slippage_exceeded')).toBe(true);
    });

    it('should return empty array for non-existent type', () => {
      service.triggerGuardrail('test', 'LOW', 'Test');
      
      const violations = service.getViolationsByType('non_existent');
      expect(violations).toEqual([]);
    });
  });

  describe('getViolationsBySeverity', () => {
    it('should filter violations by severity', () => {
      service.triggerGuardrail('test1', 'LOW', 'Test 1');
      service.triggerGuardrail('test2', 'HIGH', 'Test 2');
      service.triggerGuardrail('test3', 'HIGH', 'Test 3');
      service.triggerGuardrail('test4', 'CRITICAL', 'Test 4');

      const highViolations = service.getViolationsBySeverity('HIGH');
      expect(highViolations).toHaveLength(2);
      expect(highViolations.every(v => v.severity === 'HIGH')).toBe(true);
    });
  });

  describe('getRecentViolations', () => {
    it('should return violations within time window', async () => {
      service.triggerGuardrail('test', 'LOW', 'Recent');
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      service.triggerGuardrail('test', 'LOW', 'Very recent');

      const recent = service.getRecentViolations(50); // Last 50ms
      expect(recent).toHaveLength(1);
      expect(recent[0].description).toBe('Very recent');
    });

    it('should return all violations if all are recent', () => {
      service.triggerGuardrail('test', 'LOW', 'Test 1');
      service.triggerGuardrail('test', 'LOW', 'Test 2');

      const recent = service.getRecentViolations(10000); // Last 10 seconds
      expect(recent).toHaveLength(2);
    });
  });

  describe('Time-based Cleanup', () => {
    it('should remove violations older than TTL', async () => {
      // Create service with very short TTL
      const shortTTLService = new SafetyMonitoringService({
        maxViolations: 100,
        violationTTL: 100, // 100ms TTL
        enableAutoCleanup: false,
      });

      shortTTLService.triggerGuardrail('test', 'LOW', 'Old violation');
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      shortTTLService.triggerGuardrail('test', 'LOW', 'New violation');

      expect(shortTTLService.getViolationCount()).toBe(2);

      const removed = shortTTLService.cleanupOldViolations();
      expect(removed).toBe(1);
      expect(shortTTLService.getViolationCount()).toBe(1);

      const violations = shortTTLService.getViolations();
      expect(violations[0].description).toBe('New violation');

      shortTTLService.cleanup();
    });

    it('should not remove violations within TTL', () => {
      service.triggerGuardrail('test', 'LOW', 'Recent violation');

      const removed = service.cleanupOldViolations();
      expect(removed).toBe(0);
      expect(service.getViolationCount()).toBe(1);
    });

    it('should automatically cleanup when enabled', async () => {
      const autoCleanupService = new SafetyMonitoringService({
        maxViolations: 100,
        violationTTL: 50, // 50ms TTL
        enableAutoCleanup: true,
        cleanupInterval: 100, // Check every 100ms
      });

      autoCleanupService.triggerGuardrail('test', 'LOW', 'Old violation');
      
      // Wait for TTL to expire and cleanup to run
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Violation should be cleaned up automatically
      expect(autoCleanupService.getViolationCount()).toBe(0);

      autoCleanupService.cleanup();
    });
  });

  describe('clearViolations', () => {
    it('should clear all violations', () => {
      service.triggerGuardrail('test1', 'LOW', 'Test 1');
      service.triggerGuardrail('test2', 'HIGH', 'Test 2');
      expect(service.getViolationCount()).toBe(2);

      service.clearViolations();
      expect(service.getViolationCount()).toBe(0);
      expect(service.getViolations()).toEqual([]);
    });
  });

  describe('getConfig', () => {
    it('should return service configuration', () => {
      const config = service.getConfig();

      expect(config.maxViolations).toBe(10);
      expect(config.violationTTL).toBe(1000);
      expect(config.enableAutoCleanup).toBe(false);
      expect(config.currentViolationCount).toBe(0);
    });

    it('should reflect current violation count', () => {
      service.triggerGuardrail('test', 'LOW', 'Test');
      
      const config = service.getConfig();
      expect(config.currentViolationCount).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle maxViolations of 1', () => {
      const smallService = new SafetyMonitoringService({
        maxViolations: 1,
        enableAutoCleanup: false,
      });

      smallService.triggerGuardrail('test1', 'LOW', 'First');
      expect(smallService.getViolationCount()).toBe(1);

      smallService.triggerGuardrail('test2', 'LOW', 'Second');
      expect(smallService.getViolationCount()).toBe(1);

      const violations = smallService.getViolations();
      expect(violations[0].description).toBe('Second');

      smallService.cleanup();
    });

    it('should handle adding many violations at once', () => {
      const count = 1000;
      for (let i = 0; i < count; i++) {
        service.triggerGuardrail('test', 'LOW', `Violation ${i}`);
      }

      expect(service.getViolationCount()).toBe(10); // maxViolations limit
    });

    it('should handle rapid sequential additions', () => {
      const violations: SafetyViolation[] = [];
      for (let i = 0; i < 5; i++) {
        violations.push(service.triggerGuardrail('test', 'LOW', `Test ${i}`));
      }

      expect(violations).toHaveLength(5);
      expect(violations.every(v => v.id)).toBe(true);
      expect(new Set(violations.map(v => v.id)).size).toBe(5); // All unique
    });
  });

  describe('cleanup', () => {
    it('should stop auto cleanup when cleanup is called', () => {
      const autoCleanupService = new SafetyMonitoringService({
        enableAutoCleanup: true,
        cleanupInterval: 100,
      });

      autoCleanupService.cleanup();

      // After cleanup, timer should be stopped
      const config = autoCleanupService.getConfig();
      expect(config.currentViolationCount).toBe(0);
    });

    it('should clear violations on cleanup', () => {
      service.triggerGuardrail('test', 'LOW', 'Test');
      expect(service.getViolationCount()).toBe(1);

      service.cleanup();
      expect(service.getViolationCount()).toBe(0);
    });
  });

  describe('Integration - Real-world Scenarios', () => {
    it('should handle typical monitoring scenario', () => {
      // Simulate various guardrail triggers
      service.triggerGuardrail('slippage_exceeded', 'MEDIUM', 'Slippage 3%');
      service.triggerGuardrail('amount_threshold', 'HIGH', 'Large transaction');
      service.triggerGuardrail('rate_limit', 'LOW', 'API rate limit approached');
      service.triggerGuardrail('slippage_exceeded', 'HIGH', 'Slippage 5%');

      expect(service.getViolationCount()).toBe(4);

      // Get critical violations
      const critical = service.getViolationsBySeverity('HIGH');
      expect(critical).toHaveLength(2);

      // Get slippage-related violations
      const slippage = service.getViolationsByType('slippage_exceeded');
      expect(slippage).toHaveLength(2);
    });

    it('should maintain bounded memory over long-running operation', () => {
      // Simulate long-running service with continuous violations
      for (let i = 0; i < 100; i++) {
        service.triggerGuardrail('continuous', 'LOW', `Violation ${i}`);
      }

      // Should never exceed max limit
      expect(service.getViolationCount()).toBe(10);
      
      // Verify oldest are removed
      const violations = service.getViolations();
      expect(violations[0].description).toBe('Violation 90');
      expect(violations[9].description).toBe('Violation 99');
    });
  });
});
