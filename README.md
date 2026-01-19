# Potentia Ludi 🎮

A Universal On-Chain Gaming Wallet Hub – a single app that auto-detects any Web3 game you open, optimizes gas, swaps tokens behind the scenes, tracks rewards across chains, and auto-generates creator-ready clips and stats overlays.

## Features

### 🔍 Auto Game Detection
- Automatically detects Web3 games when you open them
- Monitors known gaming platforms across multiple chains
- Supports Axie Infinity, Gods Unchained, The Sandbox, Decentraland, and more
- Custom game addition support

### ⛽ Gas Optimization
- Real-time gas price monitoring across all major chains
- Automatic transaction optimization to reduce costs
- Smart scheduling for non-urgent transactions
- Average savings of 30% on gas fees

### 🔄 Automatic Token Swaps
- Behind-the-scenes token swapping when games need specific tokens
- Aggregates best routes from multiple DEX platforms
- Minimal slippage with optimal routing
- Supports all major tokens and chains

### 🏆 Multi-Chain Reward Tracking
- Tracks rewards across Ethereum, Polygon, BSC, Arbitrum, Optimism, and Base
- Real-time USD value calculation
- One-click reward claiming
- Comprehensive reward history

### 🎬 Creator-Ready Clips & Stats
- Automatic recording of gaming sessions
- Real-time stats overlay generation
- Track transactions, gas spent, rewards earned, and win rates
- Export clips with professional stats overlays
- Social media ready format

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **State Management**: Zustand
- **Web3 Integration**: Ethers.js v6, Wagmi, Viem
- **Build Tool**: Vite
- **Styling**: Inline styles with CSS animations

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/elove333/https-github.com-elove333-potentia-ludi.git
cd https-github.com-elove333-potentia-ludi
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open http://localhost:3000 in your browser

### Building for Production

```bash
npm run build
```

The build output will be in the `dist` directory.

## Usage

1. **Connect Your Wallet**: Click "Connect Wallet" to link your Web3 wallet
2. **Enable Features**: Toggle gas optimization and auto-swap features as needed
3. **Play Games**: Open any supported Web3 game, and it will be auto-detected
4. **Record Sessions**: Click "Record" on any detected game to capture your gameplay
5. **Track Rewards**: Monitor your cross-chain rewards in real-time
6. **View Clips**: Access your recorded clips with embedded stats overlays

## Architecture

### Core Services

- **gameDetection.ts**: Monitors URLs and blockchain transactions to detect Web3 games
- **gasOptimization.ts**: Tracks gas prices and optimizes transaction parameters
- **tokenSwap.ts**: Handles automatic token swapping with DEX aggregation
- **rewardTracking.ts**: Monitors and tracks rewards across multiple chains
- **clipGenerator.ts**: Records gameplay and generates clips with stats overlays

### State Management

- **gamingWalletStore.ts**: Zustand store managing wallet state, games, rewards, and clips

### Components

- **App.tsx**: Main application container
- **WalletDashboard.tsx**: Wallet connection and feature toggles
- **DetectedGames.tsx**: Shows auto-detected games with recording controls
- **RewardsPanel.tsx**: Displays cross-chain rewards with claim functionality
- **ClipsGallery.tsx**: Gallery of recorded clips with stats

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

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details
