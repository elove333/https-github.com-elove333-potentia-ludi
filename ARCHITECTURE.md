# Conversational Web3 Wallet Hub - Architecture Specification

## Overview

The Conversational Web3 Wallet Hub is a next-generation Web3 wallet interface that enables users to interact with blockchain applications through natural language. By combining the Universal On-Chain Gaming Wallet Hub's features with conversational AI capabilities, users can perform complex blockchain operations through simple voice or text commands.

## Vision

Create a seamless bridge between natural language and Web3 operations, making blockchain technology accessible to users regardless of their technical expertise. Users should be able to say "swap 100 USDC for ETH" or "show my NFT balance" and have the system understand, validate, and execute these operations safely.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Voice Input  │  │ Text Input   │  │ Visual UI    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              Natural Language Processing Layer               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         OpenAI Responses API Integration             │   │
│  │  - Intent Recognition                                │   │
│  │  - Entity Extraction (amounts, tokens, addresses)    │   │
│  │  - Context Management                                │   │
│  │  - Conversation History                              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   Intent Resolution Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Intent Parser│  │ Validator    │  │ Risk Scorer  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          └──────────────────┴──────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Workflow Orchestration                    │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │ balances.get   │  │ trade.swap     │  │bridge.transfer│ │
│  │ - Multi-chain  │  │ - DEX routing  │  │- Cross-chain │  │
│  │ - NFTs         │  │ - Slippage     │  │- Gas estimate│  │
│  │ - Approvals    │  │ - Gas optimize │  │- Safety check│  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      Execution Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ RPC Gateway  │  │ TX Builder   │  │ Simulator    │      │
│  │ - Multi-RPC  │  │ - EIP-1559   │  │ - Tenderly   │      │
│  │ - Load bal.  │  │ - Batch ops  │  │ - Safe check │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                        Data Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ PostgreSQL   │  │ Redis Cache  │  │ Session Mgmt │      │
│  │ - User data  │  │ - Gas prices │  │ - SIWE Auth  │      │
│  │ - TX history │  │ - Balances   │  │ - Cookie     │      │
│  │ - Intents    │  │ - Quotes     │  │ - JWT        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Natural Language Processing Pipeline

#### 1.1 OpenAI Responses API Integration
- **Purpose**: Convert natural language to structured intents
- **Features**:
  - Stream responses for real-time feedback
  - Context-aware conversation management
  - Multi-turn dialogue support
  - Fallback to clarification questions

#### 1.2 Intent Recognition
Supported intent categories:
- `balances.get` - Query wallet balances, NFTs, approvals
- `trade.swap` - Token swaps via DEX aggregators
- `bridge.transfer` - Cross-chain asset transfers
- `send.transfer` - Simple token/NFT transfers
- `info.query` - General blockchain information
- `portfolio.analyze` - Portfolio analytics and insights

#### 1.3 Entity Extraction
Extract structured data from natural language:
- Token symbols and amounts
- Wallet addresses (with ENS resolution)
- Chain names and IDs
- Time expressions
- Risk parameters (slippage, deadlines)

### 2. Intent Resolution Layer

#### 2.1 Intent Parser
```typescript
interface ParsedIntent {
  action: IntentAction;
  entities: {
    token?: { symbol: string; amount: bigint; address: string };
    recipient?: string;
    chain?: number;
    parameters?: Record<string, any>;
  };
  confidence: number;
  alternatives?: ParsedIntent[];
}
```

#### 2.2 Validation Engine
- Schema validation for all intents
- Balance checks before operations
- Address format validation
- Chain compatibility verification
- Gas estimation and feasibility

#### 2.3 Risk Scoring
Multi-factor risk assessment:
- Transaction size relative to portfolio
- Recipient reputation (if available)
- Contract interaction risk
- Historical pattern deviation
- Slippage and price impact

Risk levels:
- `LOW` - Standard operations, auto-execute
- `MEDIUM` - Require explicit confirmation
- `HIGH` - Show warnings, require double confirmation
- `CRITICAL` - Block or require additional verification

### 3. Workflow Modules

#### 3.1 balances.get Workflow
```typescript
interface BalancesWorkflow {
  // Fetch native token balances
  getNativeBalance(address: string, chainId: number): Promise<Balance>;
  
  // Fetch ERC20 token balances
  getTokenBalances(address: string, chainId: number, tokens?: string[]): Promise<TokenBalance[]>;
  
  // Fetch NFT holdings
  getNFTs(address: string, chainId: number): Promise<NFT[]>;
  
  // Check token approvals
  getApprovals(address: string, chainId: number): Promise<Approval[]>;
}
```

**Data Sources**:
- Direct RPC calls for native balances
- Token list APIs (CoinGecko, 1inch)
- NFT APIs (Alchemy, Moralis)
- Approval scanning via Transfer events

**Caching Strategy**:
- Redis cache with 30s TTL for balances
- 5-minute TTL for NFTs
- On-demand refresh for real-time operations

#### 3.2 trade.swap Workflow
```typescript
interface SwapWorkflow {
  // Get best swap quote
  getQuote(params: SwapParams): Promise<SwapQuote>;
  
  // Execute swap with safety checks
  executeSwap(quote: SwapQuote, userConfirmed: boolean): Promise<Transaction>;
  
  // Estimate gas and total cost
  estimateCost(quote: SwapQuote): Promise<CostEstimate>;
}

interface SwapParams {
  fromToken: string;
  toToken: string;
  amount: bigint;
  chainId: number;
  slippage: number; // basis points
  recipient?: string;
}
```

**DEX Integration**:
- Primary: 0x API v2 for aggregation
- Fallback: Uniswap V3 direct quotes
- Safety: Simulate all swaps before execution

**Safety Guardrails**:
- Max slippage: 1% default, 5% hard cap
- Price impact warnings above 3%
- Minimum output amount calculation
- Deadline protection (10 minutes)

#### 3.3 bridge.transfer Workflow
```typescript
interface BridgeWorkflow {
  // Get available bridge routes
  getRoutes(params: BridgeParams): Promise<BridgeRoute[]>;
  
  // Execute cross-chain transfer
  executeBridge(route: BridgeRoute): Promise<BridgeTransaction>;
  
  // Track bridge status
  trackBridge(txHash: string): Promise<BridgeStatus>;
}

interface BridgeParams {
  fromChain: number;
  toChain: number;
  token: string;
  amount: bigint;
  recipient?: string;
}
```

**Bridge Providers**:
- Layer Zero (primary for wide support)
- Axelar (fallback)
- Native bridges when available
- Bridge aggregators (Socket, LI.FI)

**Cross-Chain Safety**:
- Verify recipient address format on destination chain
- Estimate total time and gas costs
- Monitor bridge liquidity
- Implement retry mechanisms

### 4. Execution Layer

#### 4.1 RPC Gateway
- Multi-provider setup: Alchemy, Infura, QuickNode
- Automatic failover and load balancing
- Rate limiting and request queuing
- WebSocket support for real-time updates

#### 4.2 Transaction Builder
- EIP-1559 gas price optimization
- Batch transactions where possible (ERC-4337)
- MEV protection via private mempools
- Transaction simulation before broadcast

#### 4.3 Simulation Engine
- Pre-execution simulation via Tenderly
- State change analysis
- Failure reason detection
- Gas usage prediction

### 5. Data Layer

#### 5.1 PostgreSQL Schema
```sql
-- Users and authentication
CREATE TABLE users (
  id UUID PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP,
  preferences JSONB
);

-- Conversation history
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  context JSONB
);

-- Intent log
CREATE TABLE intents (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  user_id UUID REFERENCES users(id),
  raw_input TEXT NOT NULL,
  parsed_intent JSONB NOT NULL,
  confidence FLOAT,
  risk_level VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transaction history
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  intent_id UUID REFERENCES intents(id),
  chain_id INTEGER NOT NULL,
  tx_hash VARCHAR(66),
  status VARCHAR(20),
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP
);

-- Session management
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  session_token VARCHAR(256) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON transactions(user_id, created_at DESC);
CREATE INDEX idx_intents_conversation ON intents(conversation_id, created_at);
CREATE INDEX idx_sessions_token ON sessions(session_token);
```

#### 5.2 Redis Cache Structure
```
# Gas prices (30s TTL)
gas:prices:{chainId} -> { fast, standard, slow }

# Token balances (30s TTL)
balance:{address}:{chainId}:{token} -> { balance, decimals, symbol }

# Swap quotes (10s TTL)
quote:{fromToken}:{toToken}:{amount}:{chainId} -> { quote data }

# NFT metadata (1h TTL)
nft:{contract}:{tokenId} -> { metadata }

# User context (session duration)
context:{userId}:{conversationId} -> { conversation state }
```

#### 5.3 Authentication (SIWE)
Sign-In with Ethereum flow:
1. Request nonce from server
2. User signs message with wallet
3. Server verifies signature
4. Issue session cookie + JWT
5. Cookie-based session for web app
6. JWT for API authentication

## Safety Policies

### Transaction Safety
1. **Simulation First**: All transactions must be simulated before execution
2. **User Confirmation**: Transactions above risk threshold require explicit approval
3. **Timeout Protection**: Transactions expire after 10 minutes
4. **Slippage Caps**: Hard limits on acceptable slippage
5. **Balance Checks**: Verify sufficient balance before attempting operations

### Intent Validation
1. **Schema Compliance**: All intents must match expected schema
2. **Confidence Threshold**: Reject intents below 70% confidence
3. **Ambiguity Resolution**: Ask clarification questions for unclear intents
4. **Sanity Checks**: Flag unusual amounts or operations

### Data Privacy
1. **No Sensitive Data Logging**: Never log private keys or mnemonics
2. **Minimal Data Collection**: Only collect necessary user data
3. **Encryption**: Encrypt sensitive data at rest
4. **Consent**: Clear user consent for data usage

### Rate Limiting
1. **Intent Processing**: Max 60 intents per minute per user
2. **Transaction Submission**: Max 10 transactions per minute per user
3. **API Calls**: Respect third-party API rate limits
4. **Conversation Length**: Auto-reset context after 100 turns

## MVP Criteria

### Must-Have Features (Phase 1)
- ✅ Basic NL input (text-based)
- ✅ Intent recognition for `balances.get`, `trade.swap`
- ✅ OpenAI API integration with streaming
- ✅ Multi-chain balance queries
- ✅ DEX swap execution with 0x API
- ✅ Transaction simulation before signing
- ✅ SIWE authentication
- ✅ PostgreSQL for user data and transaction history
- ✅ Redis for caching gas prices and quotes
- ✅ Basic risk scoring (LOW/MEDIUM/HIGH)

### Should-Have Features (Phase 2)
- Voice input support
- ENS name resolution
- `bridge.transfer` workflow
- Portfolio analytics
- Transaction history UI
- Gas optimization recommendations
- Multi-turn conversation refinement

### Nice-to-Have Features (Phase 3)
- Mobile (React Native)
- Browser extension for in-page assistance
- Advanced risk scoring with ML
- Social features (share transactions)
- Batch operations
- Smart transaction scheduling
- MEV protection via Flashbots

## Technology Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5+
- **UI Library**: React 18+
- **Styling**: Tailwind CSS
- **State**: Zustand or Jotai
- **Web3**: Wagmi 2+, Viem 2+, RainbowKit

### Backend
- **Runtime**: Node.js 24 LTS
- **Framework**: Next.js API Routes (or Express.js)
- **Database**: PostgreSQL 16+
- **Cache**: Redis 7+
- **ORM**: Prisma or Drizzle ORM

### AI/ML
- **NL Processing**: OpenAI Responses API (GPT-4)
- **Streaming**: Server-Sent Events (SSE)
- **Context Window**: 8K tokens per conversation

### Infrastructure
- **Hosting**: Vercel (Frontend + API Routes)
- **Database**: Neon, Supabase, or Railway
- **Cache**: Upstash Redis
- **RPC**: Alchemy, Infura
- **Monitoring**: Sentry, PostHog

### Development
- **Package Manager**: pnpm
- **Code Quality**: ESLint, Prettier, TypeScript strict mode
- **Testing**: Vitest, Playwright
- **CI/CD**: GitHub Actions

## Component Integration Points

### Client-Server Communication
```typescript
// Client sends intent
POST /api/intent
{
  "message": "swap 100 USDC to ETH on polygon",
  "conversationId": "uuid",
  "context": { ... }
}

// Server streams response
SSE /api/intent/stream
data: {"type": "thinking", "message": "Analyzing your request..."}
data: {"type": "intent", "parsed": { ... }}
data: {"type": "quote", "data": { ... }}
data: {"type": "confirmation", "required": true}
data: {"type": "complete"}

// Client confirms execution
POST /api/execute
{
  "intentId": "uuid",
  "confirmed": true
}
```

### OpenAI Integration
```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function processIntent(userMessage: string, context: ConversationContext) {
  const stream = await client.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...context.history,
      { role: 'user', content: userMessage }
    ],
    functions: INTENT_FUNCTIONS,
    stream: true
  });

  for await (const chunk of stream) {
    // Process and forward to client
    yield chunk;
  }
}
```

## Development Roadmap

### Phase 1: Foundation (Weeks 1-2)
- Set up Next.js 16 project structure
- Configure PostgreSQL and Redis
- Implement SIWE authentication
- Create basic UI for text input
- Set up OpenAI API integration
- Implement `balances.get` workflow

### Phase 2: Core Features (Weeks 3-4)
- Implement `trade.swap` workflow
- Integrate 0x API for DEX aggregation
- Add transaction simulation
- Build risk scoring engine
- Create confirmation UI
- Add conversation history

### Phase 3: Enhancement (Weeks 5-6)
- Implement `bridge.transfer` workflow
- Add voice input support
- Build portfolio analytics
- Optimize caching strategy
- Add transaction monitoring
- Implement retry mechanisms

### Phase 4: Polish (Week 7-8)
- Comprehensive testing
- Performance optimization
- Security audit
- Documentation
- Deploy to production
- Monitor and iterate

## Contributor Guidelines

### Getting Started
1. Clone repository
2. Install dependencies: `pnpm install`
3. Copy `.env.example` to `.env.local`
4. Set up local PostgreSQL: `docker-compose up -d`
5. Run migrations: `pnpm prisma migrate dev`
6. Start dev server: `pnpm dev`

### Code Organization
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── intent/        # Intent processing
│   │   ├── execute/       # Transaction execution
│   │   └── auth/          # Authentication
│   ├── (dashboard)/       # Protected routes
│   └── layout.tsx
├── lib/                   # Core libraries
│   ├── ai/               # OpenAI integration
│   ├── workflows/        # Intent workflows
│   │   ├── balances.ts
│   │   ├── swap.ts
│   │   └── bridge.ts
│   ├── validation/       # Intent validation
│   ├── execution/        # Transaction execution
│   └── safety/           # Risk scoring
├── components/           # React components
├── hooks/               # Custom React hooks
├── types/               # TypeScript types
└── utils/               # Utility functions
```

### Adding New Workflows
1. Create workflow file in `lib/workflows/`
2. Define TypeScript interfaces
3. Implement core logic with error handling
4. Add validation schemas
5. Write unit tests
6. Update intent parser to recognize new intents
7. Document in this file

### Testing Strategy
- Unit tests for all workflow functions
- Integration tests for API routes
- E2E tests for critical user flows
- Mock OpenAI API in tests
- Use test wallet addresses only

## Security Considerations

### Smart Contract Interactions
- Always use try-catch for contract calls
- Validate contract ABIs
- Verify contract addresses against known lists
- Use multicall for batch reads

### Private Key Management
- Never log or transmit private keys
- Use secure key storage (hardware wallets)
- Implement key rotation where applicable
- Clear sensitive data from memory

### API Security
- Rate limiting on all endpoints
- CORS configuration
- Input sanitization
- SQL injection prevention (use parameterized queries)
- XSS prevention

### Monitoring
- Transaction success/failure rates
- Intent parsing accuracy
- API latency and errors
- Gas price optimization effectiveness
- User session security events

## Conclusion

This architecture provides a comprehensive blueprint for building a conversational Web3 wallet that is safe, user-friendly, and extensible. The modular design allows for incremental development while maintaining a clear separation of concerns. The focus on safety, validation, and user experience ensures that the application meets the high standards required for handling financial operations.

## References

- [OpenAI Responses API Documentation](https://platform.openai.com/docs/api-reference)
- [0x API v2 Documentation](https://0x.org/docs/api)
- [EIP-1559: Fee Market](https://eips.ethereum.org/EIPS/eip-1559)
- [EIP-4337: Account Abstraction](https://eips.ethereum.org/EIPS/eip-4337)
- [Sign-In with Ethereum](https://login.xyz/)
- [Next.js 16 Documentation](https://nextjs.org/docs)
