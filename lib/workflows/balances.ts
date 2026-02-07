/**
 * Balances Workflow - Query wallet balances, NFTs, and approvals
 * 
 * Part of the Conversational Web3 Wallet Hub
 * Handles natural language intents like:
 * - "Show my balance on Polygon"
 * - "What NFTs do I own?"
 * - "Check my token approvals"
 */

import { Address, parseAbiItem } from 'viem';
import { getPublicClient, getChainSymbol, getChainDecimals } from '../utils/chains';
import { ERC20_ABI } from '../utils/abis';

export interface Balance {
  address: Address;
  chainId: number;
  balance: bigint;
  symbol: string;
  decimals: number;
  usdValue?: number;
}

export interface TokenBalance extends Balance {
  tokenAddress: Address;
  name: string;
}

export interface NFT {
  contract: Address;
  tokenId: string;
  name?: string;
  image?: string;
  collection?: string;
  chainId: number;
}

export interface Approval {
  token: Address;
  spender: Address;
  amount: bigint;
  chainId: number;
  timestamp: number;
}

export interface BalancesWorkflowParams {
  address: Address;
  chainId?: number;
  tokens?: Address[];
  includeNFTs?: boolean;
  includeApprovals?: boolean;
}

/**
 * Fetch native token balance (ETH, MATIC, etc.)
 * 
 * @param address - Wallet address to query
 * @param chainId - Chain ID (1 for Ethereum, 137 for Polygon, etc.)
 * @returns Balance information
 */
export async function getNativeBalance(
  address: Address,
  chainId: number
): Promise<Balance> {
  const client = getPublicClient(chainId);
  const balance = await client.getBalance({ address });
  
  return {
    address,
    chainId,
    balance,
    symbol: getChainSymbol(chainId),
    decimals: getChainDecimals(chainId),
  };
}

/**
 * Fetch ERC20 token balances
 * 
 * @param address - Wallet address to query
 * @param chainId - Chain ID
 * @param tokens - Optional list of token addresses. If not provided, returns empty array.
 * @returns Array of token balances (only non-zero balances)
 */
export async function getTokenBalances(
  address: Address,
  chainId: number,
  tokens?: Address[]
): Promise<TokenBalance[]> {
  if (!tokens || tokens.length === 0) {
    return [];
  }

  const client = getPublicClient(chainId);
  
  // Fetch balances for all tokens in parallel
  const balancePromises = tokens.map(async (tokenAddress) => {
    try {
      // Read token balance
      const balance = await client.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      }) as bigint;

      // Skip if balance is zero
      if (balance === 0n) {
        return null;
      }

      // Fetch token metadata in parallel
      const [name, symbol, decimals] = await Promise.all([
        client.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'name',
        }) as Promise<string>,
        client.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'symbol',
        }) as Promise<string>,
        client.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'decimals',
        }) as Promise<number>,
      ]);

      return {
        address,
        chainId,
        balance,
        symbol,
        decimals,
        tokenAddress,
        name,
      };
    } catch (error) {
      console.error(`Failed to fetch balance for token ${tokenAddress}:`, error);
      return null;
    }
  });

  const results = await Promise.all(balancePromises);
  return results.filter((result): result is TokenBalance => result !== null);
}

/**
 * Fetch NFT holdings
 * 
 * @param address - Wallet address to query
 * @param chainId - Chain ID
 * @returns Array of NFTs owned by the address
 * 
 * TODO: Integrate with NFT APIs (Alchemy, Moralis, OpenSea)
 * TODO: Fetch metadata (name, image, attributes)
 * TODO: Cache with longer TTL (5 minutes)
 */
export async function getNFTs(
  address: Address,
  chainId: number
): Promise<NFT[]> {
  // PLACEHOLDER: Implement actual NFT fetching
  throw new Error('getNFTs not yet implemented');
  
  // Example implementation:
  // const alchemyClient = getAlchemyClient(chainId);
  // const nfts = await alchemyClient.nft.getNftsForOwner(address);
  // 
  // return nfts.ownedNfts.map((nft) => ({
  //   contract: nft.contract.address,
  //   tokenId: nft.tokenId,
  //   name: nft.title,
  //   image: nft.media[0]?.gateway,
  //   collection: nft.contract.name,
  //   chainId,
  // }));
}

/**
 * Check token approvals granted by the user
 * 
 * @param address - Wallet address to query
 * @param chainId - Chain ID
 * @returns Array of active approvals (with non-zero allowances)
 * 
 * Note: This is a placeholder implementation that scans recent approval events.
 * For production use, consider using specialized APIs like Etherscan or Alchemy
 * to get comprehensive approval history, as scanning all historical events
 * can be resource-intensive and may hit RPC limits.
 */
export async function getApprovals(
  address: Address,
  chainId: number
): Promise<Approval[]> {
  const client = getPublicClient(chainId);
  
  try {
    // Get current block to limit the scan range
    const currentBlock = await client.getBlockNumber();
    // Scan last 10000 blocks (roughly 1-2 days on most chains)
    const fromBlock = currentBlock - 10000n;
    
    // Scan for Approval events where this address is the owner
    const logs = await client.getLogs({
      event: parseAbiItem('event Approval(address indexed owner, address indexed spender, uint256 value)'),
      args: {
        owner: address,
      },
      fromBlock,
      toBlock: 'latest',
    });

    // For each unique token-spender pair, check current allowance
    const approvalMap = new Map<string, { token: Address; spender: Address }>();
    
    for (const log of logs) {
      if (log.args.owner && log.args.spender) {
        const key = `${log.address}-${log.args.spender}`;
        approvalMap.set(key, {
          token: log.address,
          spender: log.args.spender,
        });
      }
    }

    // Check current allowances for all approval pairs
    const approvalPromises = Array.from(approvalMap.values()).map(async ({ token, spender }) => {
      try {
        const allowance = await client.readContract({
          address: token,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address, spender],
        }) as bigint;

        // Only return approvals with non-zero allowance
        if (allowance === 0n) {
          return null;
        }

        return {
          token,
          spender,
          amount: allowance,
          chainId,
          timestamp: Date.now(), // Use current time as we don't track historical timestamp
        };
      } catch (error) {
        console.error(`Failed to check allowance for ${token} to ${spender}:`, error);
        return null;
      }
    });

    const results = await Promise.all(approvalPromises);
    return results.filter((result): result is Approval => result !== null);
  } catch (error) {
    console.error('Failed to scan approval events:', error);
    // Return empty array if scanning fails (e.g., RPC limits)
    return [];
  }
}

/**
 * Main entry point for balances workflow
 * Processes intent and returns comprehensive balance information
 * 
 * @param params - Workflow parameters
 * @returns Complete balance information based on requested data
 */
type BalancesWorkflowResult = {
  native?: Balance;
  tokens?: TokenBalance[];
  nfts?: NFT[];
  approvals?: Approval[];
};

export async function executeBalancesWorkflow(
  params: BalancesWorkflowParams
): Promise<BalancesWorkflowResult> {
  const result: BalancesWorkflowResult = {};
  
  // Always fetch native balance
  try {
    result.native = await getNativeBalance(params.address, params.chainId || 1);
  } catch (error) {
    console.error('Failed to fetch native balance:', error);
  }
  
  // Fetch tokens if requested
  if (params.tokens !== undefined) {
    try {
      result.tokens = await getTokenBalances(
        params.address,
        params.chainId || 1,
        params.tokens
      );
    } catch (error) {
      console.error('Failed to fetch token balances:', error);
    }
  }
  
  // Fetch NFTs if requested
  if (params.includeNFTs) {
    try {
      result.nfts = await getNFTs(params.address, params.chainId || 1);
    } catch (error) {
      console.error('Failed to fetch NFTs:', error);
    }
  }
  
  // Fetch approvals if requested
  if (params.includeApprovals) {
    try {
      result.approvals = await getApprovals(params.address, params.chainId || 1);
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    }
  }
  
  return result;
}

// Export workflow metadata for intent parser
export const balancesWorkflowMetadata = {
  name: 'balances.get',
  description: 'Query wallet balances, NFTs, and token approvals',
  examples: [
    'Show my balance',
    'What\'s my balance on Polygon?',
    'Check my USDC balance',
    'What NFTs do I own?',
    'Show my token approvals',
  ],
  intents: [
    'balance_query',
    'nft_query',
    'approval_query',
  ],
};
