# Conversational Web3 Wallet Hub - Architecture Specification

## Table of Contents
1. [Overview](#overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Component Workflows](#component-workflows)
4. [NL → Intent Pipeline](#nl--intent-pipeline)
5. [Backend Services](#backend-services)
6. [Safety Policies](#safety-policies)
7. [MVP Criteria](#mvp-criteria)
8. [Technology Stack](#technology-stack)
9. [Development Roadmap](#development-roadmap)

## Overview

The Conversational Web3 Wallet Hub is a next-generation blockchain wallet interface that combines natural language processing with traditional Web3 functionality. Users can interact with their wallet, execute transactions, and manage assets through conversational commands, making Web3 more accessible to non-technical users.

### Core Value Proposition
- **Natural Language Interface**: Execute blockchain operations using plain English commands
- **Multi-Chain Support**: Seamless interaction across Ethereum, Polygon, BSC, Arbitrum, Optimism, and Base
- **Intelligent Intent Recognition**: Advanced NLP pipeline that understands user intent and maps to blockchain operations
- **Safety-First Design**: Multi-layer validation and confirmation system to prevent errors and fraud
- **Gaming-Optimized**: Built-in support for Web3 gaming workflows (token swaps, reward tracking, NFT management)

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Chat UI    │  │  Dashboard   │  │  Gaming Components   │  │
│  │  Component   │  │  Components  │  │   (Existing)         │  │
│  └──────┬───────┘  └──────────────┘  └──────────────────────┘  │
│         │                                                         │
└─────────┼─────────────────────────────────────────────────────┬─┘
          │                                                       │
┌─────────▼───────────────────────────────────────────────────┬─▼─┐
│              NL → Intent Processing Pipeline                │   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │   │
│  │   OpenAI     │→ │    Intent    │→ │    Parameter     │  │   │
│  │  Responses   │  │    Parser    │  │   Validator      │  │   │
│  │     API      │  │              │  │                  │  │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │   │
│                                                             │   │
└─────────────────────────────────────────────────────────────┼───┘
                                                              │
┌─────────────────────────────────────────────────────────────▼───┐
│                    Intent Execution Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Balances    │  │   Trading    │  │     Bridge           │  │
│  │  Service     │  │   Service    │  │     Service          │  │
│  │ (.get)       │  │ (.swap)      │  │   (.transfer)        │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────────────┘  │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
┌─────────▼──────────────────▼──────────────────▼──────────────────┐
│                      Backend Services Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  PostgreSQL  │  │    Redis     │  │   Web3 Provider      │  │
│  │  Database    │  │    Cache     │  │   (Ethers.js)        │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Gas        │  │   DEX        │  │   Price Feed         │  │
│  │   Oracle     │  │ Aggregator   │  │   Service            │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Workflows

### 1. Natural Language Query Flow
```
User Input → OpenAI API → Intent Parsing → Parameter Validation → 
→ Safety Check → User Confirmation → Execution → Response
```

### 2. Intent Types and Mappings

| User Intent | API Endpoint | Service | Example Command |
|------------|--------------|---------|-----------------|
| Check Balance | `balances.get` | BalancesService | "What's my ETH balance?" |
| Transfer Tokens | `transfer.execute` | TransferService | "Send 10 USDC to Alice" |
| Swap Tokens | `trade.swap` | TradingService | "Swap 1 ETH for USDC" |
| Bridge Assets | `bridge.transfer` | BridgeService | "Bridge 100 MATIC to Ethereum" |
| Check Gas | `gas.estimate` | GasService | "How much gas will this cost?" |
| View History | `history.get` | HistoryService | "Show my last 10 transactions" |
| NFT Operations | `nft.query` | NFTService | "Show my NFTs" |

### 3. Workflow Components Structure

```
src/
├── workflows/
│   ├── balances/
│   │   ├── balances.get.ts       # Get balance for address/token
│   │   ├── balances.track.ts     # Track balance changes
│   │   └── types.ts
│   ├── trade/
│   │   ├── trade.swap.ts         # Execute token swaps
│   │   ├── trade.quote.ts        # Get swap quotes
│   │   └── types.ts
│   ├── bridge/
│   │   ├── bridge.transfer.ts    # Cross-chain transfers
│   │   ├── bridge.estimate.ts    # Estimate bridge costs
│   │   └── types.ts
│   └── shared/
│       ├── validation.ts         # Shared validation logic
│       └── confirmation.ts       # User confirmation handlers
```

## NL → Intent Pipeline

### 1. OpenAI Responses API Integration

The pipeline uses OpenAI's Responses API to convert natural language to structured intents.

```typescript
"interface NLRequest {
  userMessage: string;
  context: {
    walletAddress: string;
    connectedChains: number[];
    recentTransactions: Transaction[];
  };
}

interface IntentResponse {
  intent: string;              // e.g., "balances.get", "trade.swap"
  confidence: number;          // 0-1 confidence score
  parameters: Record<string, any>;
  requiresConfirmation: boolean;
  estimatedGas?: string;
  warnings?: string[];
}
```

### 2. Intent Parser

The Intent Parser validates and normalizes the OpenAI response into executable actions.

```typescript
'class IntentParser {
  // Parse OpenAI response into structured intent
  parse(response: OpenAIResponse): Intent;
  
  // Validate intent has all required parameters
  validate(intent: Intent): ValidationResult;
  
  // Enrich intent with additional context (gas prices, token prices)
  enrich(intent: Intent): Promise<EnrichedIntent>;
}
```

### 3. Safety Layer

Multi-tier safety checks before execution:

1. **Syntax Validation**: Ensure all required parameters are present
2. **Semantic Validation**: Verify logical consistency (e.g., sufficient balance)
3. **Security Checks**: Detect potential phishing or malicious patterns
4. **User Confirmation**: Require explicit approval for high-value operations
5. **Simulation**: Test transaction in safe environment before execution

### 4. Client/Server Orchestration

```typescript
// Client Side (Frontend)
'class ConversationalWalletClient {
  'async sendMessage(message: string): Promise<Response>;
  'async confirmIntent(intentId: string): Promise<ExecutionResult>;
  'async cancelIntent(intentId: string): Promise<void>;
}

// Server Side (Backend API)
'class ConversationalWalletServer {
  // Process NL input and return intent
  'async processNL(request: NLRequest): Promise<IntentResponse>;
  
  // Execute confirmed intent
  'async executeIntent(intentId: string, signature: string): Promise<Result>;
  
  // Get intent status
  'async getIntentStatus(intentId: string): Promise<IntentStatus>;
}
```

## Backend Services

### PostgreSQL Schema

```sql
-- Intent History Table
CREATE TABLE intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address VARCHAR(42) NOT NULL,
  raw_message TEXT NOT NULL,
  parsed_intent JSONB NOT NULL,
  status VARCHAR(20) NOT NULL, -- pending, confirmed, executed, failed, cancelled
  created_at TIMESTAMP DEFAULT NOW(),
  executed_at TIMESTAMP,
  transaction_hash VARCHAR(66),
  error_message TEXT,
  INDEX idx_user_address (user_address),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- Transaction Cache Table
CREATE TABLE transaction_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id INTEGER NOT NULL,
  tx_hash VARCHAR(66) NOT NULL UNIQUE,
  from_address VARCHAR(42) NOT NULL,
  to_address VARCHAR(42),
  value DECIMAL(78, 0),
  gas_used BIGINT,
  gas_price BIGINT,
  status VARCHAR(20),
  block_number BIGINT,
  timestamp TIMESTAMP,
  raw_data JSONB,
  INDEX idx_from_address (from_address),
  INDEX idx_to_address (to_address),
  INDEX idx_chain_tx (chain_id, tx_hash)
);

-- User Preferences Table
CREATE TABLE user_preferences (
  user_address VARCHAR(42) PRIMARY KEY,
  default_chain_id INTEGER DEFAULT 1,
  slippage_tolerance DECIMAL(5, 2) DEFAULT 0.5,
  gas_preference VARCHAR(20) DEFAULT 'medium', -- low, medium, high
  auto_confirm_below DECIMAL(18, 8), -- Auto-confirm txs below this USD value
  preferred_language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Price Cache Table
CREATE TABLE price_cache (
  id SERIAL PRIMARY KEY,
  token_address VARCHAR(42) NOT NULL,
  chain_id INTEGER NOT NULL,
  price_usd DECIMAL(18, 8) NOT NULL,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(token_address, chain_id),
  INDEX idx_token_chain (token_address, chain_id)
);
```

### Redis Caching Strategy

```typescript
// Cache Keys Structure
'const CacheKeys = {
  // Balance caching (TTL: 30s)
  balance: (address: string, chainId: number) =>' 
    `balance:${chainId}:${address}`,
  
  // Token price caching (TTL: 60s)
  price: (tokenAddress: string, chainId: number) 
    `price:${chainId}:${tokenAddress}`,
  
  // Gas price caching (TTL: 15s)
  gas: (chainId: number)  
    `gas:${chainId}`,
  
  // Intent status (TTL: 1h)
  intent: (intentId: string)  
    `intent:${intentId}`,
  
  // User session (TTL: 24h)
  session: (address: string)  
    `session:${address}`,
};

// Redis Client Configuration
'interface RedisCacheConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  enableOfflineQueue: boolean;
  maxRetriesPerRequest: number;
}
```

### Service Architecture

```typescript
// Base Service Interface
'interface WorkflowService {
  name: string;
  version: string;
  
  // Validate if this service can handle the intent
  canHandle(intent: Intent): boolean;
  
  // Estimate cost and time for execution
  estimate(intent: Intent): Promise<Estimation>;
  
  // Execute the intent
  execute(intent: Intent, signature: string): Promise<Result>;
  
  // Get execution status
  getStatus(executionId: string): Promise<Status>;
}

// Example: Balances Service
'class BalancesService 'implements WorkflowService {
  "async get(params: BalanceParams): Promise<Balance> {
    // 1. Check Redis cache
    // 2. If miss, query blockchain
    // 3. Update cache
    // 4. Return balance
  }
  
  async track(params: TrackParams): Promise<void> {
    // Subscribe to balance changes
  }
}

// Example: Trading Service
class TradingService implements WorkflowService {
  async swap(params: SwapParams): Promise<SwapResult> {
    // 1. Get best quote from DEX aggregator
    // 2. Check slippage tolerance
    // 3. Simulate transaction
    // 4. Get user confirmation
    // 5. Execute swap
    // 6. Monitor transaction
  }
}

// Example: Bridge Service
class BridgeService implements WorkflowService {
  async transfer(params: BridgeParams): Promise<BridgeResult> {
    // 1. Validate source and destination chains
    // 2. Get bridge quote
    // 3. Check fees
    // 4. Execute bridge transaction
    // 5. Track cross-chain transfer
  }
}
```

## Safety Policies

### 1. Transaction Value Limits

| Operation | Max Value (First Time) | Max Value (Verified User) |
|-----------|------------------------|---------------------------|
| Transfer | $100 USD | $10,000 USD |
| Swap | $500 USD | $50,000 USD |
| Bridge | $200 USD | $20,000 USD |

### 2. Rate Limiting

- Maximum 10 transactions per hour per user
- Maximum 3 failed transactions before temporary lockout (15 min)
- Maximum 50 API calls per minute per user

### 3. Confirmation Requirements

| Condition | Confirmation Type |
|-----------|------------------|
| Transaction > $50 | User must type "CONFIRM" |
| First transaction to new address | Email/SMS verification |
| Bridge transactions | Double confirmation |
| Unusual patterns detected | Admin review required |

### 4. Security Measures

```typescript
'interface SecurityChecks {
  // Check if address is on known blacklist
  checkBlacklist(address: string): Promise<boolean>;
  
  // Detect suspicious patterns
  detectAnomalies(intent: Intent, history: Intent[]): Risk;
  
  // Validate signature
  verifySignature(message: string, signature: string): boolean;
  
  // Rate limiting check
  checkRateLimit(userAddress: string): Promise<boolean>;
}
```

### 5. Error Handling

```typescript
"class SafetyError extends Error {
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  userMessage: string;
  technicalDetails: any;
}

// Error Codes
enum SafetyErrorCode {
  INSUFFICIENT_BALANCE = 'E001',
  RATE_LIMIT_EXCEEDED = 'E002',
  BLACKLISTED_ADDRESS = 'E003',
  SUSPICIOUS_PATTERN = 'E004',
  INVALID_SIGNATURE = 'E005',
  TRANSACTION_TOO_LARGE = 'E006',
}
```

## MVP Criteria

### Phase 1: Foundation (Weeks 1-2)
- [x] Repository structure and documentation
- [ ] OpenAI Responses API integration
- [ ] Basic intent parser (3 intents: balance, transfer, swap)
- [ ] PostgreSQL schema setup
- [ ] Redis caching layer
- [ ] Basic safety checks

**Success Metrics:**
- Parse 3 types of natural language commands
- Successfully execute 1 balance check
- Cache hit rate > 80%

### Phase 2: Core Workflows (Weeks 3-4)
- [ ] Complete `balances.get` workflow
- [ ] Complete `trade.swap` workflow with DEX integration
- [ ] Complete `bridge.transfer` workflow
- [ ] User confirmation UI
- [ ] Transaction monitoring

**Success Metrics:**
- Successfully execute all 3 core workflows
- <2s response time for cached queries
- 0 failed transactions due to parsing errors

### Phase 3: Safety & Polish (Weeks 5-6)
- [ ] Comprehensive safety checks
- [ ] Rate limiting implementation
- [ ] Transaction simulation
- [ ] Enhanced error messages
- [ ] Intent history UI
- [ ] Mobile-responsive design

**Success Metrics:**
- Block 100% of blacklisted addresses
- <0.1% false positive rate on safety checks
- User satisfaction score > 4.5/5

### Phase 4: Advanced Features (Weeks 7-8)
- [ ] Multi-step intent support ("swap and bridge")
- [ ] Scheduled transactions
- [ ] Portfolio analysis
- [ ] AI-powered insights
- [ ] Integration with gaming features

**Success Metrics:**
- Support complex multi-step intents
- 95% intent recognition accuracy
- Process 1000+ transactions

## Technology Stack

### Frontend
- **Framework**: React 18.2+ (Current: Vite-based, Target: Next.js 16)
- **State Management**: Zustand 4.4+
- **Web3 Libraries**: 
  - Ethers.js 6.9+
  - Wagmi 2.5+
  - Viem 2.7+
- **UI Framework**: Tailwind CSS (to be added)
- **Type Safety**: TypeScript 5.0+

### Backend
- **Runtime**: Node.js 24.x (Current: 20.x)
- **Framework**: Next.js 16 API Routes (or Express.js)
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **ORM**: Prisma 5+ or TypeORM

### AI/ML
- **NLP**: OpenAI GPT-4 via Responses API
- **Intent Recognition**: Custom parser with OpenAI
- **Safety Scoring**: Rule-based + ML hybrid

### DevOps
- **Container**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: DataDog or New Relic
- **Error Tracking**: Sentry

### Security
- **Secrets Management**: Environment variables + Vault
- **API Authentication**: JWT tokens
- **Rate Limiting**: Redis-based
- **Transaction Signing**: Hardware wallet support

## Development Roadmap

### Immediate Next Steps (Current Sprint)
1. ✅ Create ARCHITECTURE.md
2. ✅ Update README.md
3. Create workflow scaffolds
   - `src/workflows/balances/balances.get.ts`
   - `src/workflows/trade/trade.swap.ts`
   - `src/workflows/bridge/bridge.transfer.ts`
4. Setup OpenAI API integration scaffold
5. Create database schema files
6. Setup Redis connection utilities
7. Document local development setup

### Migration Path to Next.js 16

Current state: Vite + React
Target state: Next.js 16 + React Server Components

**Migration Strategy:**
1. Keep existing Vite setup for now (MVP phase)
2. Create parallel Next.js 16 structure in `app/` directory
3. Gradually migrate components to Next.js App Router
4. Leverage Server Components for backend logic
5. Use Server Actions for intent execution
6. Complete migration by Phase 3

**Benefits of Next.js 16:**
- Server Components reduce client bundle
- Server Actions simplify API routes
- Built-in caching and optimization
- Better SEO for public pages
- Easier deployment on Vercel

### Node.js 24 Compatibility

Current: Node.js 20.x
Target: Node.js 24.x

**Compatibility Notes:**
- All current dependencies compatible with Node 24
- Test thoroughly with `nvm use 24`
- Update CI/CD to use Node 24
- Document minimum Node version in README

## Extension Points

### For Contributors

1. **Adding New Intents**
   - Define intent schema in `src/workflows/{service}/types.ts`
   - Implement service in `src/workflows/{service}/{intent}.ts`
   - Add intent to parser mapping
   - Write tests

2. **Integrating New Chains**
   - Add chain config to `src/config/chains.ts`
   - Update RPC providers
   - Test all workflows on new chain
   - Update documentation

3. **Custom DEX Integration**
   - Implement `DEXAdapter` interface
   - Add to DEX aggregator
   - Configure in environment variables
   - Add integration tests

4. **Custom Safety Rules**
   - Extend `SecurityChecks` class
   - Add rule to validation pipeline
   - Configure thresholds
   - Monitor false positives

## Glossary

- **Intent**: A structured representation of user's desired action
- **NL**: Natural Language
- **DEX**: Decentralized Exchange
- **Slippage**: Difference between expected and actual trade price
- **Bridge**: Cross-chain asset transfer mechanism
- **Gas Oracle**: Service that provides real-time gas price estimates

## References

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Ethers.js Documentation](https://docs.ethers.org/v6/)
- [Next.js 16 Documentation](https://nextjs.org/docs)
- [PostgreSQL Best Practices](https://www.postgresql.org/docs/)
- [Redis Caching Strategies](https://redis.io/docs/manual/patterns/)

---

**Document Version**: 1.0.0  
**Last Updated**: 2026-01-19  
**Maintained By**: Potentia Ludi Team
