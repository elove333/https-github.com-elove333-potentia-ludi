// 0x API integration for DEX quotes
import axios from 'axios';
import { logger } from '@/lib/db/client';
import { cacheGet, cacheSet } from '@/lib/db/redis';

const ZEROX_API_BASE = 'https://api.0x.org';
const CACHE_TTL = 15; // 15 seconds for quotes

export interface SwapQuote {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  buyAmount: string;
  price: string;
  guaranteedPrice: string;
  to: string;
  data: string;
  value: string;
  gas: string;
  gasPrice: string;
  protocolFee: string;
  minimumProtocolFee: string;
  buyTokenAddress: string;
  sellTokenAddress: string;
  estimatedGas: string;
  allowanceTarget: string;
  sources: Array<{
    name: string;
    proportion: string;
  }>;
}

export async function getSwapQuote(
  chainId: number,
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  slippagePercentage: number = 1,
  userAddress?: string
): Promise<SwapQuote> {
  const cacheKey = `quote:${chainId}:${sellToken}:${buyToken}:${sellAmount}:${slippagePercentage}`;
  
  // Check cache first
  const cached = await cacheGet<SwapQuote>(cacheKey);
  if (cached) {
    logger.debug({ cacheKey }, 'Returning cached quote');
    return cached;
  }

  try {
    const params = new URLSearchParams({
      sellToken,
      buyToken,
      sellAmount,
      slippagePercentage: slippagePercentage.toString(),
      ...(userAddress && { takerAddress: userAddress }),
    });

    const url = `${ZEROX_API_BASE}/swap/v1/quote?${params}`;
    
    logger.info({ url, chainId }, 'Fetching 0x quote');
    
    const response = await axios.get<SwapQuote>(url, {
      headers: {
        '0x-api-key': process.env.ZEROX_API_KEY || '',
        '0x-chain-id': chainId.toString(),
      },
      timeout: 10000,
    });

    const quote = response.data;
    
    // Cache the quote
    await cacheSet(cacheKey, quote, CACHE_TTL);
    
    return quote;
  } catch (error) {
    logger.error({ error, chainId, sellToken, buyToken }, 'Error fetching 0x quote');
    throw new Error('Failed to fetch swap quote');
  }
}

export async function getSwapQuoteWithFallback(
  chainId: number,
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  slippagePercentage: number = 1,
  userAddress?: string,
  useUniswapOnly: boolean = false
): Promise<SwapQuote> {
  try {
    // Primary: Use 0x API
    return await getSwapQuote(chainId, sellToken, buyToken, sellAmount, slippagePercentage, userAddress);
  } catch (error) {
    if (useUniswapOnly) {
      // Fallback: Uniswap-only (not implemented - would need Uniswap SDK)
      logger.warn('Uniswap-only fallback not implemented');
      throw error;
    }
    throw error;
  }
}
