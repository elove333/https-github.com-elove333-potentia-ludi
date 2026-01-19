# Quick Start Guide - Planner → Executor Pipeline

Get the Planner → Executor pipeline running in 5 minutes.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- `pg` (PostgreSQL client)
- `siwe` (Sign-In with Ethereum)
- `express` (Web server)
- `cors` (CORS middleware)

## Step 2: Setup Database

### Option A: Local PostgreSQL

```bash
# Create database
createdb potentia_ludi

# Run schema
psql -d potentia_ludi -f database/schema.sql
```

### Option B: Docker

```bash
# Start PostgreSQL container
docker run --name potentia-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=potentia_ludi \
  -p 5432:5432 \
  -d postgres:14

# Wait for container to start
sleep 5

# Run schema
docker exec -i potentia-postgres psql -U postgres -d potentia_ludi < database/schema.sql
```

## Step 3: Configure Environment

```bash
# Copy template
cp .env.example .env
```

**Minimal .env for testing (no external APIs needed):**

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/potentia_ludi
PORT=3001
FRONTEND_URL=http://localhost:3000
SESSION_SECRET=your-secret-here-change-in-production
```

**For production (with external APIs):**

Add these to your .env:
```env
ALCHEMY_API_KEY=your_key_here
MORALIS_API_KEY=your_key_here
OX_API_KEY=your_key_here
TENDERLY_ACCESS_KEY=your_key_here
BLOCKNATIVE_API_KEY=your_key_here
```

## Step 4: Start Services

Open two terminals:

**Terminal 1 - API Server:**
```bash
npm run api:dev
```

You should see:
```
🚀 Planner → Executor API server running on port 3001
📝 Health check: http://localhost:3001/health
🔐 SIWE endpoints: http://localhost:3001/api/siwe/*
🎯 Intent endpoints: http://localhost:3001/api/intents/*
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Step 5: Test the API

### Health Check

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "ok": true,
  "timestamp": "2024-01-19T15:30:00.000Z"
}
```

### Submit an Intent

```bash
curl -X POST http://localhost:3001/api/intents/submit \
  -H "Content-Type: application/json" \
  -d '{
    "input": "check my balance",
    "address": "0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4"
  }'
```

Expected response:
```json
{
  "ok": true,
  "intentId": "uuid-here",
  "intent": {
    "type": "balances.get",
    "takerAddress": "0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4",
    "chainId": 1
  },
  "status": "previewed",
  "preview": {
    "summary": "Fetching balances for 0x742d35...",
    "tokenDeltas": [],
    "gasCost": {
      "estimatedGas": "0",
      "gasPrice": "0",
      "totalCostEth": "0"
    }
  }
}
```

## Step 6: Run Tests

```bash
npm test
```

Expected output:
```
✓ tests/intentParser.test.ts (19)
   ✓ IntentParser (19)
     ✓ Balance queries (3)
     ✓ Swap intents (4)
     ✓ Bridge intents (1)
     ✓ Rewards intents (2)
     ✓ Validation (4)

Test Files  1 passed (1)
Tests  19 passed (19)
```

## Common Issues

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:** Make sure PostgreSQL is running:
```bash
# Check status
pg_ctl status

# Start if not running
pg_ctl start
```

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:** Change the port in .env:
```env
PORT=3002
```

### TypeScript Errors

```
Cannot find module 'pg' or its corresponding type declarations
```

**Solution:** Install dependencies:
```bash
npm install
```

## Next Steps

### 1. Integrate with Frontend

```typescript
import { PlannerExecutorClient } from './api/client';

const client = new PlannerExecutorClient('http://localhost:3001');
const result = await client.submitIntent('swap 100 USDC to ETH', address);
```

See `examples/INTEGRATION.md` for more examples.

### 2. Set Up External APIs

Get API keys from:
- [Alchemy](https://dashboard.alchemy.com/) - Balance and NFT data
- [0x](https://0x.org/docs) - Swap quotes
- [Tenderly](https://dashboard.tenderly.co/) - Transaction simulation
- [Blocknative](https://www.blocknative.com/) - Gas estimates

### 3. Deploy to Production

See `PLANNER_EXECUTOR_GUIDE.md` for production deployment guide.

## Architecture Overview

```
┌─────────────────┐
│   Frontend      │
│   (React)       │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│   API Server    │
│   (Express)     │
├─────────────────┤
│ • Intent Parser │
│ • Pipeline      │
│ • Auth (SIWE)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   Database      │
└─────────────────┘
```

## Documentation

- **IMPLEMENTATION_SUMMARY.md** - Complete overview
- **PLANNER_EXECUTOR_GUIDE.md** - Detailed implementation guide
- **api/README.md** - API documentation
- **database/README.md** - Database setup
- **examples/INTEGRATION.md** - Integration examples

## Support

If you encounter issues:
1. Check logs in the terminal
2. Verify database connection: `psql -d potentia_ludi -c "SELECT 1"`
3. Check environment variables: `cat .env`
4. Review the documentation files listed above

## Success!

If you see this, you're ready to go:

✅ Database connected
✅ API server running on port 3001
✅ Frontend running on port 3000
✅ Tests passing
✅ Health check returns OK

Start submitting intents! 🚀
