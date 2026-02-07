// Get Token Balances API Route
// Fetches wallet balances via Alchemy

import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

interface TokenBalance {
  contractAddress: string;
  tokenBalance: string;
  error?: string;
}

interface AlchemyTokenBalancesResponse {
  address: string;
  tokenBalances: TokenBalance[];
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { address, chainId } = req.body;

    console.log('💰 Get token balances requested');
    console.log('🔗 Address:', address);
    console.log('🔗 Chain ID:', chainId);

    if (!address) {
      console.log('❌ Missing address parameter');
      return res.status(400).json({ error: 'Address is required' });
    }

    // Get Alchemy API key based on chain
    let alchemyApiKey: string | undefined;
    let alchemyNetwork: string;

    switch (chainId) {
      case 1:
        alchemyApiKey = process.env.ALCHEMY_API_KEY_MAINNET;
        alchemyNetwork = 'eth-mainnet';
        break;
      case 137:
        alchemyApiKey = process.env.ALCHEMY_API_KEY_POLYGON;
        alchemyNetwork = 'polygon-mainnet';
        break;
      case 42161:
        alchemyApiKey = process.env.ALCHEMY_API_KEY_ARBITRUM;
        alchemyNetwork = 'arb-mainnet';
        break;
      case 10:
        alchemyApiKey = process.env.ALCHEMY_API_KEY_OPTIMISM;
        alchemyNetwork = 'opt-mainnet';
        break;
      case 8453:
        alchemyApiKey = process.env.ALCHEMY_API_KEY_BASE;
        alchemyNetwork = 'base-mainnet';
        break;
      default:
        alchemyApiKey = process.env.ALCHEMY_API_KEY_POLYGON;
        alchemyNetwork = 'polygon-mainnet';
    }

    if (!alchemyApiKey) {
      console.log('❌ ALCHEMY_API_KEY not configured for chain', chainId);
      return res.status(500).json({ error: 'Alchemy API key not configured for this chain' });
    }

    console.log('🔗 Using Alchemy network:', alchemyNetwork);

    // Call Alchemy API
    const alchemyUrl = `https://${alchemyNetwork}.g.alchemy.com/v2/${alchemyApiKey}`;
    
    console.log('🔗 Calling Alchemy API...');
    
    const response = await axios.post<AlchemyTokenBalancesResponse>(alchemyUrl, {
      jsonrpc: '2.0',
      id: 1,
      method: 'alchemy_getTokenBalances',
      params: [address]
    });

    console.log('✅ Alchemy API response received');
    console.log('💰 Token balances count:', response.data.tokenBalances?.length || 0);

    // Filter out tokens with zero balance or errors
    const nonZeroBalances = response.data.tokenBalances?.filter(
      (token) => token.tokenBalance && token.tokenBalance !== '0x0' && !token.error
    ) || [];

    console.log('💰 Non-zero balances:', nonZeroBalances.length);

    res.json({
      address,
      chainId,
      balances: nonZeroBalances,
      totalCount: nonZeroBalances.length
    });

  } catch (error) {
    console.error('❌ Get token balances error:', error);
    res.status(500).json({
      error: 'Failed to fetch token balances',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
