# Database Setup

## PostgreSQL Schema

This directory contains the PostgreSQL database schema for the Planner → Executor pipeline.

## Setup Instructions

### 1. Install PostgreSQL

Make sure you have PostgreSQL 14+ installed:

```bash
# macOS
brew install postgresql@14

# Ubuntu/Debian
sudo apt-get install postgresql-14

# Docker
docker run --name potentia-postgres -e POSTGRES_PASSWORD=yourpassword -p 5432:5432 -d postgres:14
```

### 2. Create Database

```bash
createdb potentia_ludi
```

Or with psql:

```sql
CREATE DATABASE potentia_ludi;
```

### 3. Run Schema

```bash
psql -d potentia_ludi -f database/schema.sql
```

Or:

```sql
\i database/schema.sql
```

## Database Tables

### users
- Stores wallet addresses and ENS names
- Primary key: `id` (bigserial)
- Unique constraint on `address`

### sessions
- SIWE authentication sessions
- Tracks nonce, expiration, user agent, and IP
- Foreign key to `users.id`

### intents
- User intents (balances.get, trade.swap, bridge.transfer, rewards.claim)
- Stores intent JSON, preview data, and execution status
- Status values: `planned`, `preflight`, `previewed`, `building`, `submitted`, `completed`, `failed`

### limits
- Per-user spending limits and allowlists
- Tracks daily USD cap and approval limits
- Automatic daily reset via `reset_daily_limits()` function

### telemetry
- Event logging for analytics
- Stores arbitrary JSON payloads
- Indexed for fast querying by user, event type, and time

## Environment Variables

Set these in your `.env` file:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/potentia_ludi
```

## Maintenance

### Reset Daily Limits

Run this daily via cron or a scheduled job:

```sql
SELECT reset_daily_limits();
```

### Clean Old Sessions

```sql
DELETE FROM sessions WHERE expires_at < NOW();
```

### Clean Old Telemetry

Keep last 90 days:

```sql
DELETE FROM telemetry WHERE created_at < NOW() - INTERVAL '90 days';
```
