// Alchemy API integration for portfolio and NFT data
import axios from 'axios';
import { logger } from '@/lib/db/client';
import { cacheGet, cacheSet } from '@/lib/db/redis';

const ALCHEMY_BASE_URL = 'https://api.g.alchemy.com';
const CACHE_TTL = 30; // 30 seconds for balances

export interface TokenBalance {
  contractAddress: string;
  tokenBalance: string;
  symbol?: string;
  name?: string;
  decimals?: number;
  logo?: string;
}

export interface NFTBalance {
  contract: {
    address: string;
    name?: string;
  };
  tokenId: string;
  balance: string;
  title?: string;
  description?: string;
  media?: Array<{ gateway: string }>;
}

export interface BalancesResponse {
  address: string;
  nativeBalance: string;
  tokens: TokenBalance[];
  nfts?: NFTBalance[];
}

export async function getPortfolioBalances(
  address: string,
  chainId: number,
  includeNFTs: boolean = false
): Promise<BalancesResponse> {
  const cacheKey = `balances:${chainId}:${address}:${includeNFTs}`;
  
  // Check cache
  const cached = await cacheGet<BalancesResponse>(cacheKey);
  if (cached) {
    logger.debug({ cacheKey }, 'Returning cached balances');
    return cached;
  }

  try {
    const apiKey = process.env.ALCHEMY_API_KEY;
    if (!apiKey) {
      throw new Error('ALCHEMY_API_KEY not configured');
    }

    const network = getAlchemyNetwork(chainId);
    const baseUrl = `${ALCHEMY_BASE_URL}/${network}/${apiKey}`;

    // Get native balance
    const nativeBalanceResponse = await axios.post(baseUrl, {
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getBalance',
      params: [address, 'latest'],
    });

    const nativeBalance = nativeBalanceResponse.data.result;

    // Get token balances
    const tokenBalancesResponse = await axios.post(baseUrl, {
      jsonrpc: '2.0',
      id: 2,
      method: 'alchemy_getTokenBalances',
      params: [address, 'DEFAULT_TOKENS'],
    });

    const tokens = tokenBalancesResponse.data.result.tokenBalances
      .filter((t: any) => BigInt(t.tokenBalance || '0') > 0n)
      .map((t: any) => ({
        contractAddress: t.contractAddress,
        tokenBalance: t.tokenBalance,
      }));

    let nfts: NFTBalance[] | undefined;
    if (includeNFTs) {
      const nftResponse = await axios.get(`${baseUrl}/getNFTs`, {
        params: { owner: address },
      });
      nfts = nftResponse.data.ownedNfts || [];
    }

    const result: BalancesResponse = {
      address,
      nativeBalance,
      tokens,
      nfts,
    };

    // Cache the result
    await cacheSet(cacheKey, result, CACHE_TTL);

    return result;
  } catch (error) {
    logger.error({ error, address, chainId }, 'Error fetching Alchemy balances');
    throw new Error('Failed to fetch balances');
  }
}

function getAlchemyNetwork(chainId: number): string {
  const networks: Record<number, string> = {
    1: 'eth-mainnet',
    137: 'polygon-mainnet',
    10: 'opt-mainnet',
    42161: 'arb-mainnet',
    8453: 'base-mainnet',
  };
  
  return networks[chainId] || 'eth-mainnet';
}

// Moralis fallback (stub - would need actual implementation)
export async function getMoralisBalances(
  _address: string,
  _chainId: number
): Promise<BalancesResponse> {
  logger.warn('Moralis fallback not fully implemented');
  throw new Error('Moralis fallback not available');
}
