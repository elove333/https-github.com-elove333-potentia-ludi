// Tests for Intent Parser
import { describe, it, expect } from 'vitest';
import { IntentParser, validateIntent } from '../api/services/intentParser';

describe('IntentParser', () => {
  const testAddress = '0x742d35Cc6634C0532925a3b8D7De2665B81b5fE4';

  describe('Balance queries', () => {
    it('should parse simple balance check', () => {
      const intent = IntentParser.parse('check my balance', testAddress);
      expect(intent.type).toBe('balances.get');
      expect(intent.takerAddress).toBe(testAddress);
    });

    it('should parse balance with approvals', () => {
      const intent = IntentParser.parse('show my balances with approvals', testAddress);
      expect(intent.type).toBe('balances.get');
      expect(intent.includeApprovals).toBe(true);
    });

    it('should parse balance with NFTs', () => {
      const intent = IntentParser.parse('check my NFTs', testAddress);
      expect(intent.type).toBe('balances.get');
      expect(intent.includeNFTs).toBe(true);
    });
  });

  describe('Swap intents', () => {
    it('should parse basic swap', () => {
      const intent = IntentParser.parse('swap 100 USDC to ETH', testAddress);
      expect(intent.type).toBe('trade.swap');
      expect(intent.from.token).toBe('USDC');
      expect(intent.from.amount).toBe('100');
      expect(intent.to.token).toBe('ETH');
    });

    it('should parse swap with slippage', () => {
      const intent = IntentParser.parse('swap 100 USDC to ETH with 1% slippage', testAddress);
      expect(intent.type).toBe('trade.swap');
      expect(intent.constraints?.slippage_bps).toBe(100);
    });

    it('should parse swap with Uniswap preference', () => {
      const intent = IntentParser.parse('swap 100 USDC to ETH using Uniswap', testAddress);
      expect(intent.type).toBe('trade.swap');
      expect(intent.constraints?.prefer_sources).toContain('Uniswap_V3');
    });

    it('should parse swap on specific chain', () => {
      const intent = IntentParser.parse('swap 100 USDC to ETH on polygon', testAddress);
      expect(intent.type).toBe('trade.swap');
      expect(intent.chainId).toBe(137);
    });
  });

  describe('Bridge intents', () => {
    it('should parse basic bridge', () => {
      const intent = IntentParser.parse('bridge 1000 USDC from polygon to ethereum', testAddress);
      expect(intent.type).toBe('bridge.transfer');
      expect(intent.from.token).toBe('USDC');
      expect(intent.from.amount).toBe('1000');
      expect(intent.from.chain).toBe('polygon');
      expect(intent.to.chain).toBe('ethereum');
    });
  });

  describe('Rewards intents', () => {
    it('should parse claim all', () => {
      const intent = IntentParser.parse('claim all my rewards', testAddress);
      expect(intent.type).toBe('rewards.claim');
      expect(intent.claimAll).toBe(true);
    });

    it('should parse simple claim', () => {
      const intent = IntentParser.parse('claim my airdrop', testAddress);
      expect(intent.type).toBe('rewards.claim');
    });
  });

  describe('Validation', () => {
    it('should validate valid swap intent', () => {
      const intent = IntentParser.parse('swap 100 USDC to ETH', testAddress);
      const validation = validateIntent(intent);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject invalid address', () => {
      const intent = {
        type: 'balances.get' as const,
        takerAddress: 'invalid',
        chainId: 1,
      };
      const validation = validateIntent(intent);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Invalid taker address');
    });

    it('should reject zero amount swap', () => {
      const intent = {
        type: 'trade.swap' as const,
        takerAddress: testAddress,
        chainId: 1,
        from: { token: 'USDC', amount: '0', chain: 'ethereum' },
        to: { token: 'ETH', chain: 'ethereum' },
      };
      const validation = validateIntent(intent);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Invalid swap amount');
    });

    it('should reject bridge to same chain', () => {
      const intent = {
        type: 'bridge.transfer' as const,
        takerAddress: testAddress,
        chainId: 1,
        from: { token: 'USDC', amount: '100', chain: 'ethereum' },
        to: { chain: 'ethereum' },
      };
      const validation = validateIntent(intent);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Cannot bridge to the same chain');
    });
  });
});
