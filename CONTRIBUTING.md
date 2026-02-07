# Contributing to Potentia Ludi

Thank you for your interest in contributing to the Conversational Web3 Wallet Hub! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Contributing Guidelines](#contributing-guidelines)
- [Extension Points](#extension-points)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and constructive in all interactions.

## Getting Started

### Prerequisites

1. Read the [SETUP.md](./SETUP.md) guide to set up your development environment
2. Review the [ARCHITECTURE.md](./ARCHITECTURE.md) to understand the system design
3. Familiarize yourself with the codebase structure

### First Time Contributors

Good first issues for new contributors:

- 🟢 **Documentation improvements**: Fix typos, add examples, clarify instructions
- 🟢 **Type definitions**: Add or improve TypeScript types
- 🟡 **UI enhancements**: Improve component styling or add new UI elements
- 🟡 **Test coverage**: Add tests for existing functionality
- 🔴 **New features**: Implement new workflows or integrations

Issues are labeled by difficulty:
- `good-first-issue`: Perfect for newcomers
- `help-wanted`: We need community help on these
- `enhancement`: New feature requests
- `bug`: Something isn't working

## Development Process

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/https-github.com-elove333-potentia-ludi.git
cd https-github.com-elove333-potentia-ludi

# Add upstream remote
git remote add upstream https://github.com/elove333/https-github.com-elove333-potentia-ludi.git
```

### 2. Create a Branch

```bash
# Update your fork
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Branch naming conventions:
# - feature/add-nft-support
# - fix/balance-cache-bug
# - docs/update-setup-guide
# - refactor/simplify-intent-parser
```

### 3. Make Changes

Follow the [Coding Standards](#coding-standards) section below.

### 4. Test Your Changes

```bash
# Run linter
npm run lint

# Run tests
npm test

# Test manually
npm run dev
# Open http://localhost:3000
```

### 5. Commit Changes

```bash
# Stage changes
git add .

# Commit with clear message
git commit -m "Add feature: description of what you added"

# Commit message format:
# - "Add feature: [description]"
# - "Fix: [bug description]"
# - "Docs: [documentation changes]"
# - "Refactor: [what was refactored]"
# - "Test: [test additions/changes]"
```

### 6. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Go to GitHub and create a Pull Request
```

## Contributing Guidelines

### Areas for Contribution

#### 1. Conversational AI Pipeline

**Adding New Intents**

To add support for a new intent (e.g., `staking.deposit`):

1. Create type definitions in `src/workflows/staking/types.ts`:

```typescript
export interface StakingDepositParams {
  chainId: number;
  amount: bigint;
  validator?: string;
}
```

2. Implement the workflow in `src/workflows/staking/staking.deposit.ts`:

```typescript
export async function stakingDeposit(params: StakingDepositParams): Promise<StakingResult> {
  // Implementation
}
```

3. Update the OpenAI system prompt in `src/ai/openai-client.ts` to recognize the new intent

4. Add tests for the new intent

#### 2. Workflow Extensions

**Integrating a New Chain**

1. Add chain configuration to workflow files:

```typescript
const CHAIN_CONFIG = {
  // ... existing chains
  324: zkSync, // Add new chain
};
```

2. Update RPC configuration in `.env.example`:

```env
RPC_URL_ZKSYNC=https://mainnet.era.zksync.io
```

3. Test all workflows on the new chain

**Adding a DEX Integration**

1. Create DEX adapter in `src/workflows/trade/adapters/`:

```typescript
export class UniswapV2Adapter implements DEXAdapter {
  async getQuote(params: QuoteParams): Promise<Quote> {
    // Implementation
  }
}
```

2. Register adapter in `src/workflows/trade/trade.quote.ts`

3. Add configuration to environment variables

#### 3. Backend Infrastructure

**Database Schema Changes**

1. Create migration file in `src/backend/database/migrations/`:

```sql
-- 001_add_staking_table.sql
CREATE TABLE staking_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_address VARCHAR(42) NOT NULL,
  -- ... other fields
);
```

2. Update `client.ts` with new query methods

**Redis Cache Strategies**

1. Add new cache key in `src/backend/cache/redis-client.ts`:

```typescript
export const CacheKeys = {
  // ... existing keys
  staking: (address: string, chainId: number) =>
    `staking:${chainId}:${address}`,
};
```

2. Implement cache logic with appropriate TTL

#### 4. Safety and Validation

**Adding Custom Safety Rules**

1. Add validation in `src/workflows/shared/validation.ts`:

```typescript
export function validateStakingAmount(amount: bigint, minimum: bigint): void {
  if (amount < minimum) {
    throw new Error(`Amount below minimum stake of ${minimum}`);
  }
}
```

2. Integrate into workflow execution

3. Add tests for edge cases

#### 5. UI/UX Improvements

**Adding New Components**

1. Create component in `src/components/`:

```typescript
export function ChatInterface({ onMessage }: ChatInterfaceProps) {
  // Implementation
}
```

2. Add component to main app

3. Style consistently with existing components

## Extension Points

The architecture is designed to be extensible. See [ARCHITECTURE.md - Extension Points](./ARCHITECTURE.md#extension-points) for detailed guides on:

- Adding new intents
- Integrating new chains
- Custom DEX integration
- Custom safety rules

## Pull Request Process

### Before Submitting

- ✅ Code follows the style guidelines
- ✅ All tests pass
- ✅ Linter passes with no errors
- ✅ Documentation is updated
- ✅ Commit messages are clear
- ✅ Branch is up to date with main

### PR Template

When creating a PR, include:

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Other (specify)

## Testing
How to test these changes:
1. Step 1
2. Step 2
3. Expected result

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes (or breaking changes documented)

## Screenshots (if applicable)
Add screenshots for UI changes
```

### Review Process

1. **Automated Checks**: CI will run linting and tests
2. **Code Review**: Maintainers will review your code
3. **Discussion**: Address feedback and make requested changes
4. **Approval**: Once approved, your PR will be merged

### After Merge

Your contribution will be:
- Merged into the main branch
- Included in the next release
- Credited in release notes

## Coding Standards

### TypeScript

```typescript
// ✅ Good: Clear types and JSDoc comments
/**
 * Get balance for a wallet address
 * @param address - Wallet address to check
 * @param chainId - Chain ID to query
 * @returns Balance information
 */
export async function getBalance(
  address: Address,
  chainId: number
): Promise<Balance> {
  // Implementation
}

// ❌ Bad: No types or documentation
export async function getBalance(address, chainId) {
  // Implementation
}
```

### Code Organization

```typescript
// ✅ Good: Organized imports
import { Address } from 'viem';
import { Balance } from './types';
import { validateAddress } from '../shared/validation';

// ❌ Bad: Messy imports
import { validateAddress } from '../shared/validation';
import { Address } from 'viem';
import { Balance } from './types';
```

### Error Handling

```typescript
// ✅ Good: Specific error messages
if (!address) {
  throw new Error('Address is required');
}

// ❌ Bad: Generic error
if (!address) {
  throw new Error('Invalid input');
}
```

### Comments

```typescript
// ✅ Good: Explain why, not what
// Cache balance for 30 seconds to reduce RPC calls
await redis.set(key, balance, 30);

// ❌ Bad: Obvious comment
// Set balance in cache
await redis.set(key, balance, 30);
```

### Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `balance-tracker.ts`)
- **Functions**: `camelCase` (e.g., `getBalance`)
- **Classes**: `PascalCase` (e.g., `IntentParser`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `MAX_RETRIES`)
- **Types/Interfaces**: `PascalCase` (e.g., `BalanceParams`)

### File Structure

```
src/
├── workflows/           # Business logic
│   ├── balances/
│   │   ├── types.ts    # Types first
│   │   ├── *.get.ts    # Main implementations
│   │   └── *.track.ts
│   └── shared/         # Shared utilities
├── ai/                 # AI/NLP components
├── backend/            # Backend services
└── components/         # React components
```

## Questions?

- Open an issue with the `question` label
- Check existing issues for answers
- Review [ARCHITECTURE.md](./ARCHITECTURE.md) for design details
- See [SETUP.md](./SETUP.md) for environment setup

## License

By contributing, you agree that your contributions will be licensed under the same MIT License that covers this project.

---

Thank you for contributing to Potentia Ludi! 🚀
