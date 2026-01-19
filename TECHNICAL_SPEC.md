# Conversational Web3 Wallet Hub - Implementation Guide

## Overview

This repository implements a full-stack Conversational Web3 Wallet Hub with natural language intent processing, SIWE authentication, and comprehensive safety features.

## Architecture

### Technology Stack

- **Frontend**: Next.js 14 with App Router
- **Database**: PostgreSQL (configured for Neon)
- **Cache**: Redis (configured for Upstash)
- **Authentication**: SIWE (Sign-In with Ethereum) with Iron Session
- **Logging**: Pino with structured logging
- **Intent Processing**: Zod schema validation

### Core Components

#### 1. Authentication (SIWE)
- **Endpoints**: `/api/siwe/nonce`, `/api/siwe/verify`, `/api/siwe/logout`
- **Features**: 
  - Nonce generation and validation
  - Signature verification
  - Session management with secure cookies
  - Redis-backed nonce storage

#### 2. Intent Pipeline
- **Schema Types**: `balances.get`, `trade.swap`, `bridge.transfer`, `rewards.claim`
- **Flow**: Parse → Validate → Quote → Preview → Execute
- **Storage**: PostgreSQL with status tracking

#### 3. Read Layer
- **Primary**: Alchemy Portfolio & NFT APIs
- **Fallback**: Moralis (stub implementation)
- **Caching**: Redis with 30s TTL
- **Endpoint**: `/api/balances`

#### 4. DEX Integration
- **Primary**: 0x API for swap quotes
- **Fallback**: Uniswap (stub for future implementation)
- **Caching**: 15s TTL for quotes
- **Endpoints**: `/api/intents/quote`

#### 5. Transaction Preview & Safety
- **Simulation**: Tenderly API integration
- **Risk Assessment**: Automated risk level detection
- **Features**:
  - Decoded transaction calls
  - Token delta calculations
  - Gas estimates
  - Revert detection
- **Endpoint**: `/api/intents/preview`

#### 6. Rewards Aggregation
- **Platforms**: Galxe, RabbitHole, Layer3
- **Caching**: 120s TTL
- **Endpoint**: `/api/rewards`

## Database Schema

### Tables

1. **users** - User accounts indexed by wallet address
2. **sessions** - SIWE session records
3. **intents** - Intent processing history with status tracking
4. **limits** - Per-user spending and approval limits
5. **telemetry** - Event logging for observability

See `migrations/001_initial_schema.sql` for complete schema.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `SESSION_SECRET` - 32+ character secret for session encryption
- `ALCHEMY_API_KEY` - Alchemy API key for portfolio data
- `TENDERLY_API_KEY` - (Optional) Tenderly for simulations
- `GALXE_API_KEY`, `RABBITHOLE_API_KEY`, `LAYER3_API_KEY` - (Optional) Rewards APIs

### 3. Database Migration

Run the migration script to set up PostgreSQL:

```bash
psql $DATABASE_URL < migrations/001_initial_schema.sql
```

### 4. Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

### 5. Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Authentication

- `GET /api/siwe/nonce` - Generate SIWE nonce
- `POST /api/siwe/verify` - Verify signature and create session
  - Body: `{ message: string, signature: string }`
- `POST /api/siwe/logout` - Destroy session

### Balances

- `GET /api/balances?chainId=1&includeNFTs=true` - Fetch portfolio balances
  - Requires authentication
  - Returns: native balance, token balances, NFTs

### Intents

- `POST /api/intents/quote` - Get swap quote
  - Body: `TradeSwapIntent` schema
  - Returns: 0x quote data

- `POST /api/intents/preview` - Preview transaction with risks
  - Body: Any `Intent` schema
  - Returns: decoded calls, token deltas, risks, gas estimates

### Rewards

- `GET /api/rewards?platforms=galxe,rabbithole` - Aggregate rewards
  - Requires authentication
  - Returns: claimable rewards across platforms

## Intent Schemas

### balances.get
```json
{
  "type": "balances.get",
  "chains": [1, 137],
  "includeNFTs": true,
  "includeApprovals": false
}
```

### trade.swap
```json
{
  "type": "trade.swap",
  "fromToken": "0x...",
  "toToken": "0x...",
  "amount": "1000000",
  "chainId": 1,
  "slippage": 1,
  "useUniswapOnly": false
}
```

### bridge.transfer
```json
{
  "type": "bridge.transfer",
  "fromChainId": 1,
  "toChainId": 137,
  "token": "0x...",
  "amount": "1000000",
  "slippage": 1
}
```

### rewards.claim
```json
{
  "type": "rewards.claim",
  "platforms": ["galxe", "rabbithole", "layer3"],
  "rewardIds": ["reward-1", "reward-2"]
}
```

## Security Features

1. **SIWE Authentication**: Cryptographic wallet authentication
2. **Session Management**: Secure HTTP-only cookies with encryption
3. **Nonce Validation**: One-time use nonces with Redis expiry
4. **Transaction Simulation**: Pre-execution validation with Tenderly
5. **Risk Assessment**: Automated risk level detection
6. **Spending Limits**: Daily USD caps per user
7. **Approval Bounds**: Maximum approval amounts with expiry

## Observability

- **Logging**: Structured logs with Pino
- **Correlation IDs**: Request tracing across services
- **Telemetry**: Event logging to PostgreSQL
- **Caching Metrics**: Redis hit/miss tracking

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Database

- **PostgreSQL**: Use Neon, Supabase, or any PostgreSQL provider
- **Redis**: Use Upstash for serverless Redis

## Next Steps

### Future Enhancements

1. **Bridge Integration**: Complete LI.FI SDK integration
2. **Natural Language Parser**: Add ML-based intent parser
3. **Permit2 Support**: Implement efficient token approvals
4. **Gas Optimization**: Integrate Blocknative
5. **Frontend UI**: Build React interface for intent submission
6. **Webhook Events**: Real-time transaction status updates
7. **Multi-sig Support**: Add multi-signature wallet support
8. **Mobile App**: React Native version

## Testing

### API Testing

Use curl or Postman to test endpoints:

```bash
# Get nonce
curl http://localhost:3000/api/siwe/nonce

# Verify (requires SIWE signature)
curl -X POST http://localhost:3000/api/siwe/verify \
  -H "Content-Type: application/json" \
  -d '{"message": "...", "signature": "..."}'

# Get balances (requires auth cookie)
curl http://localhost:3000/api/balances?chainId=1 \
  -H "Cookie: potentia_ludi_session=..."
```

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR.
