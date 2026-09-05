import { getRedisClient, getIsRedisAvailable } from '../../config/redis';
import { logger } from '../logger/logger';

export class TokenBlacklistService {
  private inMemoryBlacklist = new Map<string, number>();

  constructor() {
    // Periodically prune expired entries from in-memory fallback
    setInterval(() => {
      const now = Date.now();
      for (const [token, expiry] of this.inMemoryBlacklist.entries()) {
        if (now > expiry) {
          this.inMemoryBlacklist.delete(token);
        }
      }
    }, 60000).unref();
  }

  async revokeToken(token: string, ttlSeconds = 900): Promise<void> {
    const redis = getRedisClient();
    const key = `blacklist:${token}`;

    if (redis && getIsRedisAvailable()) {
      try {
        await redis.set(key, 'revoked', 'EX', ttlSeconds);
        return;
      } catch (err: any) {
        logger.warn(`Redis token revocation error: ${err.message}. Falling back to in-memory store.`);
      }
    }

    // In-memory fallback
    this.inMemoryBlacklist.set(token, Date.now() + ttlSeconds * 1000);
  }

  async isTokenRevoked(token: string): Promise<boolean> {
    const redis = getRedisClient();
    const key = `blacklist:${token}`;

    if (redis && getIsRedisAvailable()) {
      try {
        const result = await redis.get(key);
        return result !== null;
      } catch (err: any) {
        logger.warn(`Redis token check error: ${err.message}. Checking in-memory fallback.`);
      }
    }

    const expiry = this.inMemoryBlacklist.get(token);
    if (!expiry) return false;
    if (Date.now() > expiry) {
      this.inMemoryBlacklist.delete(token);
      return false;
    }
    return true;
  }
}

export const tokenBlacklistService = new TokenBlacklistService();
