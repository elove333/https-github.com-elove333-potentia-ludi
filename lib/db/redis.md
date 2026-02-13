# Redis Cache Structure
# Documentation for Redis caching strategy in Conversational Web3 Wallet Hub

## Key Patterns

### Gas Prices (30s TTL)
Pattern: `gas:prices:{chainId}`
Type: Hash
Fields:
  - fast: string (wei as string)
  - standard: string (wei)
  - slow: string (wei)
  - baseFee: string (wei, for EIP-1559)
  - timestamp: number (unix timestamp)

Example:
```
HSET gas:prices:1 fast "50000000000" standard "40000000000" slow "30000000000" baseFee "25000000000" timestamp "1705678000"
EXPIRE gas:prices:1 30
```

### Token Balances (30s TTL)
Pattern: `balance:{address}:{chainId}:{tokenAddress}`
Type: String
Value: JSON string
```json
{
  "balance": "1000000000000000000",
  "decimals": 18,
  "symbol": "USDC",
  "name": "USD Coin",
  "timestamp": 1705678000
}
```

Example:
```
SET balance:0x123...:137:0x2791... '{"balance":"1000000000","decimals":6,"symbol":"USDC"}'
EXPIRE balance:0x123...:137:0x2791... 30
```

### Swap Quotes (10s TTL)
Pattern: `quote:swap:{fromToken}:{toToken}:{amount}:{chainId}`
Type: String
Value: JSON string with complete quote data
```json
{
  "fromToken": "0x...",
  "toToken": "0x...",
  "fromAmount": "1000000000000000000",
  "toAmount": "2000000000",
  "minOutput": "1980000000",
  "gasEstimate": "150000",
  "priceImpact": 0.5,
  "route": [...],
  "timestamp": 1705678000
}
```

Example:
```
SET quote:swap:0xA0b...:0x2791...:1000000000000000000:137 '{"fromAmount":"1000000000000000000",...}'
EXPIRE quote:swap:0xA0b...:0x2791...:1000000000000000000:137 10
```

### NFT Metadata (1h TTL)
Pattern: `nft:{chainId}:{contract}:{tokenId}`
Type: String
Value: JSON string
```json
{
  "name": "Bored Ape #1234",
  "image": "ipfs://...",
  "attributes": [...],
  "collection": "Bored Ape Yacht Club",
  "timestamp": 1705678000
}
```

Example:
```
SET nft:1:0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D:1234 '{"name":"Bored Ape #1234",...}'
EXPIRE nft:1:0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D:1234 3600
```

### User Conversation Context (Session Duration)
Pattern: `context:{userId}:{conversationId}`
Type: String
Value: JSON string with conversation state
```json
{
  "messages": [...],
  "lastIntent": {...},
  "metadata": {
    "lastChain": 137,
    "lastToken": "USDC",
    "preferredSlippage": 100
  },
  "timestamp": 1705678000
}
```

Example:
```
SET context:user123:conv456 '{"messages":[...],...}'
EXPIRE context:user123:conv456 3600
```

### Token Price (5min TTL)
Pattern: `price:{chainId}:{tokenAddress}:usd`
Type: String
Value: Price in USD as string
```
"1.00"
```

Example:
```
SET price:1:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48:usd "1.00"
EXPIRE price:1:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48:usd 300
```

### Rate Limiting (Per User)
Pattern: `ratelimit:{userId}:{action}`
Type: String (counter)
Value: Number of actions in current window

Example:
```
INCR ratelimit:user123:intent
EXPIRE ratelimit:user123:intent 60
```

Rate limits:
- Intent processing: 60/minute
- Transaction submission: 10/minute
- API calls: varies by endpoint

### Session Tokens (Session Duration)
Pattern: `session:{sessionToken}`
Type: String
Value: JSON string with session data
```json
{
  "userId": "user123",
  "walletAddress": "0x123...",
  "expiresAt": 1705678000,
  "createdAt": 1705674400
}
```

Example:
```
SET session:abc123xyz... '{"userId":"user123",...}'
EXPIRE session:abc123xyz... 86400
```

### ENS Name Resolution (1 day TTL)
Pattern: `ens:{name}`
Type: String
Value: Ethereum address

Example:
```
SET ens:vitalik.eth "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
EXPIRE ens:vitalik.eth 86400
```

### Bridge Status (Until completion)
Pattern: `bridge:{sourceTxHash}`
Type: Hash
Fields:
  - status: string (pending|relaying|completed|failed)
  - sourceChain: string
  - destinationChain: string
  - destinationTxHash: string (when available)
  - estimatedCompletion: string (ISO timestamp)

Example:
```
HSET bridge:0xabc... status "relaying" sourceChain "137" destinationChain "42161"
EXPIRE bridge:0xabc... 7200
```

## Cache Invalidation Strategies

### Proactive Invalidation
- On transaction confirmation, invalidate related balance cache
- On new block, invalidate gas price cache
- On quote execution, delete the quote cache

### Time-based Expiration
- Short TTL for volatile data (gas prices, quotes)
- Medium TTL for semi-stable data (balances, prices)
- Long TTL for static data (NFT metadata, ENS)

### Event-driven Invalidation
- Listen to blockchain events
- Invalidate caches when relevant events detected
- Use pub/sub for multi-instance coordination

## Cache Warming

### Critical Data
Pre-populate cache for:
- Popular token prices
- Common token pairs for swaps
- User's active wallet balances

### Strategy
```typescript
// On user login
async function warmCache(userId: string, walletAddress: string) {
  // Fetch and cache balances for active chains
  const chains = [1, 137, 42161];
  await Promise.all(
    chains.map(chain => 
      fetchAndCacheBalance(walletAddress, chain)
    )
  );
  
  // Fetch and cache gas prices
  await Promise.all(
    chains.map(chain => 
      fetchAndCacheGasPrices(chain)
    )
  );
}
```

## Memory Management

### Eviction Policy
Use `allkeys-lru` policy for automatic eviction of least recently used keys when memory limit is reached.

### Memory Limits
- Development: 256MB
- Production: 2GB+

### Monitoring
Track these metrics:
- Cache hit rate (target: >80%)
- Memory usage
- Eviction rate
- Key count by pattern

## Usage Examples

### TypeScript Client
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Get gas prices
async function getGasPrices(chainId: number) {
  const cached = await redis.hgetall(`gas:prices:${chainId}`);
  if (cached.fast) return cached;
  
  // Fetch from API if not cached
  const prices = await fetchGasPrices(chainId);
  await redis.hset(`gas:prices:${chainId}`, prices);
  await redis.expire(`gas:prices:${chainId}`, 30);
  return prices;
}

// Cache swap quote
async function cacheQuote(params: SwapParams, quote: SwapQuote) {
  const key = `quote:swap:${params.fromToken}:${params.toToken}:${params.amount}:${params.chainId}`;
  await redis.set(key, JSON.stringify(quote), 'EX', 10);
}

// Get cached balance
async function getCachedBalance(
  address: string,
  chainId: number,
  token: string
) {
  const key = `balance:${address}:${chainId}:${token}`;
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}
```

## Production Considerations

### High Availability
- Use Redis Cluster or Redis Sentinel for failover
- Configure persistence (RDB + AOF)
- Set up replication (1 master, 2+ replicas)

### Security
- Enable authentication (requirepass)
- Use TLS for connections
- Restrict network access
- Regular security updates

### Backup
- Automated daily RDB snapshots
- AOF log for point-in-time recovery
- Store backups in separate location

### Monitoring
Use Redis INFO command to monitor:
- connected_clients
- used_memory
- keyspace_hits / keyspace_misses
- expired_keys
- evicted_keys

### Connection Pooling
```typescript
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
});
```

## Troubleshooting

### High Memory Usage
- Check for keys without expiration
- Analyze key patterns with SCAN
- Consider shorter TTLs for volatile data

### Low Hit Rate
- Warm cache on startup
- Increase TTLs where appropriate
- Review cache key patterns

### Connection Issues
- Check network connectivity
- Verify credentials
- Review connection pool settings
- Monitor connection count
