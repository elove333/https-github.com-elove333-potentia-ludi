/**
 * Example Usage of SafetyMonitoringService
 * 
 * This file demonstrates how to use the SafetyMonitoringService
 * to track safety violations and guardrail triggers.
 */

import { 
  SafetyMonitoringService, 
  safetyMonitoringService 
} from '../src/services/safetyMonitoring';

/**
 * Example 1: Using the default singleton instance
 */
function exampleBasicUsage() {
  console.log('Example 1: Basic Usage\n');

  // Trigger various violations
  safetyMonitoringService.triggerGuardrail(
    'slippage_exceeded',
    'MEDIUM',
    'Slippage tolerance exceeded 3%',
    { slippage: 0.03, maxAllowed: 0.02 }
  );

  safetyMonitoringService.triggerGuardrail(
    'amount_threshold',
    'HIGH',
    'Transaction amount exceeds threshold',
    { amount: 15000, threshold: 10000 }
  );

  safetyMonitoringService.triggerGuardrail(
    'rate_limit',
    'LOW',
    'API rate limit approaching',
    { current: 450, limit: 500 }
  );

  // Get all violations
  const allViolations = safetyMonitoringService.getViolations();
  console.log(`Total violations: ${allViolations.length}`);

  // Get high severity violations
  const highSeverity = safetyMonitoringService.getViolationsBySeverity('HIGH');
  console.log(`High severity violations: ${highSeverity.length}`);

  // Get slippage-related violations
  const slippageViolations = safetyMonitoringService.getViolationsByType('slippage_exceeded');
  console.log(`Slippage violations: ${slippageViolations.length}\n`);
}

/**
 * Example 2: Using custom configuration
 */
function exampleCustomConfiguration() {
  console.log('Example 2: Custom Configuration\n');

  // Create a custom instance with smaller limits for testing
  const customService = new SafetyMonitoringService({
    maxViolations: 100, // Keep only 100 violations
    violationTTL: 10 * 60 * 1000, // 10 minutes TTL
    enableAutoCleanup: true,
    cleanupInterval: 2 * 60 * 1000, // Cleanup every 2 minutes
  });

  // Use the custom instance
  for (let i = 0; i < 150; i++) {
    customService.triggerGuardrail(
      'test_violation',
      'LOW',
      `Test violation ${i}`
    );
  }

  const config = customService.getConfig();
  console.log('Custom service configuration:');
  console.log(`- Max violations: ${config.maxViolations}`);
  console.log(`- Current count: ${config.currentViolationCount}`);
  console.log(`- Violations kept: ${customService.getViolationCount()}`);
  console.log('Note: Only 100 violations kept despite adding 150\n');

  // Clean up when done
  customService.cleanup();
}

/**
 * Example 3: Real-world integration scenario
 */
function exampleRealWorldScenario() {
  console.log('Example 3: Real-world Integration\n');

  // Simulate a swap transaction validation
  function validateSwap(amount: number, slippage: number) {
    if (slippage > 0.05) {
      safetyMonitoringService.triggerGuardrail(
        'slippage_critical',
        'CRITICAL',
        'Slippage exceeds critical threshold',
        { amount, slippage, threshold: 0.05 }
      );
      return false;
    }

    if (amount > 10000) {
      safetyMonitoringService.triggerGuardrail(
        'large_transaction',
        'HIGH',
        'Large transaction requires additional review',
        { amount }
      );
      // Allow but flag for review
    }

    return true;
  }

  // Test various scenarios
  validateSwap(5000, 0.01); // Should pass
  validateSwap(15000, 0.02); // Should trigger HIGH
  validateSwap(20000, 0.06); // Should trigger CRITICAL

  // Get critical violations for immediate attention
  const critical = safetyMonitoringService.getViolationsBySeverity('CRITICAL');
  console.log(`Critical violations requiring immediate attention: ${critical.length}`);

  if (critical.length > 0) {
    console.log('\nCritical violation details:');
    critical.forEach(v => {
      console.log(`- ${v.description}`);
      console.log(`  Type: ${v.type}`);
      console.log(`  Metadata:`, v.metadata);
    });
  }

  console.log('\n');
}

export {
  exampleBasicUsage,
  exampleCustomConfiguration,
  exampleRealWorldScenario,
};
