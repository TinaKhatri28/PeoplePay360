import { Queue } from 'bullmq';
import { getRedisClient, getIsRedisAvailable } from '../config/redis';
import { logger } from '../shared/logger/logger';
import { initializeWorkers } from './workers';

export const PAYROLL_QUEUE_NAME = 'payroll-calculations';
export const PDF_QUEUE_NAME = 'payslip-pdf';
export const EMAIL_QUEUE_NAME = 'notifications-email';

let payrollQueue: Queue | null = null;
let pdfQueue: Queue | null = null;
let emailQueue: Queue | null = null;

export const initializeQueues = () => {
  const redis = getRedisClient();
  if (redis && getIsRedisAvailable()) {
    try {
      payrollQueue = new Queue(PAYROLL_QUEUE_NAME, { connection: redis });
      pdfQueue = new Queue(PDF_QUEUE_NAME, { connection: redis });
      emailQueue = new Queue(EMAIL_QUEUE_NAME, { connection: redis });
      logger.info('BullMQ job queues initialized with Redis connection');

      // Initialize background consumers/workers
      initializeWorkers();
    } catch (e: any) {
      logger.warn(`BullMQ initialization error: ${e.message}. Using in-process worker mode.`);
    }
  } else {
    logger.info('Redis not available. Background jobs will process via asynchronous in-process queue.');
  }
};

/**
 * Dispatch background job (BullMQ or in-process fallback)
 */
export const dispatchJob = async (
  queueName: string,
  jobName: string,
  data: any,
  fallbackExecutor?: () => Promise<void>
) => {
  const queueMap: Record<string, Queue | null> = {
    [PAYROLL_QUEUE_NAME]: payrollQueue,
    [PDF_QUEUE_NAME]: pdfQueue,
    [EMAIL_QUEUE_NAME]: emailQueue,
  };

  const targetQueue = queueMap[queueName];

  if (targetQueue && getIsRedisAvailable()) {
    try {
      await targetQueue.add(jobName, data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
      });
      return;
    } catch (err: any) {
      logger.warn(`Failed to push job to BullMQ queue ${queueName}: ${err.message}. Falling back to in-process execution.`);
    }
  }

  // Resilient in-process async execution fallback
  if (fallbackExecutor) {
    setImmediate(async () => {
      try {
        await fallbackExecutor();
      } catch (err: any) {
        logger.error({ err }, `Async fallback job ${jobName} failed`);
      }
    });
  }
};
