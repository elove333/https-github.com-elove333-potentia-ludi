# Integration Examples

This directory contains examples of integrating the Planner → Executor pipeline.

See the full documentation in PLANNER_EXECUTOR_GUIDE.md

## Quick Start

```typescript
import { PlannerExecutorClient } from '../api/client';

const client = new PlannerExecutorClient('http://localhost:3001');
const result = await client.submitIntent(
  'swap 100 USDC to ETH',
  '0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4'
);

console.log('Preview:', result.preview);
```

For more examples, see PLANNER_EXECUTOR_GUIDE.md
