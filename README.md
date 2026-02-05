# Potentia Ludi 🎮💬

## Conversational Web3 Wallet Hub

A Universal On-Chain Gaming Wallet Hub with natural language capabilities – interact with Web3 through simple conversations. Just say "swap 100 USDC to ETH" or "show my NFT balance" and let AI handle the complexity. The app auto-detects games, optimizes gas, swaps tokens, tracks rewards across chains, and generates creator-ready clips.

## What Makes This Different?

Unlike traditional Web3 wallets that require navigating complex UIs and understanding technical jargon:
- **Natural Language First**: Speak or type commands naturally - "send 0.1 ETH to vitalik.eth"
- **Context-Aware**: Remembers your conversation and preferences
- **Safety by Design**: AI-powered risk scoring and transaction simulation before execution
- **Multi-Chain Native**: Seamlessly operate across Ethereum, Polygon, Arbitrum, Optimism, Base, and BSC
- **Gaming Focused**: Automatic game detection and reward tracking built-in

## Features

## 💬 Conversational Features
<!-- CHUNK: Conversational Features - Natural Language Interface (max 800 chars) -->
**Natural Language Interface (Coming Soon)**
- Natural language processing for all Web3 operations
- AI-powered intent recognition and entity extraction
- Multi-turn conversations with context awareness
- Voice and text input support
- Real-time streaming responses
- Smart clarification questions for ambiguous requests

**Conversational Commands**
- Text-based commands like "Show my balance on Polygon"
- Voice input for hands-free gaming interactions
- Smart confirmations with AI-powered risk assessment
- Context memory for natural conversation flow
<!-- END CHUNK -->

## 🎮 Gaming Features
<!-- CHUNK: Gaming Features - Core Functionality (max 800 chars) -->
**🔍 Auto Game Detection**
- Automatically detects Web3 games when you open them
- Monitors known gaming platforms across multiple chains
- Supports Axie Infinity, Gods Unchained, The Sandbox, Decentraland, and more
- Custom game addition support

**🎬 Creator-Ready Clips & Stats**
- Automatic recording of gaming sessions
- Real-time stats overlay generation
- Track transactions, gas spent, rewards earned, and win rates
- Export clips with professional stats overlays
- Social media ready format
<!-- END CHUNK -->

## ⛓️ Blockchain Features
<!-- CHUNK: Blockchain Features - Transaction Management (max 800 chars) -->
**⛽ Gas Optimization**
- Real-time gas price monitoring across all major chains
- Automatic transaction optimization to reduce costs
- Smart scheduling for non-urgent transactions
- Average savings of 30% on gas fees

**🔄 Automatic Token Swaps**
- Behind-the-scenes token swapping when games need specific tokens
- Aggregates best routes from multiple DEX platforms
- Minimal slippage with optimal routing
- Supports all major tokens and chains

**🏆 Multi-Chain Reward Tracking**
- Tracks rewards across Ethereum, Polygon, BSC, Arbitrum, Optimism, and Base
- Real-time USD value calculation
- One-click reward claiming
- Comprehensive reward history
<!-- END CHUNK -->

## Technology Stack

## Current Implementation
- **Frontend**: React 18 + TypeScript
- **State Management**: Zustand
- **Web3 Integration**: Ethers.js v6, Wagmi, Viem
- **Build Tool**: Vite
- **Styling**: Inline styles with CSS animations

## Conversational Hub Stack (Planned)
- **Framework**: Next.js 16 (App Router)
- **Runtime**: Node.js 24 LTS
- **AI/NLP**: OpenAI Responses API (GPT-4)
- **Database**: PostgreSQL 16+
- **Cache**: Redis 7+
- **Authentication**: Sign-In with Ethereum (SIWE)

## Getting Started

## Prerequisites
- Node.js 18+ and npm (Node.js 24+ recommended for full conversational features)
- PostgreSQL 16+ (for conversational features)
- Redis 7+ (for conversational features)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/elove333/https-github.com-elove333-potentia-ludi.git
cd https-github.com-elove333-potentia-ludi
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (for conversational features):
```bash
cp .env.example .env.local
# Edit .env.local with your configuration:
# - OPENAI_API_KEY=your_openai_api_key
# - DATABASE_URL=postgresql://user:pass@localhost:5432/potentia
# - REDIS_URL=redis://localhost:6379
```

4. Start the development server:
```bash
npm run dev
```

5. Open http://localhost:3000 in your browser

### Building for Production

```bash
npm run build
```

The build output will be in the `dist` directory.

## Usage

<!-- CHUNK: Usage - Current Features Workflow (max 800 chars) -->
## Current Features Workflow
1. **Connect Your Wallet**: Click "Connect Wallet" to link your Web3 wallet
2. **Enable Features**: Toggle gas optimization and auto-swap features as needed
3. **Play Games**: Open any supported Web3 game, and it will be auto-detected
4. **Record Sessions**: Click "Record" on any detected game to capture your gameplay
5. **Track Rewards**: Monitor your cross-chain rewards in real-time
6. **View Clips**: Access your recorded clips with embedded stats overlays
<!-- END CHUNK -->

<!-- CHUNK: Usage - Conversational Interface (max 800 chars) -->
## Conversational Features Usage (Coming Soon)
**Text Command Examples**:
- "Show my balance on Polygon" - Query balances on specific chains
- "Swap 100 USDC for ETH" - Execute token swaps with natural language
- "What are my NFTs worth?" - Get NFT portfolio valuation
- "Bridge 10 MATIC to Arbitrum" - Cross-chain asset transfers

**Voice Interaction**:
- Speak commands hands-free while gaming
- Voice input automatically converted to actions
- Real-time audio feedback on transaction status

**Smart Safety Features**:
- AI reviews transactions before execution
- Risk assessment on potentially dangerous operations
- Automatic confirmation prompts for high-value transactions
- Context-aware clarification questions
<!-- END CHUNK -->

## Architecture

## Current Architecture
**Core Services**:
- **gameDetection.ts**: Monitors URLs and blockchain transactions to detect Web3 games
- **gasOptimization.ts**: Tracks gas prices and optimizes transaction parameters
- **tokenSwap.ts**: Handles automatic token swapping with DEX aggregation
- **rewardTracking.ts**: Monitors and tracks rewards across multiple chains
- **clipGenerator.ts**: Records gameplay and generates clips with stats overlays

**State Management**:
- **gamingWalletStore.ts**: Zustand store managing wallet state, games, rewards, and clips

**Components**:
- **App.tsx**: Main application container
- **WalletDashboard.tsx**: Wallet connection and feature toggles
- **DetectedGames.tsx**: Shows auto-detected games with recording controls
- **RewardsPanel.tsx**: Displays cross-chain rewards with claim functionality
- **ClipsGallery.tsx**: Gallery of recorded clips with stats

## 🔧 Workflow Modules Architecture (Planned)
<!-- CHUNK: Workflow Modules - Intent & Execution System (max 800 chars) -->
**Workflow Modules** - Modular intent handlers for Web3 operations:
- `balances.get`: Query token and NFT balances across chains
- `trade.swap`: Execute token swaps with DEX aggregation
- `bridge.transfer`: Cross-chain asset bridging
- `nft.transfer`: NFT transfers and marketplace interactions
- `portfolio.analyze`: Portfolio valuation and analytics

**Processing Pipeline**:
1. Natural Language Processing (OpenAI Responses API integration)
2. Intent Resolution Layer (parser, validator, risk scorer)
3. Workflow Module Routing (intent → action mapping)
4. Execution Layer (RPC gateway, transaction builder, simulator)
5. Data Layer (PostgreSQL for state, Redis for caching)
6. Safety Policies (SIWE authentication, risk assessment)

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete specifications.
<!-- END CHUNK -->

## Supported Chains

- Ethereum (Chain ID: 1)
- Polygon (Chain ID: 137)
- BSC (Chain ID: 56)
- Arbitrum (Chain ID: 42161)
- Optimism (Chain ID: 10)
- Base (Chain ID: 8453)

## Supported Games

- Axie Infinity (Ronin)
- Gods Unchained (IMX)
- The Sandbox (Ethereum)
- Decentraland (Polygon)
- Custom game support

## Development

### Project Structure
```
src/
├── components/       # React components
├── services/        # Core business logic services
├── store/           # Zustand state management
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── styles.css       # Global styles
└── index.tsx        # Application entry point
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

Contributions are welcome! This project is evolving to include conversational AI features alongside the existing gaming wallet capabilities.

## How to Contribute

1. **Fork and Clone**: Fork this repository and clone your fork locally
2. **Create a Branch**: `git checkout -b feature/your-feature-name`
3. **Make Changes**: Follow the code style and architecture patterns
4. **Test**: Ensure your changes work and don't break existing features
5. **Submit PR**: Open a pull request with a clear description

For detailed contributing guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md).

**Need help with Git workflows?** Check out our [Git Workflows Guide](./GIT_WORKFLOWS.md) for practical examples of cherry-picking, resolving conflicts, and safely rewriting history.

## Areas for Contribution

**Current Features** (Vite + React):
- Improve game detection algorithms
- Add support for new gaming platforms
- Enhance clip generation with more stats
- Optimize gas prediction algorithms

**Conversational Features** (Next.js + AI):
- Implement NL → Intent pipeline components
- Add new workflow modules (e.g., `nft.transfer`, `portfolio.analyze`)
- Improve intent recognition accuracy
- Enhance safety validation rules
- Build UI components for conversational interface

## Extension Points

The architecture is designed for modularity. See [ARCHITECTURE.md](./ARCHITECTURE.md) for:
- **Adding New Workflows**: Guide for implementing custom intent handlers
- **Integrating New APIs**: How to add DEX aggregators, bridge providers, etc.
- **Extending Intent Recognition**: Adding new command types and entities
- **Custom Safety Rules**: Implementing domain-specific validation

## Development Setup

See the detailed contributor guidelines in [ARCHITECTURE.md](./ARCHITECTURE.md#contributor-guidelines) for:
- Local environment setup
- Code organization patterns
- Testing strategies
- Security best practices

## License

MIT License - see LICENSE file for details
