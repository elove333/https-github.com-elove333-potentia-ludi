// Rewards aggregation from Galxe, RabbitHole, and Layer3
import { logger } from '@/lib/db/client';
import { cacheGet, cacheSet } from '@/lib/db/redis';

const CACHE_TTL = 120; // 2 minutes for rewards

export interface Reward {
  id: string;
  platform: 'galxe' | 'rabbithole' | 'layer3';
  title: string;
  description?: string;
  rewardAmount?: string;
  rewardToken?: string;
  claimable: boolean;
  claimed: boolean;
  expiresAt?: Date;
}

export async function fetchGalxeRewards(address: string): Promise<Reward[]> {
  try {
    const apiKey = process.env.GALXE_API_KEY;
    if (!apiKey) {
      logger.warn('Galxe API key not configured');
      return [];
    }

    // Galxe GraphQL API (stub - actual implementation would use their API)
    logger.info({ address }, 'Fetching Galxe rewards');
    
    // Mock response for demo
    return [
      {
        id: 'galxe-1',
        platform: 'galxe',
        title: 'Web3 Gaming Quest',
        description: 'Complete gaming challenges',
        rewardAmount: '100',
        rewardToken: 'GAL',
        claimable: true,
        claimed: false,
      },
    ];
  } catch (error) {
    logger.error({ error, address }, 'Error fetching Galxe rewards');
    return [];
  }
}

export async function fetchRabbitHoleRewards(address: string): Promise<Reward[]> {
  try {
    const apiKey = process.env.RABBITHOLE_API_KEY;
    if (!apiKey) {
      logger.warn('RabbitHole API key not configured');
      return [];
    }

    logger.info({ address }, 'Fetching RabbitHole rewards');

    // Mock response for demo
    return [
      {
        id: 'rabbithole-1',
        platform: 'rabbithole',
        title: 'DeFi Learning Path',
        description: 'Complete DeFi tutorials',
        rewardAmount: '50',
        rewardToken: 'RBH',
        claimable: true,
        claimed: false,
      },
    ];
  } catch (error) {
    logger.error({ error, address }, 'Error fetching RabbitHole rewards');
    return [];
  }
}

export async function fetchLayer3Rewards(address: string): Promise<Reward[]> {
  try {
    const apiKey = process.env.LAYER3_API_KEY;
    if (!apiKey) {
      logger.warn('Layer3 API key not configured');
      return [];
    }

    logger.info({ address }, 'Fetching Layer3 rewards');

    // Mock response for demo
    return [
      {
        id: 'layer3-1',
        platform: 'layer3',
        title: 'Layer 2 Explorer',
        description: 'Explore L2 ecosystems',
        rewardAmount: '75',
        rewardToken: 'L3',
        claimable: false,
        claimed: false,
      },
    ];
  } catch (error) {
    logger.error({ error, address }, 'Error fetching Layer3 rewards');
    return [];
  }
}

export async function aggregateRewards(
  address: string,
  platforms?: Array<'galxe' | 'rabbithole' | 'layer3'>
): Promise<Reward[]> {
  const cacheKey = `rewards:${address}:${platforms?.join(',') || 'all'}`;
  
  // Check cache
  const cached = await cacheGet<Reward[]>(cacheKey);
  if (cached) {
    logger.debug({ cacheKey }, 'Returning cached rewards');
    return cached;
  }

  const allPlatforms: Array<'galxe' | 'rabbithole' | 'layer3'> = 
    platforms || ['galxe', 'rabbithole', 'layer3'];

  const rewardPromises = allPlatforms.map(async (platform) => {
    switch (platform) {
      case 'galxe':
        return fetchGalxeRewards(address);
      case 'rabbithole':
        return fetchRabbitHoleRewards(address);
      case 'layer3':
        return fetchLayer3Rewards(address);
      default:
        return [];
    }
  });

  const results = await Promise.allSettled(rewardPromises);
  const rewards = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => (r as PromiseFulfilledResult<Reward[]>).value);

  // Cache the result
  await cacheSet(cacheKey, rewards, CACHE_TTL);

  return rewards;
}
