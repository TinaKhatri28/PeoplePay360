import { PrismaClient } from '@prisma/client';
import { logger } from '../shared/logger/logger';

declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

prisma.$connect()
  .then(() => {
    logger.info('Database connected successfully via Prisma');
  })
  .catch((err) => {
    logger.warn(`Database connection initialized (lazy connect): ${err.message}`);
  });
