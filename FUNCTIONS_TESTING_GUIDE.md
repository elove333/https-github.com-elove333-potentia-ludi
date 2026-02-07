# Functions Architecture Testing Guide

This guide explains how to test the newly implemented Functions architecture for Potentia-Ludi.

## Architecture Overview

The Functions architecture includes:

### API Endpoints (Server-Side)

1. **Config Function** (`/api/config`)
   - Verifies `ALCHEMY_API_KEY` configuration
   - Returns webhook URL derived from `APP_URL`
   - Debug logging with ✅/❌ emojis

2. **Alchemy Functions**
   - `/api/alchemy/get-token-balances` - Fetches wallet token balances
   - `/api/alchemy/setup-webhook` - Configures Alchemy webhooks

3. **Webhook Handler** (`/api/webhooks/game-event-transfer`)
   - Receives Alchemy webhooks
   - Validates wallet ownership and game contracts
   - Saves events to database

4. **Game Management** (`/api/games/seed`)
   - Seeds database with popular games
   - Games include: Axie Infinity, The Sandbox, Gods Unchained, Decentraland, Illuvium, Gala Games

5. **Test Function** (`/api/webhooks/test`)
   - Simulates Alchemy webhook for testing
   - Creates mock event data

### UI Page (Client-Side)

- `app/page.tsx` with `"use client"` directive
- Interactive buttons for all Functions APIs
- Emoji-coded debugging logs
- Loading/error/success state management

## Prerequisites

Before testing, ensure you have:

1. **PostgreSQL Database** - Running and accessible
2. **Environment Variables** - Configured in `.env` file
3. **Dependencies** - Installed via `npm install`

### Required Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=potentia_ludi
DB_USER=postgres
DB_PASSWORD=your_password

# Alchemy API Keys
ALCHEMY_API_KEY_MAINNET=your_key
ALCHEMY_API_KEY_POLYGON=your_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3001
APP_URL=http://localhost:3001
```

## Database Setup

1. **Create Database**
   ```bash
   createdb potentia_ludi
   ```

2. **Run Schema**
   ```bash
   psql -d potentia_ludi -f lib/db/schema.sql
   ```

   The schema includes:
   - `users` table
   - `games` table (NEW)
   - `game_events` table (NEW)
   - Other existing tables

## Starting the API Server

Currently, the API server needs to be started manually. Add this to your `package.json` scripts:

```json
{
  "scripts": {
    "api": "node dist/api/api/server.js",
    "api:dev": "tsc --project tsconfig.api.json && node dist/api/api/server.js"
  }
}
```

Note: The `dist/api/api` path structure is due to the TypeScript configuration where the API files are in the `api/` directory and compile to `dist/api/`, resulting in the duplicated `api` in the path.

Then run:

```bash
# Build and start API server
npm run api:dev
```

The server will start on port 3001 (or PORT environment variable).

## Testing the API Endpoints

### 1. Test Config Endpoint

```bash
curl http://localhost:3001/api/config
```

Expected response:
```json
{
  "configured": true,
  "webhookURL": "http://localhost:3001/api/webhooks/game-event-transfer",
  "alchemyConfigured": true
}
```

Console output should show:
```
🔧 Config verification requested
✅ ALCHEMY_API_KEY verified
✅ Webhook URL: http://localhost:3001/api/webhooks/game-event-transfer
```

### 2. Test Seed Games

```bash
curl -X POST http://localhost:3001/api/games/seed
```

Expected console output:
```
🌱 Starting game database seeding...
🗑️ Cleared existing games
🎮 Processing: Axie Infinity (SLP) on ronin
  ✅ Saved with ID: [uuid]
🎮 Processing: The Sandbox (SAND) on ethereum
  ✅ Saved with ID: [uuid]
...
✅ Game database seeded successfully
💾 Total games seeded: 6
```

### 3. Test Get Token Balances

```bash
curl -X POST http://localhost:3001/api/alchemy/get-token-balances \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4",
    "chainId": 137
  }'
```

Expected console output:
```
💰 Get token balances requested
🔗 Address: 0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4
🔗 Chain ID: 137
🔗 Using Alchemy network: polygon-mainnet
🔗 Calling Alchemy API...
✅ Alchemy API response received
💰 Token balances count: [number]
💰 Non-zero balances: [number]
```

### 4. Test Webhook Simulation

```bash
curl -X POST http://localhost:3001/api/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4",
    "contractAddress": "0x3845badade8e6dff049820680d1f14bd3903a5d0",
    "chainId": 1
  }'
```

Expected console output:
```
🧪 Test webhook simulation started
🔗 Wallet: 0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4
🔗 Contract: 0x3845badade8e6dff049820680d1f14bd3903a5d0
🔗 Chain ID: 1
📦 Mock webhook payload created
🔗 Transaction hash: 0x...
🔗 Sending to webhook handler: http://localhost:3001/api/webhooks/game-event-transfer
✅ Webhook handler responded
💾 Response: {...}
✅ Test webhook simulation complete
```

## Testing the UI

1. **Start the Development Server**
   ```bash
   npm run dev
   ```

2. **Open Browser**
   Navigate to `http://localhost:5173` (or the port shown by Vite)

3. **Test Each Button**
   
   - **🔧 Check Config**: Verifies API configuration
     - Console shows: `🔧 Check Config button clicked`
     - Success message displays webhook URL
   
   - **🌱 Seed Games**: Seeds the database with games
     - Console shows: `🌱 Seed Games button clicked`
     - Success message shows count of seeded games
   
   - **💰 Get Balances**: Fetches token balances
     - Console shows: `💰 Get Token Balances button clicked`
     - Success message shows token count
   
   - **🔗 Setup Webhook**: Prepares webhook configuration
     - Console shows: `🔗 Setup Webhook button clicked`
     - Success message with instructions
   
   - **🧪 Test Webhook**: Simulates webhook event
     - Console shows: `🧪 Test Webhook button clicked`
     - Success message confirms test completion

4. **Verify State Management**
   - Loading state shows: ⏳ message
   - Error state shows: ❌ message in red
   - Success state shows: ✅ message in green

## Debugging Features

### Emoji Legend

- 🔗: Connection and API calls
- 🎮: Game-related processes
- 💰: Balance operations
- 💾: Database operations
- 🌱: Seeding operations
- 🔧: Configuration
- 🧪: Testing
- ✅: Success messages
- ❌: Error messages
- ⏳: Loading state
- 📦: Payload/data operations
- 👤: User operations

### Console Logging

All API endpoints include comprehensive console logging:
- Request parameters
- Processing steps
- API responses
- Database operations
- Success/error states

Example from game seeding:
```
🌱 Seed Games button clicked
🌱 Starting game database seeding...
🗑️ Cleared existing games
🎮 Processing: Axie Infinity (SLP) on ronin
  ✅ Saved with ID: 550e8400-e29b-41d4-a716-446655440000
🎮 Processing: The Sandbox (SAND) on ethereum
  ✅ Saved with ID: 550e8400-e29b-41d4-a716-446655440001
✅ Game database seeded successfully
💾 Total games seeded: 6
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD in .env
   - Run schema.sql to create tables

2. **Alchemy API Error**
   - Verify ALCHEMY_API_KEY_* variables are set
   - Check API key is valid at https://dashboard.alchemy.com/

3. **Port Already in Use**
   - Change PORT environment variable
   - Update APP_URL and NEXT_PUBLIC_APP_URL accordingly

4. **CORS Errors**
   - Ensure API server CORS middleware is configured
   - Check APP_URL matches the frontend URL

## Running Tests

If you have vitest tests configured:

```bash
npm test
```

## Building for Production

1. **Build API**
   ```bash
   npx tsc --project tsconfig.api.json
   ```

2. **Build Frontend**
   ```bash
   npm run build
   ```

3. **Start Production Server**
   ```bash
   NODE_ENV=production node dist/api/api/server.js
   ```

## Next Steps

1. **Integration Testing**: Create integration tests for API endpoints
2. **E2E Testing**: Add end-to-end tests using Playwright or Cypress
3. **Database Migrations**: Set up migration system for schema changes
4. **Webhook Security**: Add webhook signature verification
5. **Rate Limiting**: Implement rate limiting for API endpoints
6. **Monitoring**: Add monitoring and alerting for production

## Additional Resources

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Full system architecture
- [SETUP.md](./SETUP.md) - Development environment setup
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [Alchemy Webhooks Documentation](https://docs.alchemy.com/docs/webhooks)
