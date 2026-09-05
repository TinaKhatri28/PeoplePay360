import Redis from 'ioredis';
import { logger } from '../shared/logger/logger';
import { env } from './env';

let redisClient: Redis | null = null;
let isRedisAvailable = false;

try {
  redisClient = new Redis(env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times) => {
      if (times > 3) {
        logger.warn('Redis unreachable after 3 attempts. Background jobs will operate in async direct-execution mode.');
        return null; // stop retrying
      }
      return Math.min(times * 200, 1000);
    },
  });

  redisClient.on('connect', () => {
    isRedisAvailable = true;
    logger.info('Connected to Redis server');
    import('../jobs/queue').then(({ initializeQueues }) => {
      initializeQueues();
    }).catch(() => {});
  });

  redisClient.on('error', (err) => {
    isRedisAvailable = false;
    // Suppress repeated unhandled error spam if Redis is not running locally
  });
} catch (e: any) {
  logger.warn(`Redis initialization skipped: ${e.message}`);
}

export const getRedisClient = (): Redis | null => redisClient;
export const getIsRedisAvailable = (): boolean => isRedisAvailable;
