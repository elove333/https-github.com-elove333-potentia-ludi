/**
 * Redis Cache Client
 * 
 * This module provides a Redis caching layer for the Conversational Web3 Wallet Hub.
 * Used for caching balances, prices, gas estimates, and other frequently accessed data.
 * 
 * Setup:
 * 1. Install redis: npm install redis
 * 2. Set REDIS_URL environment variable
 * 3. Start Redis: redis-server
 */

/**
 * Redis configuration
 */
export const REDIS_CONFIG = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        return new Error('Max reconnection attempts reached');
      }
      return Math.min(retries * 50, 500);
    },
  },
  keyPrefix: 'potentia:',
};

/**
 * Cache TTL (Time To Live) configuration in seconds
 */
export const CACHE_TTL = {
  balance: 30,        // 30 seconds
  price: 60,          // 1 minute
  gas: 15,            // 15 seconds
  intent: 3600,       // 1 hour
  session: 86400,     // 24 hours
  quote: 60,          // 1 minute
  transaction: 300,   // 5 minutes
};

/**
 * Cache key builders
 */
export const CacheKeys = {
  /** Balance cache key */
  balance: (address: string, chainId: number, token?: string) =>
    `balance:${chainId}:${address}:${token || 'native'}`,
  
  /** Token price cache key */
  price: (tokenAddress: string, chainId: number) =>
    `price:${chainId}:${tokenAddress}`,
  
  /** Gas price cache key */
  gas: (chainId: number) =>
    `gas:${chainId}`,
  
  /** Intent status cache key */
  intent: (intentId: string) =>
    `intent:${intentId}`,
  
  /** User session cache key */
  session: (address: string) =>
    `session:${address}`,
  
  /** Swap quote cache key */
  quote: (chainId: number, fromToken: string, toToken: string, amount: string) =>
    `quote:${chainId}:${fromToken}:${toToken}:${amount}`,
  
  /** Transaction cache key */
  transaction: (chainId: number, txHash: string) =>
    `tx:${chainId}:${txHash}`,
  
  /** Rate limit key */
  rateLimit: (address: string, endpoint: string) =>
    `ratelimit:${address}:${endpoint}`,
};

/**
 * Redis client class
 * 
 * TODO: Implement using redis package
 */
export class RedisClient {
  private client: any; // TODO: Type as RedisClientType from 'redis'
  private connected: boolean = false;
  
  constructor() {
    // TODO: Initialize Redis client
    // import { createClient } from 'redis';
    // this.client = createClient(REDIS_CONFIG);
    // this.client.on('error', (err) => console.error('Redis error:', err));
    // this.client.on('connect', () => { this.connected = true; });
  }
  
  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    if (this.connected) return;
    
    // TODO: Implement connection
    // await this.client.connect();
    this.connected = true;
    console.log('Redis client connected');
  }
  
  /**
   * Get a value from cache
   * 
   * @param key - Cache key
   * @returns Cached value or null
   */
  async get<T = any>(key: string): Promise<T | null> {
    if (!this.connected) await this.connect();
    
    // TODO: Implement get
    // const value = await this.client.get(key);
    // return value ? JSON.parse(value) : null;
    
    console.log('Redis GET:', key);
    return null;
  }
  
  /**
   * Set a value in cache
   * 
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds
   */
  async set<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.connected) await this.connect();
    
    // TODO: Implement set
    // const serialized = JSON.stringify(value);
    // if (ttl) {
    //   await this.client.setEx(key, ttl, serialized);
    // } else {
    //   await this.client.set(key, serialized);
    // }
    
    console.log('Redis SET:', key, 'TTL:', ttl);
  }
  
  /**
   * Delete a key from cache
   * 
   * @param key - Cache key to delete
   */
  async del(key: string): Promise<void> {
    if (!this.connected) await this.connect();
    
    // TODO: Implement delete
    // await this.client.del(key);
    
    console.log('Redis DEL:', key);
  }
  
  /**
   * Delete multiple keys matching a pattern
   * 
   * @param pattern - Key pattern (e.g., 'balance:*')
   * @returns Number of keys deleted
   */
  async delPattern(pattern: string): Promise<number> {
    if (!this.connected) await this.connect();
    
    // TODO: Implement pattern deletion
    // const keys = await this.client.keys(pattern);
    // if (keys.length > 0) {
    //   await this.client.del(keys);
    // }
    // return keys.length;
    
    console.log('Redis DEL pattern:', pattern);
    return 0;
  }
  
  /**
   * Check if a key exists
   * 
   * @param key - Cache key
   * @returns Whether key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.connected) await this.connect();
    
    // TODO: Implement exists check
    // const exists = await this.client.exists(key);
    // return exists === 1;
    
    console.log('Redis EXISTS:', key);
    return false;
  }
  
  /**
   * Increment a counter
   * 
   * @param key - Counter key
   * @param amount - Amount to increment (default: 1)
   * @returns New counter value
   */
  async incr(key: string, amount: number = 1): Promise<number> {
    if (!this.connected) await this.connect();
    
    // TODO: Implement increment
    // if (amount === 1) {
    //   return await this.client.incr(key);
    // } else {
    //   return await this.client.incrBy(key, amount);
    // }
    
    console.log('Redis INCR:', key, amount);
    return 1;
  }
  
  /**
   * Set expiration on a key
   * 
   * @param key - Cache key
   * @param seconds - Expiration time in seconds
   */
  async expire(key: string, seconds: number): Promise<void> {
    if (!this.connected) await this.connect();
    
    // TODO: Implement expire
    // await this.client.expire(key, seconds);
    
    console.log('Redis EXPIRE:', key, seconds);
  }
  
  /**
   * Get remaining TTL for a key
   * 
   * @param key - Cache key
   * @returns Remaining TTL in seconds, -1 if no expiration, -2 if key doesn't exist
   */
  async ttl(key: string): Promise<number> {
    if (!this.connected) await this.connect();
    
    // TODO: Implement TTL check
    // return await this.client.ttl(key);
    
    console.log('Redis TTL:', key);
    return -2;
  }
  
  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (!this.connected) return;
    
    // TODO: Implement disconnect
    // await this.client.disconnect();
    this.connected = false;
    console.log('Redis client disconnected');
  }
  
  /**
   * Test Redis connection
   * 
   * @returns Whether connection is successful
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      // TODO: Implement ping
      // await this.client.ping();
      return true;
    } catch (error) {
      console.error('Redis connection test failed:', error);
      return false;
    }
  }
  
  /**
   * Flush all cache (WARNING: use only in development)
   */
  async flushAll(): Promise<void> {
    if (!this.connected) await this.connect();
    
    // TODO: Implement flush
    // await this.client.flushAll();
    
    console.log('Redis FLUSHALL');
  }
}

// Singleton instance
let redisInstance: RedisClient | null = null;

/**
 * Get Redis client instance
 * 
 * @returns Redis client
 */
export function getRedis(): RedisClient {
  if (!redisInstance) {
    redisInstance = new RedisClient();
  }
  return redisInstance;
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisInstance) {
    await redisInstance.close();
    redisInstance = null;
  }
}

/**
 * Cache helper functions
 */

/**
 * Get or set cache with a fallback function
 * 
 * @param key - Cache key
 * @param ttl - Time to live in seconds
 * @param fallback - Function to call if cache misses
 * @returns Cached or fresh value
 */
export async function cacheOrFetch<T>(
  key: string,
  ttl: number,
  fallback: () => Promise<T>
): Promise<T> {
  const redis = getRedis();
  
  // Try cache first
  const cached = await redis.get<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // Cache miss - fetch fresh data
  const fresh = await fallback();
  
  // Store in cache
  await redis.set(key, fresh, ttl);
  
  return fresh;
}
