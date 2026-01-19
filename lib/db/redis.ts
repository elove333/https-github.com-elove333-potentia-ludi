import Redis from 'ioredis';
import { logger } from './client';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
    
    if (!redisUrl) {
      throw new Error('REDIS_URL or UPSTASH_REDIS_REST_URL must be set');
    }

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redis.on('error', (err) => {
      logger.error({ err }, 'Redis connection error');
    });

    redis.on('connect', () => {
      logger.info('Redis connected');
    });
  }

  return redis;
}

// Cache helper functions
export async function cacheSet(
  key: string,
  value: string | object,
  ttlSeconds?: number
): Promise<void> {
  const redis = getRedis();
  const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
  
  if (ttlSeconds) {
    await redis.setex(key, ttlSeconds, valueStr);
  } else {
    await redis.set(key, valueStr);
  }
}

export async function cacheGet<T = any>(key: string): Promise<T | null> {
  const redis = getRedis();
  const value = await redis.get(key);
  
  if (!value) return null;
  
  try {
    return JSON.parse(value) as T;
  } catch {
    return value as T;
  }
}

export async function cacheDel(key: string): Promise<void> {
  const redis = getRedis();
  await redis.del(key);
}

export async function cacheExists(key: string): Promise<boolean> {
  const redis = getRedis();
  const exists = await redis.exists(key);
  return exists === 1;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
