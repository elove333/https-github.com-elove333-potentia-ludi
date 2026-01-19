import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from '@/lib/auth/session';
import { aggregateRewards } from '@/lib/services/rewards';
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
    const platformsParam = searchParams.get('platforms');
    const platforms = platformsParam 
      ? platformsParam.split(',') as Array<'galxe' | 'rabbithole' | 'layer3'>
      : undefined;

    const rewards = await aggregateRewards(session.address, platforms);

    logger.info(
      {
        userId: session.userId,
        address: session.address,
        rewardCount: rewards.length,
        claimableCount: rewards.filter(r => r.claimable).length,
      },
      'Rewards fetched'
    );

    return NextResponse.json({
      address: session.address,
      rewards,
      summary: {
        total: rewards.length,
        claimable: rewards.filter(r => r.claimable && !r.claimed).length,
        claimed: rewards.filter(r => r.claimed).length,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching rewards');
    return NextResponse.json(
      { error: 'Failed to fetch rewards' },
      { status: 500 }
    );
  }
}
