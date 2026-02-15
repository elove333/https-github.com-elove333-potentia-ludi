import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { getPortfolioBalances, getMoralisBalances } from '@/lib/services/alchemy';
import { logger } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(cookies(), sessionOptions);

    if (!session.isAuthenticated || !session.address) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const chainId = parseInt(searchParams.get('chainId') || '1');
    const includeNFTs = searchParams.get('includeNFTs') === 'true';

    // Try Alchemy first
    try {
      const balances = await getPortfolioBalances(session.address, chainId, includeNFTs);

      logger.info(
        {
          userId: session.userId,
          address: session.address,
          chainId,
          tokenCount: balances.tokens.length,
        },
        'Balances fetched'
      );

      return NextResponse.json(balances);
    } catch (alchemyError) {
      // Fallback to Moralis
      logger.warn({ alchemyError }, 'Alchemy failed, trying Moralis fallback');
      
      try {
        const balances = await getMoralisBalances(session.address, chainId);
        return NextResponse.json(balances);
      } catch (moralisError) {
        logger.error({ moralisError }, 'Moralis fallback also failed');
        throw moralisError;
      }
    }
  } catch (error) {
    logger.error({ error }, 'Error fetching balances');
    return NextResponse.json(
      { error: 'Failed to fetch balances' },
      { status: 500 }
    );
  }
}
