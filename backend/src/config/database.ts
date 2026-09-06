import { PrismaClient } from '@prisma/client';
import { logger } from '../shared/logger/logger';

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'stdout', level: 'info' },
      { emit: 'stdout', level: 'warn' },
      { emit: 'stdout', level: 'error' },
    ],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

// Explicit query logger so database updates and queries are clearly visible in the console
(prisma as any).$on('query', (e: any) => {
  // Only log application queries (exclude keepalive pings)
  if (!e.query.includes('SELECT 1')) {
    logger.info(`[DB Query] ${e.query} | params: ${e.params} | duration: ${e.duration}ms`);
  }
});

// Initial connection with retry
const connectWithRetry = async (retries = 3, delay = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      logger.info('Database connected successfully via Prisma');
      return;
    } catch (err: any) {
      if (attempt < retries) {
        logger.warn(`Database connection attempt ${attempt} failed: ${err.message}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        logger.warn(`Database connection initialized (lazy connect): ${err.message}`);
      }
    }
  }
};

connectWithRetry();

// Keepalive heartbeat ping every 2.5 minutes to maintain active connection pool with Neon
if (process.env.NODE_ENV !== 'test') {
  setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err: any) {
      logger.debug(`Database keepalive ping error (will reconnect on next query): ${err.message}`);
    }
  }, 150000).unref();
}
