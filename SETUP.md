# Local Development Setup Guide

This guide will help you set up the Conversational Web3 Wallet Hub for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 20+ (Node.js 24+ recommended)
  - Check version: `node --version`
  - Download: https://nodejs.org/

- **npm**: Version 8+ (usually comes with Node.js)
  - Check version: `npm --version`

- **PostgreSQL**: Version 15+
  - Check version: `psql --version`
  - Download: https://www.postgresql.org/download/

- **Redis**: Version 7+
  - Check version: `redis-server --version`
  - Download: https://redis.io/download/

- **Git**: For version control
  - Check version: `git --version`

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone https://github.com/elove333/https-github.com-elove333-potentia-ludi.git
cd https-github.com-elove333-potentia-ludi
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React 18 & TypeScript
- Ethers.js, Wagmi, Viem for Web3
- Zustand for state management
- Vite for building

### 3. Setup PostgreSQL Database

#### Create Database

```bash
# Start PostgreSQL (if not running)
# macOS/Linux:
sudo service postgresql start
# or
brew services start postgresql

# Windows:
# Start PostgreSQL service from Services

# Create database
createdb potentia_ludi
```

#### Run Schema

```bash
# Initialize database schema
psql potentia_ludi -f src/backend/database/schema.sql
```

#### Verify Database

```bash
# Connect to database
psql potentia_ludi

# List tables
\dt

# You should see tables like:
# - intents
# - transaction_cache
# - user_preferences
# - price_cache
# - balance_cache
# etc.

# Exit psql
\q
```

### 4. Setup Redis

#### Start Redis Server

```bash
# Start Redis
redis-server

# Or start as background service
# macOS/Linux:
redis-server --daemonize yes

# Windows:
# Install Redis using WSL or Docker
```

#### Verify Redis

```bash
# Test Redis connection
redis-cli ping
# Should return: PONG

# Check Redis is running
redis-cli info server
```

### 5. Configure Environment Variables

#### Create .env file

```bash
# Copy example environment file
cp .env.example .env
```

#### Edit .env file

Open `.env` in your editor and configure:

**Required:**
```env
# OpenAI API Key (get from https://platform.openai.com/)
OPENAI_API_KEY=sk-your-key-here

# Database
DATABASE_URL=postgresql://localhost:5432/potentia_ludi

# Redis
REDIS_URL=redis://localhost:6379
```

**Optional but Recommended:**
```env
# RPC endpoints (get free from Alchemy, Infura, or QuickNode)
RPC_URL_ETHEREUM=https://eth-mainnet.g.alchemy.com/v2/your-key
RPC_URL_POLYGON=https://polygon-mainnet.g.alchemy.com/v2/your-key

# Coinbase integration
NEXT_PUBLIC_CDP_API_KEY=your-coinbase-key

# Price feeds
COINGECKO_API_KEY=your-coingecko-key
```

### 6. Install Additional Dependencies (Optional)

For full conversational AI functionality, install:

```bash
# OpenAI SDK
npm install openai

# PostgreSQL client
npm install pg @types/pg

# Redis client
npm install redis

# Additional utilities
npm install dotenv
```

### 7. Run Database Migrations (if any)

```bash
# Currently no migrations needed as schema.sql creates everything
# Future migrations will be in src/backend/database/migrations/
```

### 8. Start Development Server

```bash
# Start the development server
npm run dev
```

The application will be available at: http://localhost:3000

### 9. Verify Setup

Open http://localhost:3000 in your browser and check:

✅ Page loads without errors
✅ Wallet connection works
✅ UI components render correctly

Check console for any errors related to:
- Database connection
- Redis connection
- OpenAI API

## Development Workflow

### Running the Application

```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Quality

```bash
# Run linter
npm run lint

# Run tests (when available)
npm test
```

### Database Management

```bash
# Connect to database
psql potentia_ludi

# Common queries
SELECT * FROM intents ORDER BY created_at DESC LIMIT 10;
SELECT * FROM user_preferences;

# Clear cache tables (development only)
DELETE FROM balance_cache;
DELETE FROM price_cache;
```

### Redis Management

```bash
# Connect to Redis CLI
redis-cli

# Common commands
KEYS potentia:*          # List all keys
GET potentia:balance:*   # Get specific key
FLUSHALL                 # Clear all cache (dev only)
```

## Troubleshooting

### PostgreSQL Connection Issues

**Error:** "could not connect to server"
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL
sudo service postgresql start
```

**Error:** "database does not exist"
```bash
# Create the database
createdb potentia_ludi
```

### Redis Connection Issues

**Error:** "Redis connection refused"
```bash
# Check if Redis is running
redis-cli ping

# Start Redis
redis-server
```

### Node.js Version Issues

**Error:** "unsupported engine"
```bash
# Check Node version
node --version

# Install correct version using nvm
nvm install 20
nvm use 20
```

### Port Already in Use

**Error:** "Port 3000 is already in use"
```bash
# Find and kill process using port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Missing Environment Variables

**Error:** "OPENAI_API_KEY is not defined"
```bash
# Make sure .env file exists
ls -la .env

# Check environment variables are loaded
cat .env
```

## Testing the Conversational Features

### Test Natural Language Queries

Once setup is complete, try these commands in the chat interface:

```
"What's my balance?"
"Show my USDC balance on Polygon"
"Swap 1 ETH for USDC"
"Bridge 100 MATIC to Ethereum"
"Show my transaction history"
```

### Check Database for Intents

```sql
-- Connect to database
psql potentia_ludi

-- View recent intents
SELECT 
  raw_message, 
  parsed_intent->>'intent' as intent_type,
  status,
  created_at
FROM intents
ORDER BY created_at DESC
LIMIT 10;
```

### Check Redis Cache

```bash
# Connect to Redis
redis-cli

# View cached balances
KEYS potentia:balance:*

# View cached prices
KEYS potentia:price:*
```

## Next Steps

Now that your development environment is set up:

1. **Read the Architecture**: Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
2. **Explore Workflows**: Check `src/workflows/` for implementation examples
3. **Review Types**: See `src/workflows/*/types.ts` for data structures
4. **Implement Features**: Follow patterns in existing workflows
5. **Test Changes**: Use the chat interface to test your implementations

## Development Best Practices

### Code Style
- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Description of changes"

# Push to GitHub
git push origin feature/your-feature-name
```

### Testing
- Test with real wallet connections
- Verify database queries work
- Check Redis caching is effective
- Test error handling

## Getting Help

If you encounter issues:

1. Check this guide for troubleshooting steps
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md) for design details
3. Check the [README.md](./README.md) for additional information
4. Open an issue on GitHub with:
   - Error message
   - Steps to reproduce
   - Your environment details (OS, Node version, etc.)

## Additional Resources

- **OpenAI API**: https://platform.openai.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Redis Docs**: https://redis.io/docs/
- **Ethers.js**: https://docs.ethers.org/v6/
- **Viem**: https://viem.sh/
- **Wagmi**: https://wagmi.sh/

---

Happy coding! 🚀
