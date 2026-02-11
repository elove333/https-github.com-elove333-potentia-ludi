# SafetyMonitoringService

A memory-efficient service for tracking safety violations and guardrail triggers in long-running applications. Implements bounded memory management to prevent memory leaks.

## Features

- ✅ **Bounded Memory**: Maximum size limit prevents unbounded growth (default: 1000 violations)
- ✅ **FIFO Eviction**: Automatically removes oldest violations when limit is exceeded
- ✅ **Time-based Cleanup**: Optional TTL-based cleanup removes old violations (default: 30 minutes)
- ✅ **Automatic Cleanup**: Periodic background cleanup (default: every 5 minutes)
- ✅ **Flexible Querying**: Filter violations by type, severity, or time window
- ✅ **Type-safe**: Full TypeScript support with comprehensive types
- ✅ **Zero Dependencies**: No external dependencies required

## Installation

The service is included in the project under `src/services/safetyMonitoring.ts`.

```typescript
import { safetyMonitoringService } from './src/services/safetyMonitoring';
```

## Quick Start

### Using the Default Singleton

```typescript
import { safetyMonitoringService } from './src/services/safetyMonitoring';

// Trigger a violation
const violation = safetyMonitoringService.triggerGuardrail(
  'slippage_exceeded',
  'MEDIUM',
  'Slippage tolerance exceeded',
  { slippage: 0.03, maxAllowed: 0.02 }
);

// Get all violations
const all = safetyMonitoringService.getViolations();

// Get high-severity violations
const critical = safetyMonitoringService.getViolationsBySeverity('HIGH');

// Get violations by type
const slippageIssues = safetyMonitoringService.getViolationsByType('slippage_exceeded');

// Get recent violations (last 5 minutes)
const recent = safetyMonitoringService.getRecentViolations(5 * 60 * 1000);
```

### Custom Configuration

```typescript
import { SafetyMonitoringService } from './src/services/safetyMonitoring';

const customService = new SafetyMonitoringService({
  maxViolations: 500,           // Keep max 500 violations
  violationTTL: 15 * 60 * 1000, // 15 minute TTL
  enableAutoCleanup: true,      // Enable automatic cleanup
  cleanupInterval: 3 * 60 * 1000 // Cleanup every 3 minutes
});

// Use custom service
customService.triggerGuardrail('test', 'LOW', 'Test violation');

// Don't forget to cleanup when done
customService.cleanup();
```

## API Reference

### Types

#### `SafetyViolation`

```typescript
interface SafetyViolation {
  id: string;                    // Unique violation ID
  timestamp: Date;               // When violation occurred
  type: string;                  // Violation type
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;           // Human-readable description
  metadata?: Record<string, any>; // Optional additional data
}
```

#### `SafetyMonitoringConfig`

```typescript
interface SafetyMonitoringConfig {
  maxViolations?: number;      // Max violations in memory (default: 1000)
  violationTTL?: number;       // TTL in milliseconds (default: 30 minutes)
  enableAutoCleanup?: boolean; // Enable auto cleanup (default: true)
  cleanupInterval?: number;    // Cleanup interval in ms (default: 5 minutes)
}
```

### Methods

#### `triggerGuardrail(type, severity, description, metadata?)`

Trigger a safety violation and add it to the tracking system.

**Parameters:**
- `type` (string): Violation type identifier
- `severity` ('LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): Severity level
- `description` (string): Human-readable description
- `metadata?` (object): Optional additional data

**Returns:** `SafetyViolation` - The created violation object

**Example:**
```typescript
const violation = safetyMonitoringService.triggerGuardrail(
  'rate_limit',
  'HIGH',
  'API rate limit exceeded',
  { endpoint: '/api/swap', limit: 100, current: 105 }
);
```

#### `getViolations()`

Get all violations currently in memory.

**Returns:** `SafetyViolation[]` - Array of all violations (copy)

#### `getViolationsByType(type)`

Get violations filtered by type.

**Parameters:**
- `type` (string): Violation type to filter by

**Returns:** `SafetyViolation[]` - Filtered violations

#### `getViolationsBySeverity(severity)`

Get violations filtered by severity level.

**Parameters:**
- `severity` ('LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): Severity level

**Returns:** `SafetyViolation[]` - Filtered violations

#### `getRecentViolations(withinMs)`

Get violations that occurred within a time window.

**Parameters:**
- `withinMs` (number): Time window in milliseconds

**Returns:** `SafetyViolation[]` - Recent violations

**Example:**
```typescript
// Get violations from last hour
const lastHour = safetyMonitoringService.getRecentViolations(60 * 60 * 1000);
```

#### `getViolationCount()`

Get current count of violations in memory.

**Returns:** `number` - Count of violations

#### `clearViolations()`

Clear all violations from memory.

#### `cleanupOldViolations()`

Manually trigger cleanup of violations older than TTL.

**Returns:** `number` - Count of removed violations

#### `getConfig()`

Get current service configuration.

**Returns:** Configuration object with current settings and violation count

#### `cleanup()`

Clean up resources (stop auto-cleanup timer, clear violations). Call when shutting down the service.

## Memory Management

### Size-based Limiting

The service enforces a maximum size limit (default: 1000 violations). When a new violation is added and the limit is exceeded, the **oldest violation is automatically removed** (FIFO strategy).

```typescript
// With maxViolations: 3
service.triggerGuardrail('test', 'LOW', 'Violation 1');
service.triggerGuardrail('test', 'LOW', 'Violation 2');
service.triggerGuardrail('test', 'LOW', 'Violation 3');
service.getViolationCount(); // Returns: 3

service.triggerGuardrail('test', 'LOW', 'Violation 4');
service.getViolationCount(); // Still returns: 3
// 'Violation 1' was automatically removed
```

### Time-based Cleanup

Violations older than the configured TTL (default: 30 minutes) are automatically removed during periodic cleanup (default: every 5 minutes).

```typescript
const service = new SafetyMonitoringService({
  violationTTL: 10 * 60 * 1000,  // 10 minutes
  cleanupInterval: 2 * 60 * 1000  // Check every 2 minutes
});

// Old violations are automatically removed every 2 minutes
```

You can also manually trigger cleanup:

```typescript
const removed = safetyMonitoringService.cleanupOldViolations();
console.log(`Removed ${removed} old violations`);
```

## Best Practices

### 1. Use Meaningful Violation Types

Use consistent, descriptive violation types:

```typescript
// Good
triggerGuardrail('slippage_exceeded', ...)
triggerGuardrail('amount_threshold', ...)
triggerGuardrail('rate_limit_warning', ...)

// Avoid
triggerGuardrail('error', ...)
triggerGuardrail('issue', ...)
```

### 2. Include Relevant Metadata

Add metadata to help debug issues:

```typescript
triggerGuardrail(
  'large_transaction',
  'HIGH',
  'Transaction exceeds normal size',
  {
    amount: 50000,
    threshold: 10000,
    userId: 'user123',
    chainId: 1
  }
);
```

### 3. Choose Appropriate Severity

Use severity levels consistently:
- **LOW**: Informational, no immediate action needed
- **MEDIUM**: Warning, should be reviewed
- **HIGH**: Requires attention, may block operations
- **CRITICAL**: Immediate attention required, operations blocked

### 4. Monitor Critical Violations

Regularly check for critical violations:

```typescript
const critical = safetyMonitoringService.getViolationsBySeverity('CRITICAL');
if (critical.length > 0) {
  // Alert, log, or take action
  notifyAdmins(critical);
}
```

### 5. Clean Up Custom Instances

Always call `cleanup()` when done with custom instances:

```typescript
const service = new SafetyMonitoringService({ ... });
try {
  // Use service
} finally {
  service.cleanup(); // Important!
}
```

## Examples

See `examples/safetyMonitoring.example.ts` for complete usage examples including:
- Basic usage with singleton
- Custom configuration
- Real-world integration scenarios
- Manual cleanup
- Querying and filtering violations

## Testing

The service includes comprehensive unit tests in `tests/safetyMonitoring.test.ts`:

```bash
npm test -- tests/safetyMonitoring.test.ts
```

All 26 tests cover:
- Violation creation and tracking
- Memory limits and FIFO eviction
- Time-based cleanup
- Querying and filtering
- Edge cases
- Real-world scenarios

## Performance

- **Memory**: O(n) where n = maxViolations (bounded)
- **Add violation**: O(1) amortized
- **Get violations**: O(n) for filters, O(1) for count
- **Cleanup**: O(n) where n = current violation count

The service is designed for long-running applications and maintains constant memory usage regardless of total violations over time.

## License

MIT
