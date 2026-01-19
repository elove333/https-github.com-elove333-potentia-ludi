/**
 * Telemetry System Demo
 * 
 * This file demonstrates how to use the telemetry, success metrics,
 * and safety monitoring services in a real-world scenario.
 */

import { telemetryService } from './src/services/telemetry';
import { successMetricsService } from './src/services/successMetrics';
import { safetyMonitoringService } from './src/services/safetyMonitoring';

// ============= Scenario 1: User Authentication =============

async function demoUserAuthentication() {
  console.log('\n=== Demo: User Authentication ===\n');
  
  const userAddress = '0x742d35Cc6634C0532925a3b844D7D329B81b5fE4';
  const chainId = 1; // Ethereum
  
  // Initialize telemetry with user context
  telemetryService.init(userAddress);
  
  // Simulate successful login
  console.log('User logging in with SIWE...');
  telemetryService.emitLoginSuccess(userAddress, chainId);
  
  console.log('✓ Login event emitted');
}

// ============= Scenario 2: Token Swap Workflow =============

async function demoTokenSwap() {
  console.log('\n=== Demo: Token Swap Workflow ===\n');
  
  const chainId = 137; // Polygon
  const fromToken = '0x2791Bca1f2aD161e1a43a2250A0fFfA4eD89b55d'; // USDC
  const toToken = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'; // WMATIC
  const amount = '100000000'; // 100 USDC (6 decimals)
  
  // Step 1: Request quote
  console.log('Requesting swap quote...');
  telemetryService.emitQuoteRequested(chainId, fromToken, toToken, amount);
  
  // Step 2: Simulate transaction
  console.log('Simulating transaction...');
  const gasEstimate = '150000';
  const txData = {
    from: '0x742d35Cc6634C0532925a3b844D7D329B81b5fE4',
    to: toToken,
    value: '0',
    data: '0x...',
  };
  
  telemetryService.emitSimulationOk(chainId, gasEstimate, txData);
  
  // Step 3: Execute swap
  console.log('Executing swap...');
  const route = [fromToken, '0x...', toToken]; // Route through intermediary
  const amountOut = '45000000000000000000'; // 45 WMATIC
  
  telemetryService.emitSwapExecuted(
    chainId,
    fromToken,
    toToken,
    amount,
    amountOut,
    route
  );
  
  console.log('✓ Swap workflow completed');
}

// ============= Scenario 3: Transaction with Safety Check =============

async function demoTransactionWithSafety() {
  console.log('\n=== Demo: Transaction with Safety Check ===\n');
  
  const chainId = 1;
  const toAddress = '0x1234567890123456789012345678901234567890';
  const value = '5000000000000000000'; // 5 ETH
  const data = '0x095ea7b3' + 'f'.repeat(64); // Unlimited approval
  
  // Check transaction safety
  console.log('Checking transaction safety...');
  const safetyCheck = safetyMonitoringService.checkTransactionSafety(
    toAddress,
    value,
    data,
    chainId
  );
  
  if (!safetyCheck.safe) {
    console.log('⚠️  Transaction flagged as UNSAFE');
    console.log('Violations:');
    safetyCheck.violations.forEach(v => {
      console.log(`  - ${v.violationType}: ${v.reason} [${v.severity}]`);
    });
  } else {
    console.log('✓ Transaction passed safety checks');
    
    // Proceed with transaction
    const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    telemetryService.emitTransactionSend(chainId, txHash, 'swap', value);
    
    // Simulate mining
    setTimeout(() => {
      telemetryService.emitTransactionMined(chainId, txHash, 'success', '150000', 12345678);
      console.log('✓ Transaction mined successfully');
    }, 2000);
  }
}

// ============= Scenario 4: Reward Tracking =============

async function demoRewardTracking() {
  console.log('\n=== Demo: Reward Tracking ===\n');
  
  const chainId = 42161; // Arbitrum
  const tokenSymbol = 'GAME';
  const amount = '250.50';
  const usdValue = 125.25;
  
  // Discover reward
  console.log('Discovering reward...');
  telemetryService.emitRewardFound(
    chainId,
    tokenSymbol,
    amount,
    usdValue,
    'gameplay'
  );
  
  console.log('✓ Reward discovered');
  
  // Claim reward
  setTimeout(() => {
    console.log('Claiming reward...');
    const txHash = '0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef';
    telemetryService.emitRewardClaimed(chainId, tokenSymbol, amount, txHash);
    console.log('✓ Reward claimed');
  }, 1000);
}

// ============= Scenario 5: Success Metrics Analysis =============

async function demoSuccessMetrics() {
  console.log('\n=== Demo: Success Metrics Analysis ===\n');
  
  // Wait a bit for events to accumulate
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Calculate overall metrics
  console.log('Calculating success metrics...');
  const metrics = successMetricsService.calculateSuccessMetrics();
  
  console.log('\nSuccess Metrics:');
  console.log(`  First Success Rate: ${metrics.firstSuccessRate.toFixed(2)}%`);
  console.log(`  Quote-to-Send Conversion: ${metrics.quoteToSendConversion.toFixed(2)}%`);
  console.log(`  Execution Reliability: ${metrics.executionReliability.toFixed(2)}%`);
  console.log(`  Avg Time to First TX: ${metrics.averageTimeToFirstTransaction.toFixed(2)} min`);
  console.log(`  Revert Rate: ${metrics.revertRate.toFixed(2)}%`);
  console.log(`  Claim Rate: ${metrics.claimRate.toFixed(2)}%`);
  
  // Get funnel metrics
  const funnel = successMetricsService.getFunnelMetrics();
  
  console.log('\nFunnel Metrics:');
  console.log(`  New Users: ${funnel.newUsers}`);
  console.log(`  Users with First TX: ${funnel.usersWithFirstTransaction}`);
  console.log(`  Quote Requests: ${funnel.quoteRequests}`);
  console.log(`  Successful Simulations: ${funnel.successfulSimulations}`);
  console.log(`  Transactions Sent: ${funnel.transactionsSent}`);
  console.log(`  Transactions Mined: ${funnel.transactionsMined}`);
  
  // Get full summary
  const summary = successMetricsService.getSuccessSummary();
  console.log('\nOverall Summary:');
  console.log(`  Total Events: ${summary.totalEvents}`);
  console.log(`  Active Users: ${summary.activeUsers}`);
}

// ============= Scenario 6: Threshold Monitoring =============

async function demoThresholdMonitoring() {
  console.log('\n=== Demo: Threshold Monitoring ===\n');
  
  // Configure custom thresholds
  console.log('Configuring safety thresholds...');
  safetyMonitoringService.setThresholds({
    maxRevertRate: 3.0,
    maxFailureRate: 5.0,
    minSimulationSuccessRate: 95.0
  });
  
  console.log('✓ Thresholds configured');
  
  // Get violation statistics
  const stats = safetyMonitoringService.getViolationStats();
  console.log('\nViolation Statistics:');
  console.log(`  Total Violations: ${stats.total}`);
  console.log(`  Warning: ${stats.bySeverity.warning}`);
  console.log(`  Critical: ${stats.bySeverity.critical}`);
  
  if (Object.keys(stats.byType).length > 0) {
    console.log('  By Type:');
    Object.entries(stats.byType).forEach(([type, count]) => {
      console.log(`    - ${type}: ${count}`);
    });
  }
  
  // Get recent violations
  const recentViolations = safetyMonitoringService.getRecentViolations(5);
  if (recentViolations.length > 0) {
    console.log('\nRecent Violations:');
    recentViolations.forEach((v, i) => {
      console.log(`  ${i + 1}. [${v.severity.toUpperCase()}] ${v.violationType}: ${v.reason}`);
    });
  }
}

// ============= Run All Demos =============

async function runAllDemos() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  Telemetry System Demo - All Features ║');
  console.log('╚════════════════════════════════════════╝');
  
  try {
    // Run all demo scenarios
    await demoUserAuthentication();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await demoTokenSwap();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await demoTransactionWithSafety();
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    await demoRewardTracking();
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    await demoSuccessMetrics();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await demoThresholdMonitoring();
    
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  Demo Complete!                        ║');
    console.log('╚════════════════════════════════════════╝\n');
    
    // Flush remaining events
    await telemetryService.flush();
    
  } catch (error) {
    console.error('\n❌ Demo failed:', error);
  }
}

// Export for use
export {
  demoUserAuthentication,
  demoTokenSwap,
  demoTransactionWithSafety,
  demoRewardTracking,
  demoSuccessMetrics,
  demoThresholdMonitoring,
  runAllDemos
};

// Run if executed directly
if (require.main === module) {
  runAllDemos().then(() => {
    // Give time for async operations to complete
    setTimeout(() => process.exit(0), 1000);
  });
}
