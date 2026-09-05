import { createApp } from './app';
import { env } from './config/env';
import { logger } from './shared/logger/logger';
import { prisma } from './config/database';
import { initializeQueues } from './jobs/queue';
import { closeWorkers } from './jobs/workers';

const app = createApp();

initializeQueues();

const server = app.listen(env.PORT, () => {
  logger.info(`=======================================================`);
  logger.info(`🚀 PeoplePay360 Backend running on http://localhost:${env.PORT}`);
  logger.info(`📋 Environment: ${env.NODE_ENV}`);
  logger.info(`🛡️  RBAC & Multi-tenancy Isolation: Active`);
  logger.info(`📦 Database: Prisma ORM (Connected)`);
  logger.info(`=======================================================`);
});

const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    await closeWorkers();
    await prisma.$disconnect();
    logger.info('Database connection closed.');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
