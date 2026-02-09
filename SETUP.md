# Local Development Setup Guide

This guide will help you set up the Conversational Web3 Wallet Hub for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 24+ LTS** (recommended) or Node.js 18+
  - Check version: `node --version`
  - Download from: https://nodejs.org/
  
- **npm 10+** or **pnpm 8+**
  - Check version: `npm --version`
  - Install pnpm: `npm install -g pnpm`
  
- **Docker** (for PostgreSQL and Redis)
  - Check version: `docker --version`
  - Download from: https://www.docker.com/products/docker-desktop

- **Git**
  - Check version: `git --version`

## Step 1: Clone the Repository

```bash
git clone https://github.com/elove333/https-github.com-elove333-potentia-ludi.git
cd https-github.com-elove333-potentia-ludi
```

## Step 2: Install Dependencies

Using npm:
```bash
npm install
```

Or using pnpm (recommended for faster installs):
```bash
pnpm install
```

## Step 3: Set Up Database Services

### Option A: Using Docker Compose (Recommended)

Create a `docker-compose.yml` file in the project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: potentia-postgres
    environment:
      POSTGRES_DB: potentia_ludi
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./lib/db/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: potentia-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

Start the services:
```bash
docker-compose up -d
```

Check status:
```bash
docker-compose ps
```

View logs:
```bash
docker-compose logs -f
```

### Option B: Manual Installation

#### PostgreSQL
1. Download and install PostgreSQL 16 from https://www.postgresql.org/download/
2. Create database:
   ```bash
   createdb potentia_ludi
   ```
3. Run schema:
   ```bash
   psql potentia_ludi < lib/db/schema.sql
   ```

#### Redis
1. Download and install Redis from https://redis.io/download
2. Start Redis server:
   ```bash
   redis-server
   ```

## Step 4: Configure Environment Variables

Copy the example environment file:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

### Minimum Required Variables
```env
# OpenAI (Required for conversational features)
OPENAI_API_KEY=sk-proj-your-key-here

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/potentia_ludi

# Redis
REDIS_URL=redis://localhost:6379

# Session Security
SESSION_SECRET=generate-a-random-32-char-string-here
JWT_SECRET=generate-another-random-32-char-string-here
```

### Optional but Recommended
```env
# Alchemy for reliable RPC access
ALCHEMY_API_KEY_MAINNET=your-key-here
ALCHEMY_API_KEY_POLYGON=your-key-here

# 0x API for DEX aggregation
ZEROX_API_KEY=your-key-here

# Tenderly for transaction simulation
TENDERLY_API_KEY=your-key-here
```

**Generate secure secrets:**
```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

## Step 5: Verify Setup

### Check Database Connection
```bash
npm run db:check
```

If you don't have this script yet, test manually:
```bash
psql postgresql://postgres:postgres@localhost:5432/potentia_ludi -c "SELECT version();"
```

### Check Redis Connection
```bash
redis-cli ping
```
Should return: `PONG`

### Check Node.js Version
```bash
node --version
```
Should be v18+ (v24+ recommended)

## Step 6: Run Database Migrations

If using an ORM like Prisma:
```bash
npm run prisma:generate
npm run prisma:migrate
```

Or manually apply schema:
```bash
psql $DATABASE_URL < lib/db/schema.sql
```

## Step 7: Start Development Server

### Current Vite Setup
```bash
npm run dev
```

The app will be available at: http://localhost:5173

### Future Next.js Setup
Once Next.js is integrated:
```bash
npm run dev
```

The app will be available at: http://localhost:3000

## Step 8: Verify Installation

Open your browser and navigate to the development URL. You should see:
- Current: The gaming wallet interface
- Future: The conversational interface with text input

## Troubleshooting

### Port Already in Use

If port 5173 (Vite) or 3000 (Next.js) is already in use:
```bash
# Find process using the port (Mac/Linux)
lsof -i :5173

# Kill the process
kill -9 <PID>

# Or use a different port
npm run dev -- --port 3001
```

### Database Connection Failed

1. Check if PostgreSQL is running:
   ```bash
   docker-compose ps postgres
   # or
   pg_isready -h localhost -p 5432
   ```

2. Verify DATABASE_URL in `.env.local`
3. Check PostgreSQL logs:
   ```bash
   docker-compose logs postgres
   ```

### Redis Connection Failed

1. Check if Redis is running:
   ```bash
   docker-compose ps redis
   # or
   redis-cli ping
   ```

2. Verify REDIS_URL in `.env.local`

### OpenAI API Errors

1. Verify your API key is correct
2. Check your OpenAI account has credits
3. Ensure you have access to the GPT-4 API (may require upgraded account)

### TypeScript Errors

```bash
# Rebuild TypeScript
npm run build

# Or check for errors
npx tsc --noEmit
```

### Dependency Issues

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Or with pnpm
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Development Workflow

### Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Run tests (when available)
npm run test

# Check types
npm run type-check
```

### Database Management

```bash
# Connect to database
psql $DATABASE_URL

# Backup database
pg_dump $DATABASE_URL > backup.sql

# Restore database
psql $DATABASE_URL < backup.sql

# Reset database
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql $DATABASE_URL < lib/db/schema.sql
```

### Redis Management

```bash
# Connect to Redis
redis-cli

# Monitor all commands
redis-cli MONITOR

# Flush all data (BE CAREFUL!)
redis-cli FLUSHALL

# Get all keys matching pattern
redis-cli KEYS "gas:prices:*"
```

### Import Aliases

The project uses path aliases for cleaner imports:

```typescript
// Use @ alias to import from src directory
import App from '@/components/App';
import { useStore } from '@/store';

// Use @/app alias for app directory imports
import Home from '@/app/page';
```

**Configuration:**
- Vite alias configuration: `vite.config.ts`
- TypeScript path mapping: `tsconfig.json`

**Available aliases:**
- `@/*` → `./src/*`
- `@/app/*` → `./src/app/*`

## Next Steps

1. **Explore the Codebase**
   - Review [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
   - Check [README.md](./README.md) for feature overview
   - Browse `lib/workflows/` for workflow implementations

2. **Start Contributing**
   - Pick an issue from GitHub Issues
   - Create a feature branch
   - Make your changes
   - Submit a pull request

3. **Extend the System**
   - Add new workflow modules
   - Integrate additional APIs
   - Improve intent recognition
   - Enhance safety validations

## Getting API Keys

### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Create new API key
4. Add to `.env.local` as `OPENAI_API_KEY`

### Alchemy
1. Go to https://dashboard.alchemy.com/
2. Sign up for free account
3. Create apps for each chain (Ethereum, Polygon, etc.)
4. Copy API keys to `.env.local`

### 0x Protocol
1. Go to https://0x.org/
2. Request API access
3. Add API key to `.env.local`

### Tenderly
1. Go to https://dashboard.tenderly.co/
2. Create account and project
3. Get API key from settings
4. Add to `.env.local`

## Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Viem Documentation](https://viem.sh/)
- [Wagmi Documentation](https://wagmi.sh/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/docs/)
- [Next.js Documentation](https://nextjs.org/docs) (for future migration)

## Support

If you encounter issues:
1. Check this guide thoroughly
2. Search existing GitHub Issues
3. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Your environment (OS, Node version, etc.)
   - Relevant logs

## Security Notes

⚠️ **Important Security Practices:**
- Never commit `.env.local` to version control
- Use different API keys for development and production
- Rotate API keys regularly
- Keep dependencies updated
- Review security advisories regularly
- Use environment-specific database credentials
- Enable Redis authentication in production
