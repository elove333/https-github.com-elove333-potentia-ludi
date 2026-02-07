# Supabase Integration for Potentia Ludi

This directory contains the Supabase integration for Potentia Ludi, providing centralized data storage, real-time updates, secure authentication, and file management for the Web3 gaming wallet hub.

## 📦 Features

### 1. **Database Storage**
- Player profiles and multi-wallet management
- Reward tracking across chains
- NFT collection management
- Game session tracking and analytics

### 2. **Real-Time Updates**
- Live notifications for new rewards
- Wallet balance change alerts
- Game session updates
- Dynamic dashboard without page reloads

### 3. **Authentication**
- Email/password authentication
- Magic link (passwordless) login
- OAuth providers (Google, Discord, GitHub)
- Wallet address linking
- Secure session management

### 4. **File Storage**
- NFT metadata uploads
- Game clip and screenshot storage
- Wallet activity snapshots
- Player-generated content management

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Docker and Docker Compose (for local development)

### Installation

1. **Install dependencies:**
```bash
npm install
```

The following Supabase packages are included:
- `@supabase/supabase-js` - Main Supabase client
- `@supabase/realtime-js` - Real-time subscriptions
- `@supabase/auth-js` - Authentication
- `@supabase/storage-js` - File storage
- `@supabase/functions-js` - Serverless functions

2. **Set up environment variables:**

Copy the `.env.example` file and add your Supabase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Get these values from your [Supabase project dashboard](https://app.supabase.com/).

### Local Development with Docker

For local testing without a cloud Supabase instance, use the provided Docker Compose setup:

1. **Start services:**
```bash
docker-compose up -d
```

This starts:
- PostgreSQL database (port 5432)
- PostgREST API (port 3000)
- Redis for caching (port 6379)

2. **Initialize database:**

The database schema is automatically applied on first startup. To manually apply:
```bash
docker exec -i potentia-postgres psql -U postgres -d potentia_ludi < supabase/schema.sql
```

3. **Stop services:**
```bash
docker-compose down
```

To remove data volumes:
```bash
docker-compose down -v
```

## 📚 Usage Examples

### Authentication

```typescript
import { authManager } from './lib/supabase/auth';

// Sign up with email and wallet
const { user, error } = await authManager.signUp({
  email: 'player@example.com',
  password: 'SecurePassword123!',
  walletAddress: '0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4',
  username: 'ProGamer',
});

// Sign in
await authManager.signIn({
  email: 'player@example.com',
  password: 'SecurePassword123!',
});

// Link additional wallet
await authManager.linkWalletToUser('0x1234...');
```

### Fetching Data

```typescript
import { supabaseHelpers } from './lib/supabase/client';

// Get player by wallet
const player = await supabaseHelpers.getPlayerByWallet('0x742d35...');

// Get unclaimed rewards
const rewards = await supabaseHelpers.getUnclaimedRewards(player.id);

// Get player's wallets
const wallets = await supabaseHelpers.getPlayerWallets(player.id);

// Get player's NFTs
const nfts = await supabaseHelpers.getPlayerNFTs(player.id);
```

### Real-Time Subscriptions

```typescript
import { realtimeSubscriptions } from './lib/supabase/realtime';

// Subscribe to new rewards
const unsubscribe = realtimeSubscriptions.subscribeToRewards(
  playerId,
  (reward) => {
    console.log('New reward:', reward);
    // Update UI with new reward
  }
);

// Subscribe to game sessions
realtimeSubscriptions.subscribeToGameSessions(
  playerId,
  (session) => {
    console.log('Game session update:', session);
  }
);

// Clean up when done
unsubscribe();
```

### File Storage

```typescript
import { storageManager } from './lib/supabase/storage';

// Upload NFT metadata
const result = await storageManager.uploadNFTMetadata(
  playerId,
  tokenId,
  { name: 'Cool NFT', description: 'A cool NFT' }
);

// Upload game clip
const clipFile = new File([...], 'clip.mp4');
await storageManager.uploadGameClip(playerId, clipId, clipFile);

// Get public URL
const url = storageManager.getPublicUrl('game-content', 'path/to/file');
```

## 📖 Detailed Examples

Complete working examples are available in the `examples/supabase/` directory:

1. **`authentication.example.ts`** - Authentication flows
   - Sign up with email/password
   - Sign in with magic link
   - Link wallet addresses
   - OAuth integration

2. **`fetchData.example.ts`** - Data fetching patterns
   - Query player profiles
   - Fetch wallets and rewards
   - Get NFT collections
   - Analytics and summaries

3. **`realtimeUpdates.example.ts`** - Real-time subscriptions
   - Subscribe to new rewards
   - Listen to wallet updates
   - Track game sessions
   - Build notification systems

Run examples:
```bash
# Install ts-node if needed
npm install -g ts-node

# Run an example
ts-node examples/supabase/authentication.example.ts
```

## 🗄️ Database Schema

The database includes the following tables:

- **`players`** - Player profiles linked to wallet addresses
- **`wallets`** - Multi-wallet support per player
- **`rewards`** - Token rewards across all chains
- **`game_sessions`** - Gaming activity tracking
- **`nft_collections`** - NFT ownership records

See `supabase/schema.sql` for the complete schema with indexes and RLS policies.

## 🔒 Security

### Row Level Security (RLS)

All tables have RLS policies enabled to ensure:
- Users can only access their own data
- Authentication is required for sensitive operations
- Wallet addresses are properly validated

### API Security

- Use `SUPABASE_ANON_KEY` for client-side operations (public access)
- Use `SUPABASE_SERVICE_ROLE_KEY` for server-side operations (full access)
- Never expose service role key in client code

## 🔗 Integration with Existing Features

### Game Detection Integration

When a game is detected, create a game session:

```typescript
import { supabaseHelpers } from './lib/supabase/client';

const session = await supabaseHelpers.createGameSession(
  playerId,
  'Axie Infinity',
  'https://axieinfinity.com'
);

// When game ends
await supabaseHelpers.endGameSession(
  session.id,
  transactionCount,
  gasSpent,
  rewardsEarned
);
```

### Reward Tracking Integration

When rewards are detected (e.g., from Alchemy webhook):

```typescript
await supabaseHelpers.addReward(
  playerId,
  walletId,
  chainId,
  tokenAddress,
  tokenSymbol,
  amount,
  'alchemy_webhook',
  usdValue
);
```

Real-time subscribers will automatically receive notifications.

## 🧪 Testing

### Local Testing

Use the Docker Compose setup for local testing:

```bash
# Start services
docker-compose up -d

# For local testing
export SUPABASE_URL=http://localhost:3000
export SUPABASE_ANON_KEY=your-local-anon-key-here

# Run tests
npm test
```

### Production Testing

Use your Supabase project for production testing:

1. Create tables using the SQL editor in Supabase dashboard
2. Set up storage buckets via the dashboard
3. Configure authentication providers
4. Test with real data

## 📊 Monitoring

### Supabase Dashboard

Monitor your integration via the [Supabase Dashboard](https://app.supabase.com/):
- Database queries and performance
- Authentication activity
- Storage usage
- Real-time connections
- API logs

### Application Logging

Enable debug logging:

```typescript
// In your code
console.log('Supabase operation:', { playerId, action: 'fetch_rewards' });
```

## 🚨 Troubleshooting

### Connection Issues

If you can't connect to Supabase:

1. Check environment variables are set correctly
2. Verify your Supabase project is active
3. Check network connectivity
4. Review API logs in Supabase dashboard

### Real-Time Not Working

If real-time subscriptions aren't firing:

1. Ensure Realtime is enabled in your Supabase project
2. Check RLS policies allow the operation
3. Verify the subscription filter matches your data
4. Check browser console for errors

### Authentication Errors

If authentication fails:

1. Verify email confirmation is disabled for testing (or check email)
2. Check password meets requirements
3. Verify OAuth providers are configured correctly
4. Review auth logs in Supabase dashboard

## 📝 Best Practices

1. **Use TypeScript types** - Leverage the provided database types for type safety
2. **Handle errors gracefully** - Always check for errors in responses
3. **Clean up subscriptions** - Unsubscribe when components unmount
4. **Use RLS policies** - Don't bypass security with service role key in client
5. **Batch operations** - Use transactions for related database operations
6. **Cache when possible** - Use Redis or local storage for frequently accessed data

## 🔄 Migration from Existing Database

If you have an existing PostgreSQL database, migrate to Supabase:

1. Export your existing schema and data
2. Adapt the schema to match Supabase conventions
3. Import data using Supabase migrations
4. Update your application to use Supabase client
5. Test thoroughly before switching production traffic

## 📦 Production Deployment

### Environment Setup

For production:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
```

### Performance Optimization

1. **Enable connection pooling** for high-traffic applications
2. **Use database indexes** (already included in schema)
3. **Implement caching** for frequently accessed data
4. **Batch real-time subscriptions** to reduce connections
5. **Use CDN** for static files in storage

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- Additional helper functions for common operations
- More example scripts and use cases
- Performance optimizations
- Enhanced error handling
- Additional RLS policies for advanced security

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Realtime Subscriptions](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
