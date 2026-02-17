# Contributing Guide

Thank you for your interest in contributing to the Conversational Web3 Wallet Hub! This guide will help you understand how to extend the pipeline and integrate with APIs.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Git Workflows & Best Practices](#git-workflows--best-practices)
3. [Code Organization](#code-organization)
4. [Adding New Workflows](#adding-new-workflows)
5. [Integrating New APIs](#integrating-new-apis)
6. [Extending Intent Recognition](#extending-intent-recognition)
7. [Adding Safety Rules](#adding-safety-rules)
8. [Testing Guidelines](#testing-guidelines)
9. [Pull Request Process](#pull-request-process)

## Getting Started

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/https-github.com-elove333-potentia-ludi.git
   cd https-github.com-elove333-potentia-ludi
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

4. **Read Documentation**
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
   - [SETUP.md](./SETUP.md) - Local setup guide
   - [README.md](./README.md) - Feature overview
   - [GIT_WORKFLOWS.md](./GIT_WORKFLOWS.md) - Git workflows and conflict resolution

5. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Git Workflows & Best Practices

When contributing to this project, you may need to work with common Git operations like cherry-picking commits, resolving conflicts, or safely rewriting commit history. We've created comprehensive guides to help you:

**📖 [Git Workflows Guide](./GIT_WORKFLOWS.md)** - Complete reference with practical examples

This guide covers:
- **Cherry-picking commits** from one branch to another (e.g., hotfixes from feature to main)
- **Safely rewriting history** with `git reset --soft` and `--force-with-lease`
- **Resolving merge conflicts** during cherry-pick operations
- **Handling stash conflicts** when applying stashed changes
- **Safety tips and recovery strategies** using `git reflog`

**🛠️ [Git Tools & TUIs Guide](./GIT_TOOLS.md)** - Essential tools to enhance your Git workflow

Discover 25+ powerful Git tools including:
- **TUI Git Clients**: lazygit, tig, forgit, gitu, gitui for visual Git operations
- **Diff Tools**: delta, difftastic, diff-so-fancy for better code reviews
- **Hook Managers**: pre-commit, lefthook for automated code quality
- **History Management**: git-absorb, git-filter-repo, git-branchless
- **Security Tools**: git-secrets to prevent committing credentials
- **Collaboration**: mob.sh for pair programming, Commitizen for conventional commits
- And many more!

### Quick Git Tips for Contributors

- **Always create a backup branch** before any destructive operations
- **Use `--force-with-lease`** instead of `--force` when pushing rewrites
- **Cherry-pick with `-x`** to maintain traceability of commits
- **Check `git status` and `git diff`** immediately when conflicts occur
- **Use `git reflog`** to recover from mistakes

### Recommended Tool Setup

We recommend installing at least these tools to improve your development experience:

```bash
# Visual Git interface
brew install lazygit  # or your package manager

# Better diffs
brew install git-delta

# Git hooks framework
pip install pre-commit
pre-commit install

# Better shell prompt
brew install starship
```

See the [Git Tools Guide](./GIT_TOOLS.md) for complete installation instructions and usage examples.

## Code Organization

```
lib/
├── ai/                    # AI/NLP integration
│   └── openai.ts         # OpenAI API client and intent parsing
├── workflows/            # Intent workflow implementations
│   ├── balances.ts       # Balance queries
│   ├── swap.ts           # Token swaps
│   ├── bridge.ts         # Cross-chain transfers
│   └── index.ts          # Workflow registry
├── validation/           # Input validation and sanitization
├── execution/            # Transaction execution layer
├── safety/              # Risk scoring and safety checks
└── db/                  # Database schemas and migrations
    ├── schema.sql       # PostgreSQL schema
    └── redis.md         # Redis cache structure
```

### Import Aliases

The project uses path aliases for cleaner imports. When adding new files, use these aliases instead of relative paths:

```typescript
// ✅ Good - Use aliases
import { useStore } from '@/store';
import App from '@/components/App';

// ❌ Avoid - Relative paths
import { useStore } from '../../store';
import App from '../components/App';
```

**Available aliases:**
- `@/*` → `./src/*`
- `@/app/*` → `./src/app/*`

Configuration files: `vite.config.ts` and `tsconfig.json`

## Adding New Workflows

Workflows handle specific Web3 operations triggered by natural language intents.

### Step 1: Create Workflow File

Create a new file in `lib/workflows/`:

```typescript
// lib/workflows/nft-transfer.ts

import { Address } from 'viem';

export interface NFTTransferParams {
  contract: Address;
  tokenId: string;
  recipient: Address;
  chainId: number;
}

export interface NFTTransferResult {
  txHash: `0x${string}`;
  status: 'pending' | 'confirmed';
}

/**
 * Execute NFT transfer
 * 
 * @param params - Transfer parameters
 * @returns Transaction result
 */
export async function executeNFTTransfer(
  params: NFTTransferParams
): Promise<NFTTransferResult> {
  // 1. Validate parameters
  // 2. Check ownership
  // 3. Build transaction
  // 4. Simulate transaction
  // 5. Execute transfer
  // 6. Return result
  
  throw new Error('Not implemented');
}

/**
 * Validate NFT transfer parameters
 */
export async function validateNFTTransfer(
  params: NFTTransferParams
): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Add validation logic
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    riskLevel: 'MEDIUM',
  };
}

/**
 * Main workflow entry point
 */
export async function executeNFTTransferWorkflow(
  params: NFTTransferParams
): Promise<{
  validation: Awaited<ReturnType<typeof validateNFTTransfer>>;
  execution?: NFTTransferResult;
}> {
  const validation = await validateNFTTransfer(params);
  
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
  }
  
  const execution = await executeNFTTransfer(params);
  
  return { validation, execution };
}

// Export metadata for workflow registry
export const nftTransferWorkflowMetadata = {
  name: 'nft.transfer',
  description: 'Transfer NFTs to another address',
  examples: [
    'Send my Bored Ape #1234 to alice.eth',
    'Transfer NFT to 0x123...',
  ],
  intents: ['nft_transfer', 'send_nft'],
};
```

### Step 2: Register Workflow

Add to `lib/workflows/index.ts`:

```typescript
import { 
  nftTransferWorkflowMetadata,
  executeNFTTransferWorkflow,
} from './nft-transfer';

export const WORKFLOW_REGISTRY = {
  // ... existing workflows
  'nft.transfer': {
    metadata: nftTransferWorkflowMetadata,
    execute: executeNFTTransferWorkflow,
  },
} as const;
```

### Step 3: Update Intent Parser

Add to `lib/ai/openai.ts`:

```typescript
const INTENT_FUNCTIONS = [
  // ... existing functions
  {
    name: 'parse_nft_transfer',
    description: 'Parse a request to transfer an NFT',
    parameters: {
      type: 'object',
      required: ['contract', 'tokenId', 'recipient'],
      properties: {
        contract: {
          type: 'string',
          description: 'NFT contract address',
        },
        tokenId: {
          type: 'string',
          description: 'Token ID of the NFT',
        },
        recipient: {
          type: 'string',
          description: 'Recipient address or ENS name',
        },
        chainId: {
          type: 'number',
          description: 'Chain ID',
        },
      },
    },
  },
];
```

### Step 4: Add Tests

Create `lib/workflows/__tests__/nft-transfer.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { validateNFTTransfer } from '../nft-transfer';

describe('NFT Transfer Workflow', () => {
  it('should validate correct parameters', async () => {
    const result = await validateNFTTransfer({
      contract: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D' as any,
      tokenId: '1234',
      recipient: '0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4' as any,
      chainId: 1,
    });
    
    expect(result.valid).toBe(true);
  });
  
  it('should reject invalid recipient', async () => {
    const result = await validateNFTTransfer({
      contract: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D' as any,
      tokenId: '1234',
      recipient: 'invalid' as any,
      chainId: 1,
    });
    
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
```

## Integrating New APIs

### Example: Adding CoinGecko Price API

1. **Create API Client**

```typescript
// lib/apis/coingecko.ts

export class CoinGeckoClient {
  private apiKey: string;
  private baseUrl = 'https://api.coingecko.com/api/v3';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async getTokenPrice(
    tokenAddress: string,
    chainId: number
  ): Promise<number> {
    const platform = this.getPlatformId(chainId);
    const url = `${this.baseUrl}/simple/token_price/${platform}`;
    
    const response = await fetch(url, {
      headers: {
        'x-cg-pro-api-key': this.apiKey,
      },
      params: {
        contract_addresses: tokenAddress,
        vs_currencies: 'usd',
      },
    });
    
    const data = await response.json();
    return data[tokenAddress.toLowerCase()]?.usd || 0;
  }
  
  private getPlatformId(chainId: number): string {
    const platforms = {
      1: 'ethereum',
      137: 'polygon-pos',
      56: 'binance-smart-chain',
      42161: 'arbitrum-one',
      10: 'optimistic-ethereum',
      8453: 'base',
    };
    return platforms[chainId] || 'ethereum';
  }
}

// Export singleton instance
export const coingecko = new CoinGeckoClient(
  process.env.COINGECKO_API_KEY || ''
);
```

2. **Add Caching**

```typescript
import { redis } from '../db/redis';

export async function getTokenPriceWithCache(
  tokenAddress: string,
  chainId: number
): Promise<number> {
  const cacheKey = `price:${chainId}:${tokenAddress}:usd`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return parseFloat(cached);
  }
  
  // Fetch from API
  const price = await coingecko.getTokenPrice(tokenAddress, chainId);
  
  // Cache for 5 minutes
  await redis.set(cacheKey, price.toString(), 'EX', 300);
  
  return price;
}
```

3. **Use in Workflows**

```typescript
// In lib/workflows/balances.ts
import { getTokenPriceWithCache } from '../apis/coingecko';

export async function getTokenBalances(
  address: Address,
  chainId: number
): Promise<TokenBalance[]> {
  // ... fetch balances
  
  // Add USD values
  const balancesWithUSD = await Promise.all(
    balances.map(async (balance) => ({
      ...balance,
      usdValue: await getTokenPriceWithCache(
        balance.tokenAddress,
        chainId
      ) * Number(balance.balance) / 10 ** balance.decimals,
    }))
  );
  
  return balancesWithUSD;
}
```

## Extending Intent Recognition

### Adding New Intent Categories

1. **Define Intent Type**

```typescript
// lib/ai/openai.ts

export type IntentAction = 
  | 'balances.get'
  | 'trade.swap'
  | 'bridge.transfer'
  | 'nft.transfer'     // New
  | 'portfolio.analyze' // New
  | 'unknown';
```

2. **Add Function Definition**

```typescript
const INTENT_FUNCTIONS = [
  // ...
  {
    name: 'parse_portfolio_analysis',
    description: 'Parse a request to analyze portfolio',
    parameters: {
      type: 'object',
      properties: {
        timeframe: {
          type: 'string',
          enum: ['24h', '7d', '30d', 'all'],
          description: 'Analysis timeframe',
        },
        includeNFTs: {
          type: 'boolean',
          description: 'Include NFT valuations',
        },
      },
    },
  },
];
```

3. **Update System Prompt**

```typescript
const SYSTEM_PROMPT = `You are a helpful Web3 wallet assistant...

Your capabilities include:
1. Querying wallet balances, NFTs, and token approvals (balances.get)
2. Executing token swaps via DEX aggregators (trade.swap)
3. Bridging assets across chains (bridge.transfer)
4. Transferring NFTs (nft.transfer)              // New
5. Analyzing portfolios (portfolio.analyze)       // New
...`;
```

## Adding Safety Rules

Create custom validation rules for specific scenarios:

```typescript
// lib/safety/validators.ts

export interface SafetyRule {
  name: string;
  check: (params: any, context: any) => Promise<SafetyResult>;
  priority: number; // Higher = checked first
}

export interface SafetyResult {
  passed: boolean;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message?: string;
  recommendation?: string;
}

// Example: Large transaction warning
export const largeTransactionRule: SafetyRule = {
  name: 'large_transaction_check',
  priority: 100,
  check: async (params, context) => {
    const amountUSD = await convertToUSD(params.amount, params.token);
    
    if (amountUSD > 10000) {
      return {
        passed: false,
        level: 'HIGH',
        message: `Large transaction detected: $${amountUSD.toFixed(2)}`,
        recommendation: 'Consider splitting into smaller transactions',
      };
    }
    
    return { passed: true, level: 'LOW' };
  },
};

// Register rule
export const SAFETY_RULES: SafetyRule[] = [
  largeTransactionRule,
  // ... more rules
];
```

Use in workflows:

```typescript
export async function validateSwap(params: SwapParams) {
  // ... existing validation
  
  // Apply safety rules
  for (const rule of SAFETY_RULES) {
    const result = await rule.check(params, context);
    if (!result.passed && result.level === 'CRITICAL') {
      errors.push(result.message);
    } else if (!result.passed) {
      warnings.push(result.message);
    }
  }
  
  return { valid, errors, warnings, riskLevel };
}
```

## Testing Guidelines

### Unit Tests
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
```

### Test Structure
```typescript
describe('Workflow Name', () => {
  describe('validation', () => {
    it('should accept valid parameters', async () => {
      // Test happy path
    });
    
    it('should reject invalid parameters', async () => {
      // Test error cases
    });
  });
  
  describe('execution', () => {
    it('should execute successfully', async () => {
      // Test execution
    });
    
    it('should handle errors gracefully', async () => {
      // Test error handling
    });
  });
});
```

### Integration Tests
```typescript
// Test full workflow with mocked APIs
it('should complete swap workflow', async () => {
  // Mock external APIs
  const mockGetQuote = vi.fn().mockResolvedValue(mockQuote);
  
  // Execute workflow
  const result = await executeSwapWorkflow(params);
  
  // Verify results
  expect(result.success).toBe(true);
  expect(mockGetQuote).toHaveBeenCalled();
});
```

## Pull Request Process

1. **Ensure Quality**
   - All tests pass: `npm run test`
   - Linter passes: `npm run lint`
   - Types check: `npm run type-check`
   - Build succeeds: `npm run build`

2. **Update Documentation**
   - Add JSDoc comments to functions
   - Update README.md if adding features
   - Update ARCHITECTURE.md for significant changes

3. **Write Clear Commits**
   ```
   feat: Add NFT transfer workflow
   
   - Implement NFT transfer validation
   - Add ownership checks
   - Integrate with OpenSea API
   - Add tests for edge cases
   
   Closes #123
   ```

4. **Create Pull Request**
   - Clear title and description
   - Link related issues
   - Add screenshots for UI changes
   - Request review from maintainers

5. **Address Feedback**
   - Respond to all comments
   - Make requested changes
   - Re-request review

## Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Use Prettier (automatic)
- **Naming**:
  - Functions: `camelCase`
  - Types/Interfaces: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Files: `kebab-case.ts`
- **Comments**: JSDoc for public APIs
- **Error Handling**: Always use try-catch for async operations

## Getting Help

- **Documentation**: Read ARCHITECTURE.md and SETUP.md
- **Issues**: Search existing issues first
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our community server (link in README)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
