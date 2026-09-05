import { getRedisClient, getIsRedisAvailable } from '../../config/redis';
import { logger } from '../logger/logger';

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

export class CacheService {
  private inMemoryCache = new Map<string, CacheEntry<any>>();

  constructor() {
    // Periodically prune expired entries from in-memory fallback
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.inMemoryCache.entries()) {
        if (now > entry.expiry) {
          this.inMemoryCache.delete(key);
        }
      }
    }, 60000).unref();
  }

  async get<T>(key: string): Promise<T | null> {
    const redis = getRedisClient();

    if (redis && getIsRedisAvailable()) {
      try {
        const data = await redis.get(key);
        if (data !== null) {
          try {
            return JSON.parse(data) as T;
          } catch {
            return data as unknown as T;
          }
        }
        return null;
      } catch (err: any) {
        logger.warn(`Redis get cache error: ${err.message}. Falling back to in-memory store.`);
      }
    }

    const entry = this.inMemoryCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.inMemoryCache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    const redis = getRedisClient();

    if (redis && getIsRedisAvailable()) {
      try {
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        await redis.set(key, serialized, 'EX', ttlSeconds);
        return;
      } catch (err: any) {
        logger.warn(`Redis set cache error: ${err.message}. Falling back to in-memory store.`);
      }
    }

    this.inMemoryCache.set(key, {
      value,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    const redis = getRedisClient();

    if (redis && getIsRedisAvailable()) {
      try {
        await redis.del(key);
      } catch (err: any) {
        logger.warn(`Redis del cache error: ${err.message}`);
      }
    }

    this.inMemoryCache.delete(key);
  }

  async delByPrefix(prefix: string): Promise<void> {
    const redis = getRedisClient();

    if (redis && getIsRedisAvailable()) {
      try {
        const keys = await redis.keys(`${prefix}*`);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch (err: any) {
        logger.warn(`Redis delByPrefix cache error: ${err.message}`);
      }
    }

    for (const key of this.inMemoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.inMemoryCache.delete(key);
      }
    }
  }

  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds = 300): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const freshData = await fetchFn();
    await this.set(key, freshData, ttlSeconds);
    return freshData;
  }
}

export const cacheService = new CacheService();
