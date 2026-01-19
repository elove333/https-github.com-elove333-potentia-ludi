# Potentia Ludi 🎮

A Conversational Web3 Wallet Hub powered by natural-language input (NL → Intent). This full-stack application enables users to interact with Web3 using plain English, automatically routing through the optimal execution path with comprehensive safety features.

## 🌟 Features

### Core Capabilities

#### 🗣️ Natural Language Processing
- Convert plain English to structured intents
- Support for complex multi-step operations
- Confidence scoring and validation
- Helpful suggestions when parsing fails

#### 🔐 SIWE Authentication
- Sign-In with Ethereum (SIWE) standard
- Secure session management with Iron Session
- Redis-backed nonce validation
- Database session tracking

#### 🎯 Intent Pipeline
Parse → Preflight → Preview → Execute flow supporting:
- **`balances.get`**: Read balances, NFTs, and approvals across chains
- **`trade.swap`**: Perform token swaps with constraints like slippage
- **`bridge.transfer`**: Bridge assets across multiple chains
- **`rewards.claim`**: Aggregate claimable gaming rewards

#### 🛡️ Safety Features
- **Transaction Simulation**: Tenderly integration for pre-execution validation
- **Risk Assessment**: Automatic risk level detection (low, medium, high, critical)
- **Decoded Calls**: Human-readable transaction breakdown
- **Token Deltas**: Clear before/after balance changes
- **Gas Estimation**: Accurate cost predictions
- **Guardrails**: Block on negative simulations, stale quotes, unverified routers

#### 📊 Multi-Chain Support
- Ethereum (Chain ID: 1)
- Polygon (Chain ID: 137)
- Arbitrum (Chain ID: 42161)
- Optimism (Chain ID: 10)
- Base (Chain ID: 8453)

## 🏗️ Technology Stack

### Backend
- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL (optimized for Neon)
- **Cache**: Redis (optimized for Upstash)
- **Authentication**: SIWE + Iron Session
- **Logging**: Pino with structured logging
- **Validation**: Zod schemas

### Integrations
- **Alchemy**: Portfolio & NFT APIs (primary read layer)
- **Moralis**: Fallback provider
- **0x API**: DEX swap quotes with Permit2
- **Tenderly**: Transaction simulation
- **Blocknative**: Gas advisories (planned)
- **LI.FI SDK**: Cross-chain bridging (planned)
- **Galxe, RabbitHole, Layer3**: Rewards aggregation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis instance
- API keys (see `.env.example`)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/elove333/https-github.com-elove333-potentia-ludi.git
cd https-github.com-elove333-potentia-ludi
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `SESSION_SECRET` - 32+ character secret for session encryption
- `ALCHEMY_API_KEY` - Alchemy API key

Optional (for full functionality):
- `TENDERLY_API_KEY`, `TENDERLY_PROJECT`, `TENDERLY_ACCOUNT` - Transaction simulation
- `ZEROX_API_KEY` - Enhanced 0x API access
- `GALXE_API_KEY`, `RABBITHOLE_API_KEY`, `LAYER3_API_KEY` - Rewards

4. **Run database migrations**
```bash
psql $DATABASE_URL < migrations/001_initial_schema.sql
```

5. **Start development server**
```bash
npm run dev
```

Visit `http://localhost:3000`

### Production Build
```bash
npm run build
npm start
```

## 📡 API Endpoints

### Authentication
- `GET /api/siwe/nonce` - Generate SIWE nonce
- `POST /api/siwe/verify` - Verify signature and create session
- `POST /api/siwe/logout` - Destroy session

### Intents
- `POST /api/intents/parse` - Parse natural language to intent
- `POST /api/intents/quote` - Get swap quote for trade intent
- `POST /api/intents/preview` - Preview transaction with risk assessment

### Data
- `GET /api/balances?chainId=1&includeNFTs=true` - Fetch portfolio balances
- `GET /api/rewards?platforms=galxe,rabbithole` - Get claimable rewards

## 💬 Natural Language Examples

```
"Show me my balance"
→ balances.get intent

"Swap 100 USDC for ETH"
→ trade.swap intent with fromToken=USDC, toToken=ETH, amount=100

"Bridge 0.5 ETH to Polygon"
→ bridge.transfer intent with toChainId=137

"Show my claimable rewards"
→ rewards.claim intent
```

## 📚 Documentation

- [Technical Specification](./TECHNICAL_SPEC.md) - Detailed API documentation
- [Database Schema](./migrations/001_initial_schema.sql) - PostgreSQL schema
- [Environment Variables](./.env.example) - Configuration reference

## 🗄️ Database Schema

### Core Tables
- **users**: User accounts indexed by wallet address
- **sessions**: SIWE session records with expiry
- **intents**: Intent processing history with status tracking
- **limits**: Per-user spending and approval limits
- **telemetry**: Event logging for observability

## 🔒 Security

- **SIWE Authentication**: Cryptographic wallet authentication
- **Session Encryption**: Iron Session with secure HTTP-only cookies
- **Nonce Validation**: One-time use nonces with Redis TTL
- **Transaction Simulation**: Pre-execution validation via Tenderly
- **Risk Assessment**: Automated risk scoring
- **Spending Limits**: Daily USD caps per user
- **Approval Bounds**: Maximum approval amounts

## 📊 Observability

- **Structured Logging**: Pino with correlation IDs
- **Telemetry Events**: All user actions logged to PostgreSQL
- **Cache Metrics**: Redis hit/miss tracking
- **Error Tracking**: Comprehensive error logging

## 🚢 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables:
   - Database (Neon PostgreSQL)
   - Cache (Upstash Redis)
   - API keys
4. Deploy

### Manual Deployment

```bash
npm run build
npm start
```

## 🛣️ Roadmap

### Phase 1: Core Infrastructure ✅
- [x] Next.js 14 setup
- [x] PostgreSQL schema
- [x] SIWE authentication
- [x] Intent schemas
- [x] Basic API endpoints

### Phase 2: Integrations ✅
- [x] Alchemy Portfolio API
- [x] 0x DEX integration
- [x] Tenderly simulation
- [x] Rewards aggregation (Galxe, RabbitHole, Layer3)

### Phase 3: Enhanced Features 🚧
- [ ] LI.FI bridging integration
- [ ] Permit2 support
- [ ] Blocknative gas optimization
- [ ] ML-based intent parser
- [ ] Spending limit enforcement

### Phase 4: Frontend 📋
- [ ] React UI components
- [ ] Natural language input widget
- [ ] Transaction preview modal
- [ ] Rewards dashboard
- [ ] Multi-wallet support

### Phase 5: Production 📋
- [ ] Comprehensive test suite
- [ ] Security audit
- [ ] Performance optimization
- [ ] Monitoring & alerts
- [ ] Documentation site

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [SIWE](https://login.xyz/)
- [Alchemy](https://www.alchemy.com/)
- [0x Protocol](https://0x.org/)
- [Tenderly](https://tenderly.co/)
- [LI.FI](https://li.fi/)

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check the [Technical Specification](./TECHNICAL_SPEC.md)
- Review API endpoint documentation

---

Made with ❤️ for the Web3 gaming community
