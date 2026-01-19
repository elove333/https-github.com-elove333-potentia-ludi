# Telemetry & Success Metrics System

## Overview

This telemetry system provides comprehensive tracking and monitoring of user workflows, transaction success rates, and system reliability. It enables data-driven decision making through real-time metrics and pre-aggregated analytics views.

## Architecture

### Components

1. **Telemetry Service** (`src/services/telemetry.ts`)
   - Core event emission and tracking
   - Automatic event batching and flushing
   - Session management
   - Event subscription system

2. **Success Metrics Service** (`src/services/successMetrics.ts`)
   - Real-time metric calculations
   - Funnel analysis
   - Conversion rate tracking
   - Performance indicators

3. **Safety Monitoring Service** (`src/services/safetyMonitoring.ts`)
   - Threshold monitoring
   - Guardrail violations
   - Transaction safety checks
   - Automated alerts

4. **Database Schema** (`database/schema.sql`)
   - Telemetry events table
   - Optimized indexes
   - JSONB payload storage

5. **Analytics Views** (`database/views.sql`)
   - Pre-aggregated funnel queries
   - Success rate calculations
   - User engagement metrics

## Event Types

### Authentication Events
- `siwe_login_success` - Successful Sign-In with Ethereum
- `siwe_login_failure` - Failed authentication attempt

### Transaction Events
- `simulation_ok` - Transaction simulation succeeded
- `simulation_revert` - Transaction simulation reverted
- `tx_send` - Transaction sent to network
- `tx_mined` - Transaction mined (success or failure)

### Reward Events
- `reward_found` - New reward discovered
- `reward_claimed` - Reward claimed by user

### Other Events
- `quote_requested` - Token swap quote requested
- `swap_executed` - Token swap executed
- `game_detected` - Web3 game detected
- `guardrail_violation` - Safety guardrail triggered

## Usage

### Basic Event Emission

```typescript
import { telemetryService } from './services/telemetry';

// Initialize with user context
telemetryService.init(userAddress);

// Emit events using helper methods
telemetryService.emitLoginSuccess(address, chainId);
telemetryService.emitSimulationOk(chainId, gasEstimate, txData);
telemetryService.emitTransactionMined(chainId, txHash, 'success', gasUsed);

// Or emit custom events
telemetryService.emit('custom_event', 'category', {
  key: 'value',
  data: 123
}, chainId);
```

### Success Metrics

```typescript
import { successMetricsService } from './services/successMetrics';

// Get overall metrics
const metrics = successMetricsService.calculateSuccessMetrics();
console.log('First Success Rate:', metrics.firstSuccessRate);
console.log('Quote to Send Conversion:', metrics.quoteToSendConversion);
console.log('Execution Reliability:', metrics.executionReliability);

// Get funnel metrics
const funnel = successMetricsService.getFunnelMetrics();
console.log('New Users:', funnel.newUsers);
console.log('Users with Transactions:', funnel.usersWithFirstTransaction);

// Get chain-specific metrics
const chainMetrics = successMetricsService.getChainMetrics(1); // Ethereum

// Get time-period metrics
const startDate = new Date('2024-01-01');
const endDate = new Date('2024-01-31');
const periodMetrics = successMetricsService.getMetricsForPeriod(startDate, endDate);
```

### Safety Monitoring

```typescript
import { safetyMonitoringService } from './services/safetyMonitoring';

// Check transaction safety before execution
const safetyCheck = safetyMonitoringService.checkTransactionSafety(
  toAddress,
  value,
  data,
  chainId
);

if (!safetyCheck.safe) {
  console.warn('Transaction flagged as unsafe:', safetyCheck.violations);
}

// Configure custom thresholds
safetyMonitoringService.setThresholds({
  maxRevertRate: 3.0, // 3%
  maxFailureRate: 5.0, // 5%
  minSimulationSuccessRate: 95.0 // 95%
});

// Get violation statistics
const stats = safetyMonitoringService.getViolationStats();
console.log('Total violations:', stats.total);
console.log('By severity:', stats.bySeverity);
```

## Database Queries

### Example: Query Recent Events

```sql
-- Get all events for a user in the last 24 hours
SELECT *
FROM telemetry
WHERE user_address = '0x...'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Using Pre-Aggregated Views

```sql
-- Get new user first success metrics
SELECT *
FROM v_new_user_first_success
WHERE date > NOW() - INTERVAL '30 days'
ORDER BY date DESC;

-- Check quote conversion rates
SELECT *
FROM v_quote_success_conversion
WHERE hour > NOW() - INTERVAL '7 days'
ORDER BY hour DESC;

-- Monitor transaction reliability
SELECT *
FROM v_transaction_reliability
WHERE chain_id = 1
  AND revert_rate_pct >= 5.0;

-- View guardrail violations
SELECT *
FROM v_guardrails_violations
WHERE violation_count > 10;
```

## Key Metrics

### First Success Rate
Percentage of new users who complete their first successful transaction.

**Formula:** `(Users with First TX / New Users) * 100`

**Target:** > 50%

### Quote-to-Send Conversion
Percentage of quote requests that result in transaction sends.

**Formula:** `(Transactions Sent / Quote Requests) * 100`

**Target:** > 70%

### Execution Reliability
Percentage of transactions that succeed without failure.

**Formula:** `(Successful TX / Total TX) * 100`

**Target:** > 95%

### Revert Rate
Percentage of simulations that revert.

**Formula:** `(Reverted Simulations / Total Simulations) * 100`

**Target:** < 5%

## Safety Thresholds

Default safety thresholds:

- **Max Revert Rate:** 5%
- **Max Failure Rate:** 10%
- **Min Simulation Success Rate:** 90%

When thresholds are exceeded, guardrail violations are emitted and logged.

## Production Deployment

### Backend API Integration

In production, the telemetry service should flush events to a backend API:

```typescript
// In telemetry.ts, update the flush() method:
async flush(): Promise<void> {
  if (this.eventQueue.length === 0) return;

  const eventsToFlush = [...this.eventQueue];
  this.eventQueue = [];

  try {
    await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventsToFlush),
    });

    console.log(`[Telemetry] Flushed ${eventsToFlush.length} events`);
  } catch (error) {
    console.error('[Telemetry] Failed to flush events:', error);
    this.eventQueue.unshift(...eventsToFlush);
  }
}
```

### Database Setup

1. Run schema creation:
```bash
psql -U your_user -d your_database -f database/schema.sql
```

2. Create analytics views:
```bash
psql -U your_user -d your_database -f database/views.sql
```

3. Set up scheduled jobs for view refresh if needed.

### Monitoring

- Set up alerts for guardrail violations
- Monitor view query performance
- Set up dashboards for key metrics
- Configure log aggregation for telemetry events

## Best Practices

1. **Event Payload Size**: Keep payloads under 5KB for optimal performance
2. **Batch Size**: Default 5-second flush interval works for most use cases
3. **Index Maintenance**: Monitor index usage and update as query patterns evolve
4. **Data Retention**: Implement data retention policies (e.g., 90 days for raw events)
5. **Privacy**: Ensure user addresses are properly anonymized if required by regulations

## Troubleshooting

### Events Not Being Emitted

1. Check that telemetryService is initialized
2. Verify session ID is being generated
3. Check browser console for errors

### Metrics Showing Zero

1. Ensure events are being collected
2. Check that enough events exist for meaningful metrics
3. Verify event types match expectations

### Database Performance

1. Check index usage with `EXPLAIN ANALYZE`
2. Consider partitioning telemetry table by date
3. Monitor view query performance
4. Add composite indexes for common query patterns

## Future Enhancements

- Real-time dashboard integration
- Machine learning-based anomaly detection
- Automated A/B testing framework
- Predictive analytics for user behavior
- Custom metric definitions via UI
- Webhook integration for violations
- Multi-region data aggregation
