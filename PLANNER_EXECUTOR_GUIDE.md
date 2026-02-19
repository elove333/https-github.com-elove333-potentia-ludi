# Planner → Executor Pipeline Implementation Guide

This document provides a comprehensive guide to the Planner → Executor pipeline implementation.

## Overview

The Planner → Executor pipeline processes user intents for blockchain operations through a structured, safe, and efficient workflow.

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Natural Language Input                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Intent Parser  │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  Validate      │
                    └────────┬───────┘
                             │
                             ▼
        ┌────────────────────────────────────────┐
        │        Pipeline Executor               │
        │                                        │
        │  1. Preflight                         │
        │     - Fetch balances                  │
        │     - Get quotes                      │
        │     - Simulate transaction            │
        │                                        │
        │  2. Preview                           │
        │     - Generate summary                │
        │     - Show token deltas               │
        │     - Calculate gas costs             │
        │     - Check safety limits             │
        │                                        │
        │  3. Build (after user confirmation)   │
        │     - Prefer Permit2                  │
        │     - Fallback: bounded allowances    │
        │     - Craft final transaction         │
        │                                        │
        │  4. Wallet                            │
        │     - Submit to user's wallet         │
        │     - Track on-chain confirmation     │
        └────────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │   PostgreSQL   │
                    │   (Tracking)   │
                    └────────────────┘
```

## Architecture

### Components

#### 1. Intent Parser (`api/services/intentParser.ts`)
- Converts natural language to structured intent schemas
- Supports: `balances.get`, `trade.swap`, `bridge.transfer`, `rewards.claim`
- Validates intent structure and parameters

#### 2. Pipeline Executor (`api/services/pipelineExecutor.ts`)
- Orchestrates the execution pipeline
- Manages state transitions
- Enforces safety limits
- Handles errors and logging

#### 3. Database Layer (`api/lib/database.ts`)
- PostgreSQL connection pooling
- Query helpers for all tables
- Transaction support

#### 4. Authentication (`api/lib/auth.ts`)
- SIWE (Sign-In with Ethereum) implementation
- Nonce generation and validation
- Session management

#### 5. API Routes (`api/routes/`)
- RESTful endpoints for all operations
- Request validation
- Error handling

## Intent Types

### 1. balances.get
Retrieve token balances and approvals.

**Natural Language Examples:**
- "check my balance"
- "show my tokens"
- "get my balances with approvals"
- "check my NFTs on polygon"

**Schema:**
```typescript
{
  type: 'balances.get',
  takerAddress: '0x...',
  chainId: 1,
  tokens?: ['0x...'],
  includeApprovals?: true,
  includeNFTs?: true
}
```

### 2. trade.swap
Execute token swaps with safety checks.

**Natural Language Examples:**
- "swap 100 USDC to ETH"
- "trade 0.5 ETH for USDC with 1% slippage"
- "buy 1000 USDC using ETH on base"
- "exchange DAI to USDC using Uniswap"

**Schema:**
```typescript
{
  type: 'trade.swap',
  takerAddress: '0x...',
  chainId: 1,
  from: {
    token: 'USDC',
    amount: '100',
    chain: 'ethereum'
  },
  to: {
    token: 'ETH',
    chain: 'ethereum',
    minAmount?: '0.04'
  },
  constraints: {
    slippage_bps: 50,
    prefer_sources?: ['Uniswap_V3'],
    max_gas_price?: '100',
    simulate: true
  }
}
```

### 3. bridge.transfer
Bridge tokens between chains.

**Natural Language Examples:**
- "bridge 1000 USDC from polygon to ethereum"
- "transfer 500 USDC to base"
- "move my tokens from arbitrum to optimism"

**Schema:**
```typescript
{
  type: 'bridge.transfer',
  takerAddress: '0x...',
  chainId: 137,
  from: {
    token: 'USDC',
    amount: '1000',
    chain: 'polygon'
  },
  to: {
    chain: 'ethereum',
    recipient?: '0x...'
  },
  constraints: {
    max_delay_minutes: 30,
    min_output: '995'
  }
}
```

### 4. rewards.claim
Claim gaming rewards and airdrops.

**Natural Language Examples:**
- "claim my rewards"
- "claim all available airdrops"
- "collect my gaming rewards"

**Schema:**
```typescript
{
  type: 'rewards.claim',
  takerAddress: '0x...',
  chainId: 1,
  rewards: [
    {
      contract: '0x...',
      tokenId?: '123',
      amount?: '100',
      proof?: ['0x...']
    }
  ],
  claimAll: true
}
```

## Pipeline Stages

### Stage 1: Preflight

**Purpose:** Gather all necessary data before execution

**Actions:**
- Fetch current token balances
- Get allowances and approvals
- Retrieve swap quotes from 0x API v2
- Get bridge quotes from aggregators
- Simulate transaction via Tenderly
- Check gas prices via Blocknative

**Example Output:**
```json
{
  "quote": {
    "sellAmount": "100000000",
    "buyAmount": "45000000000000000",
    "price": "0.00045",
    "route": [
      { "source": "Uniswap_V3", "percentage": 100 }
    ],
    "estimatedGas": "200000",
    "gasPrice": "30000000000"
  }
}
```

### Stage 2: Preview

**Purpose:** Generate human-readable summary for user review

**Actions:**
- Create transaction summary
- Calculate token deltas (in/out)
- Estimate gas costs in ETH and USD
- Generate warnings (high slippage, gas, etc.)
- Check spend limits and allowlists
- Decode contract calls

**Example Output:**
```json
{
  "summary": "Swap 100 USDC → 0.045 ETH",
  "tokenDeltas": [
    {
      "token": "USDC",
      "symbol": "USDC",
      "amount": "100",
      "direction": "out"
    },
    {
      "token": "ETH",
      "symbol": "ETH",
      "amount": "0.045",
      "direction": "in"
    }
  ],
  "gasCost": {
    "estimatedGas": "200000",
    "gasPrice": "30000000000",
    "totalCostEth": "0.006",
    "totalCostUsd": 15.0
  },
  "warnings": [
    "Gas prices are currently high. Consider waiting."
  ]
}
```

### Stage 3: Build

**Purpose:** Create final transaction after user confirmation

**Actions:**
1. **Check for Permit2 support**
   - If available: Generate EIP-712 signature
   - Benefits: Gasless approval, better UX
   
2. **Fallback to bounded allowance**
   - Set specific amount (not unlimited)
   - Add expiry timestamp
   - Generate approve() transaction first

3. **Craft final transaction**
   - Set correct gas parameters
   - Include all necessary data
   - Add nonce if needed

**Example Output:**
```json
{
  "transaction": {
    "to": "0xDef1C0ded9bec7F1a1670819833240f027b25EfF",
    "data": "0x...",
    "value": "0",
    "gas": "200000",
    "gasPrice": "30000000000",
    "chainId": 1,
    "permit2Signature": "0x..."
  }
}
```

### Stage 4: Wallet

**Purpose:** Submit to user's wallet for signing

**Actions:**
- Send transaction to wallet client
- Track submission
- Monitor confirmation
- Update database with tx_hash
- Log telemetry

## Safety Measures

### 1. Spend Limits

Per-user limits stored in `limits` table:

```sql
CREATE TABLE limits (
  user_id BIGINT PRIMARY KEY,
  daily_usd_cap NUMERIC(20, 6),      -- Max daily spend
  max_approval_usd NUMERIC(20, 6),   -- Max approval amount
  allowlist JSONB,                    -- Allowed contracts
  daily_spent_usd NUMERIC(20, 6),    -- Current daily spend
  last_reset_at TIMESTAMPTZ
);
```

**Enforcement:**
- Check before transaction build
- Reject if limit exceeded
- Track spending in USD
- Reset daily at midnight

### 2. Transaction Simulation

**Via Tenderly:**
- Simulate all transactions before execution
- Detect reverts early
- Show exact gas usage
- Decode state changes

**Example:**
```typescript
const sim = await fetch('https://api.tenderly.co/api/v1/.../simulate', {
  method: 'POST',
  body: JSON.stringify({
    network_id: '1',
    from: '0x...',
    to: '0x...',
    input: '0x...',
    gas: '200000'
  })
});
```

### 3. Permit2 Priority

**Benefits:**
- No separate approve() transaction
- Gas savings
- Better UX
- Expirable permissions

**Fallback:**
```typescript
// If Permit2 not available
const approveCalldata = erc20.interface.encodeFunctionData('approve', [
  spender,
  amount  // Bounded, not MAX_UINT256
]);
```

### 4. Gas Advisories

**Warnings shown when:**
- Gas price > 50 gwei on mainnet
- Gas price in top 95th percentile
- Transaction would be expensive (>$20)

### 5. Stale Quote Protection

- Quotes expire after 30 seconds
- User must refresh if expired
- Prevents frontrunning
- Ensures accurate pricing

### 6. Allowlist Enforcement

```typescript
if (limits.allowlist && limits.allowlist.length > 0) {
  if (!limits.allowlist.includes(transaction.to)) {
    throw new Error('Contract not in allowlist');
  }
}
```

## Database Schema

### users
```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  address BYTEA UNIQUE NOT NULL,
  ens VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### sessions
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  siwe_message TEXT NOT NULL,
  nonce VARCHAR(128) NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  user_agent TEXT,
  ip INET
);
```

### intents
```sql
CREATE TABLE intents (
  id UUID PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  intent_type TEXT NOT NULL,
  intent_json JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  preview JSONB,
  tx_hash TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### limits
```sql
CREATE TABLE limits (
  user_id BIGINT PRIMARY KEY REFERENCES users(id),
  daily_usd_cap NUMERIC(20, 6),
  max_approval_usd NUMERIC(20, 6),
  allowlist JSONB DEFAULT '[]'::JSONB,
  daily_spent_usd NUMERIC(20, 6) DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT NOW()
);
```

### telemetry
```sql
CREATE TABLE telemetry (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  event TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Endpoints

### Authentication

#### POST /api/siwe/nonce
Generate nonce for SIWE.

```bash
curl -X POST http://localhost:3001/api/siwe/nonce
```

#### POST /api/siwe/verify
Verify SIWE message and create session.

```bash
curl -X POST http://localhost:3001/api/siwe/verify \
  -H "Content-Type: application/json" \
  -d '{
    "message": "...",
    "signature": "0x..."
  }'
```

#### POST /api/siwe/logout
Logout and clear session.

```bash
curl -X POST http://localhost:3001/api/siwe/logout
```

### Intent Processing

#### POST /api/intents/submit
Submit natural language intent.

```bash
curl -X POST http://localhost:3001/api/intents/submit \
  -H "Content-Type: application/json" \
  -d '{
    "input": "swap 100 USDC to ETH",
    "address": "0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4",
    "chainId": 1
  }'
```

#### POST /api/intents/build
Build transaction after preview confirmation.

```bash
curl -X POST http://localhost:3001/api/intents/build \
  -H "Content-Type: application/json" \
  -d '{
    "intentId": "uuid-here"
  }'
```

#### GET /api/intents/:id
Get intent details.

```bash
curl http://localhost:3001/api/intents/uuid-here
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup PostgreSQL

```bash
# Create database
createdb potentia_ludi

# Run schema
npm run db:setup
```

### 3. Configure Environment

```bash
# Copy template
cp .env.example .env

# Edit .env and add your API keys
```

### 4. Run Development Server

```bash
# Start API server
npm run api:dev

# In another terminal, start frontend
npm run dev
```

### 5. Test Endpoints

```bash
# Health check
curl http://localhost:3001/health

# Submit intent
curl -X POST http://localhost:3001/api/intents/submit \
  -H "Content-Type: application/json" \
  -d '{
    "input": "check my balance",
    "address": "0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4"
  }'
```

## Production Deployment

### Prerequisites

- [ ] PostgreSQL 14+ with configured connection pooling
- [ ] Redis for session/nonce storage
- [ ] SSL certificates
- [ ] Environment variables configured
- [ ] Rate limiting configured
- [ ] Monitoring setup

### Deployment Checklist

1. **Database**
   ```bash
   psql -d potentia_ludi -f database/schema.sql
   ```

2. **Environment**
   - Set all API keys
   - Use strong SESSION_SECRET
   - Configure DATABASE_URL with SSL

3. **Security**
   - Enable CORS with specific origins
   - Set httpOnly, secure cookies
   - Implement rate limiting
   - Enable HTTPS only

4. **Monitoring**
   - Database query performance
   - API response times
   - Error rates
   - User activity

5. **Scheduled Jobs**
   - Daily limit resets
   - Session cleanup
   - Telemetry pruning

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
# Test full pipeline
curl -X POST http://localhost:3001/api/intents/submit \
  -H "Content-Type: application/json" \
  -d @test/fixtures/swap-intent.json
```

### Manual Testing

1. Submit various intents
2. Verify database records
3. Check preview generation
4. Test safety limits
5. Confirm error handling

## Troubleshooting

### Database Connection Errors

```bash
# Check PostgreSQL is running
psql -d potentia_ludi -c "SELECT 1"

# Verify DATABASE_URL
echo $DATABASE_URL
```

### API Errors

```bash
# Check logs
tail -f api.log

# Verify dependencies
npm list pg siwe ethers
```

### Intent Parsing Errors

```typescript
// Enable debug logging
const intent = IntentParser.parse(input, address, chainId);
console.log('Parsed intent:', JSON.stringify(intent, null, 2));
```

## Contributing

1. Follow TypeScript strict mode
2. Add tests for new features
3. Update documentation
4. Run linter before committing
5. Follow existing code style

## License

MIT
