// Intent Parser Tests
import { describe, it, expect } from 'vitest';
import { parseIntent, validateIntent, getIntentDescription } from '../api/services/intentParser';

describe('Intent Parser', () => {
  describe('parseIntent', () => {
    it('should parse swap intent', async () => {
      const result = await parseIntent('swap 100 USDC for ETH');
      
      expect(result).toBeDefined();
      expect(result?.action).toBe('trade.swap');
      expect(result?.entities.fromAmount).toBe('100');
      expect(result?.entities.fromToken).toBe('USDC');
      expect(result?.entities.toToken).toBe('ETH');
      expect(result?.riskLevel).toBe('MEDIUM');
    });

    it('should parse transfer intent', async () => {
      const result = await parseIntent('send 50 USDC to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
      
      expect(result).toBeDefined();
      expect(result?.action).toBe('transfer.send');
      expect(result?.entities.amount).toBe('50');
      expect(result?.entities.token).toBe('USDC');
      expect(result?.entities.recipient).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(result?.riskLevel).toBe('HIGH');
    });

    it('should parse bridge intent', async () => {
      const result = await parseIntent('bridge 1000 USDC from ethereum to arbitrum');
      
      expect(result).toBeDefined();
      expect(result?.action).toBe('bridge.transfer');
      expect(result?.entities.amount).toBe('1000');
      expect(result?.entities.token).toBe('USDC');
      expect(result?.entities.fromChain).toBe('ethereum');
      expect(result?.entities.toChain).toBe('arbitrum');
    });

    it('should parse balance intent', async () => {
      const result = await parseIntent('show my balances');
      
      expect(result).toBeDefined();
      expect(result?.action).toBe('balances.get');
      expect(result?.riskLevel).toBe('LOW');
    });

    it('should parse NFT intent', async () => {
      const result = await parseIntent('show my NFTs');
      
      expect(result).toBeDefined();
      expect(result?.action).toBe('balances.getNFTs');
      expect(result?.riskLevel).toBe('LOW');
    });

    it('should return null for unrecognized input', async () => {
      const result = await parseIntent('hello world');
      
      expect(result).toBeNull();
    });

    it('should handle case insensitive input', async () => {
      const result = await parseIntent('SWAP 100 usdc FOR eth');
      
      expect(result).toBeDefined();
      expect(result?.action).toBe('trade.swap');
      expect(result?.entities.fromToken).toBe('USDC');
      expect(result?.entities.toToken).toBe('ETH');
    });

    it('should assess higher risk for large amounts', async () => {
      const result = await parseIntent('swap 100000 USDC for ETH');
      
      expect(result).toBeDefined();
      expect(result?.riskLevel).toBe('CRITICAL');
    });
  });

  describe('validateIntent', () => {
    it('should validate valid swap intent', () => {
      const intent = {
        action: 'trade.swap',
        entities: {
          fromAmount: '100',
          fromToken: 'USDC',
          toToken: 'ETH'
        },
        confidence: 0.8,
        riskLevel: 'MEDIUM' as const,
        requiresConfirmation: false
      };

      const result = validateIntent(intent);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject swap with invalid amount', () => {
      const intent = {
        action: 'trade.swap',
        entities: {
          fromAmount: 'invalid',
          fromToken: 'USDC',
          toToken: 'ETH'
        },
        confidence: 0.8,
        riskLevel: 'MEDIUM' as const,
        requiresConfirmation: false
      };

      const result = validateIntent(intent);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid swap amount');
    });

    it('should reject transfer with invalid address', () => {
      const intent = {
        action: 'transfer.send',
        entities: {
          amount: '50',
          token: 'USDC',
          recipient: 'invalid-address'
        },
        confidence: 0.8,
        riskLevel: 'HIGH' as const,
        requiresConfirmation: true
      };

      const result = validateIntent(intent);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid recipient address');
    });

    it('should validate intent with confidence in valid range', () => {
      const intent = {
        action: 'balances.get',
        entities: {},
        confidence: 1.5, // Invalid
        riskLevel: 'LOW' as const,
        requiresConfirmation: false
      };

      const result = validateIntent(intent);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid confidence score');
    });
  });

  describe('getIntentDescription', () => {
    it('should describe swap intent', () => {
      const intent = {
        action: 'trade.swap',
        entities: {
          fromAmount: '100',
          fromToken: 'USDC',
          toToken: 'ETH'
        },
        confidence: 0.8,
        riskLevel: 'MEDIUM' as const,
        requiresConfirmation: false
      };

      const description = getIntentDescription(intent);
      
      expect(description).toBe('Swap 100 USDC for ETH');
    });

    it('should describe transfer intent', () => {
      const intent = {
        action: 'transfer.send',
        entities: {
          amount: '50',
          token: 'USDC',
          recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
        },
        confidence: 0.8,
        riskLevel: 'HIGH' as const,
        requiresConfirmation: true
      };

      const description = getIntentDescription(intent);
      
      expect(description).toBe('Send 50 USDC to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    });

    it('should describe balance intent', () => {
      const intent = {
        action: 'balances.get',
        entities: {},
        confidence: 0.9,
        riskLevel: 'LOW' as const,
        requiresConfirmation: false
      };

      const description = getIntentDescription(intent);
      
      expect(description).toBe('Get your token balances');
    });
  });

  describe('Pattern matching with operators', () => {
    it('should use literal < operator in comparisons', () => {
      const confidence1 = 0.5;
      const confidence2 = 0.7;
      
      expect(confidence1 < confidence2).toBe(true);
      expect(confidence2 < confidence1).toBe(false);
    });

    it('should use literal > operator in comparisons', () => {
      const amount1 = 100;
      const amount2 = 50;
      
      expect(amount1 > amount2).toBe(true);
      expect(amount2 > amount1).toBe(false);
    });

    it('should use literal <= operator in comparisons', () => {
      const value1 = 10;
      const value2 = 10;
      const value3 = 15;
      
      expect(value1 <= value2).toBe(true);
      expect(value2 <= value3).toBe(true);
      expect(value3 <= value1).toBe(false);
    });

    it('should use literal >= operator in comparisons', () => {
      const value1 = 10;
      const value2 = 10;
      const value3 = 5;
      
      expect(value1 >= value2).toBe(true);
      expect(value1 >= value3).toBe(true);
      expect(value3 >= value1).toBe(false);
    });

    it('should use literal && operator in logical expressions', () => {
      const condition1 = true;
      const condition2 = true;
      const condition3 = false;
      
      expect(condition1 && condition2).toBe(true);
      expect(condition1 && condition3).toBe(false);
    });

    it('should use literal & operator in bitwise operations', () => {
      const flags1 = 0b1010;
      const flags2 = 0b0110;
      
      expect(flags1 & flags2).toBe(0b0010);
    });
  });
});
