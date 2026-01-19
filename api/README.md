# Planner → Executor Pipeline - Backend API

This directory contains the backend API implementation for the Planner → Executor pipeline, which processes user intents for blockchain operations.

## Architecture

### Overview

```
User Input (NL) → Parser → Pipeline Executor → Wallet
                              ↓
                    DB (PostgreSQL)
```

### Pipeline Stages

1. **Parse**: Natural language → Structured intent schema
2. **Preflight**: Fetch balances, quotes, simulate transactions
3. **Preview**: Generate human-readable summary with safety checks
4. **Build**: Create transaction with Permit2 or bounded allowances
5. **Wallet**: Submit to user's wallet for signing

## Directory Structure

```
api/
├── lib/
│   ├── database.ts      # PostgreSQL connection & queries
│   └── auth.ts          # SIWE authentication
├── services/
│   ├── intentParser.ts      # NL → Intent schema parser
│   └── pipelineExecutor.ts  # Pipeline orchestration
└── routes/
    ├── siwe/
    │   ├── nonce.ts     # POST /api/siwe/nonce
    │   ├── verify.ts    # POST /api/siwe/verify
    │   └── logout.ts    # POST /api/siwe/logout
    └── intents/
        ├── submit.ts    # POST /api/intents/submit
        ├── build.ts     # POST /api/intents/build
        └── get.ts       # GET /api/intents/:id
```

## Intent Types

### 1. balances.get
Retrieve token balances and approvals across chains.

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
Perform a token swap with slippage and simulation.

```typescript
{
  type: 'trade.swap',
  takerAddress: '0x...',
  chainId: 1,
  from: { token: 'USDC', amount: '100', chain: 'ethereum' },
  to: { token: 'ETH', chain: 'ethereum', minAmount: '0.04' },
  constraints: {
    slippage_bps: 50,        // 0.5%
    prefer_sources: ['Uniswap_V3'],
    simulate: true
  }
}
```

### 3. bridge.transfer
Bridge tokens between chains.

```typescript
{
  type: 'bridge.transfer',
  takerAddress: '0x...',
  chainId: 137,
  from: { token: 'USDC', amount: '1000', chain: 'polygon' },
  to: { chain: 'ethereum' },
  constraints: {
    max_delay_minutes: 30,
    min_output: '995'
  }
}
```

### 4. rewards.claim
Claim gaming rewards or airdrops.

```typescript
{
  type: 'rewards.claim',
  takerAddress: '0x...',
  chainId: 1,
  rewards: [
    { contract: '0x...', amount: '100' }
  ],
  claimAll: true
}
```

## API Endpoints

### Authentication (SIWE)

#### POST /api/siwe/nonce
Generate a nonce for SIWE authentication.

**Response:**
```json
{
  "nonce": "abc123..."
}
```

#### POST /api/siwe/verify
Verify SIWE message and create session.

**Request:**
```json
{
  "message": "example.com wants you to sign in...",
  "signature": "0x..."
}
```

**Response:**
```json
{
  "ok": true,
  "address": "0x...",
  "userId": 123
}
```

#### POST /api/siwe/logout
Clear session and log out.

**Response:**
```json
{
  "ok": true
}
```

### Intent Processing

#### POST /api/intents/submit
Submit a natural language intent for processing.

**Request:**
```json
{
  "input": "swap 100 USDC to ETH on ethereum",
  "address": "0x...",
  "chainId": 1
}
```

**Response:**
```json
{
  "ok": true,
  "intentId": "uuid",
  "intent": { ... },
  "status": "previewed",
  "preview": {
    "summary": "Swap 100 USDC → 0.045 ETH",
    "tokenDeltas": [...],
    "gasCost": { ... },
    "warnings": []
  }
}
```

#### POST /api/intents/build
Build transaction after user confirms preview.

**Request:**
```json
{
  "intentId": "uuid"
}
```

**Response:**
```json
{
  "ok": true,
  "intentId": "uuid",
  "transaction": {
    "to": "0x...",
    "data": "0x...",
    "value": "0",
    "gas": "200000",
    "chainId": 1
  }
}
```

#### GET /api/intents/:id
Fetch intent details by ID.

**Response:**
```json
{
  "id": "uuid",
  "user_id": 123,
  "intent_type": "trade.swap",
  "intent_json": { ... },
  "status": "completed",
  "preview": { ... },
  "tx_hash": "0x...",
  "created_at": "2024-01-01T00:00:00Z"
}
```

## Safety Features

### Spend Limits
- **Daily USD Cap**: Maximum daily spending per user
- **Max Approval USD**: Maximum token approval amount
- **Allowlist**: Whitelist of allowed contract addresses

### Transaction Safety
- **Simulation**: All transactions simulated via Tenderly before execution
- **Revert Detection**: Preview shows revert reasons if simulation fails
- **Gas Advisories**: Warnings for high gas prices
- **Slippage Protection**: Configurable slippage tolerance
- **Stale Quote Protection**: Quotes expire after 30 seconds

### Permit2 Priority
1. **Prefer Permit2**: Gasless approvals via EIP-2612 signatures
2. **Fallback**: Bounded allowances with expiry timestamps
3. **Never**: Unlimited approvals

## Environment Variables

Create a `.env` file:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/potentia_ludi

# External APIs
ALCHEMY_API_KEY=your_key_here
MORALIS_API_KEY=your_key_here
OX_API_KEY=your_0x_api_key
TENDERLY_ACCESS_KEY=your_tenderly_key
BLOCKNATIVE_API_KEY=your_blocknative_key

# Session (optional)
SESSION_SECRET=random_string_here
```

## Dependencies

Install required packages:

```bash
npm install pg siwe ethers viem
npm install --save-dev @types/pg
```

## Database Setup

1. Install PostgreSQL 14+
2. Create database: `createdb potentia_ludi`
3. Run schema: `psql -d potentia_ludi -f database/schema.sql`

See `database/README.md` for detailed setup instructions.

## Development

### Running Locally

This is designed to work with Express, Next.js, or any Node.js server framework.

**Express Example:**

```typescript
import express from 'express';
import { POST as submitIntent } from './api/routes/intents/submit';

const app = express();
app.use(express.json());

app.post('/api/intents/submit', async (req, res) => {
  const response = await submitIntent(req as any);
  const data = await response.json();
  res.status(response.status).json(data);
});

app.listen(3000);
```

### Testing

```bash
# Test nonce generation
curl -X POST http://localhost:3000/api/siwe/nonce

# Test intent submission
curl -X POST http://localhost:3000/api/intents/submit \
  -H "Content-Type: application/json" \
  -d '{
    "input": "check my balances",
    "address": "0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4"
  }'
```

## Natural Language Examples

The parser supports various natural language inputs:

```
"check my balance"
"show my tokens on polygon"
"swap 100 USDC to ETH"
"trade 0.5 ETH for USDC with 1% slippage on base"
"bridge 1000 USDC from polygon to ethereum"
"claim my rewards"
"claim all available airdrops"
```

## Security Considerations

1. **Never store private keys**: All signing happens client-side
2. **Rate limiting**: Implement rate limiting on all endpoints
3. **Input validation**: All inputs validated before processing
4. **Session management**: Use httpOnly, secure cookies for sessions
5. **Database security**: Use parameterized queries (implemented)
6. **CORS**: Configure CORS properly for production
7. **Environment variables**: Never commit `.env` to version control

## Production Deployment

### Checklist

- [ ] Set up PostgreSQL database
- [ ] Configure environment variables
- [ ] Enable database connection pooling
- [ ] Implement Redis for nonce storage (currently in-memory)
- [ ] Add rate limiting middleware
- [ ] Configure CORS
- [ ] Set up logging and monitoring
- [ ] Enable HTTPS
- [ ] Set secure session cookies
- [ ] Run database migrations
- [ ] Set up cron job for `reset_daily_limits()`
- [ ] Configure backup strategy

### Scaling

- Use Redis for session storage and nonce tracking
- Database read replicas for intent queries
- Cache frequent balance queries
- Queue system for heavy pipeline execution
- CDN for API responses where applicable

## Monitoring

Key metrics to track:

- Intent submission rate
- Pipeline execution time
- Database query performance
- API error rates
- User session duration
- Daily spending limits hit

## Contributing

1. Follow TypeScript strict mode
2. Add JSDoc comments for public functions
3. Write tests for new features
4. Update documentation
5. Run linter before committing

## License

MIT
