import { Worker, Job } from 'bullmq';
import { getRedisClient, getIsRedisAvailable } from '../config/redis';
import { PAYROLL_QUEUE_NAME, PDF_QUEUE_NAME, EMAIL_QUEUE_NAME } from './queue';
import { logger } from '../shared/logger/logger';
import { emailService } from '../shared/utils/email.service';

let payrollWorker: Worker | null = null;
let pdfWorker: Worker | null = null;
let emailWorker: Worker | null = null;

export const initializeWorkers = () => {
  const redis = getRedisClient();
  if (!redis || !getIsRedisAvailable()) {
    logger.info('Redis not available. BullMQ workers will not be started (using in-process fallback mode).');
    return;
  }

  try {
    // 1. Payroll Worker
    payrollWorker = new Worker(
      PAYROLL_QUEUE_NAME,
      async (job: Job) => {
        logger.info({ jobId: job.id, name: job.name }, 'Processing payroll calculation job');
        const { organizationId, payrunId, actorUserId } = job.data;
        if (!organizationId || !payrunId) {
          throw new Error('Missing organizationId or payrunId in payroll job');
        }
        const { payrollService } = await import('../modules/payroll/payroll.service');
        await payrollService.computePayrun(organizationId, payrunId, actorUserId);
      },
      { connection: redis, concurrency: 2 }
    );

    payrollWorker.on('completed', (job) => {
      logger.info({ jobId: job.id }, 'Payroll job completed successfully');
    });
    payrollWorker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, err }, 'Payroll job failed');
    });

    // 2. PDF Generation Worker
    pdfWorker = new Worker(
      PDF_QUEUE_NAME,
      async (job: Job) => {
        logger.info({ jobId: job.id, name: job.name }, 'Processing payslip PDF job');
        const { payslipId } = job.data;
        logger.info(`PDF background task for payslip ${payslipId} processed`);
      },
      { connection: redis, concurrency: 4 }
    );

    pdfWorker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, err }, 'PDF job failed');
    });

    // 3. Email Worker
    emailWorker = new Worker(
      EMAIL_QUEUE_NAME,
      async (job: Job) => {
        logger.info({ jobId: job.id, name: job.name }, 'Processing email dispatch job');
        const { to, subject, html, text, attachments } = job.data;
        await emailService.sendEmail({ to, subject, html, text, attachments });
      },
      { connection: redis, concurrency: 5 }
    );

    emailWorker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, err }, 'Email dispatch job failed');
    });

    logger.info('BullMQ workers initialized and actively listening for jobs');
  } catch (err: any) {
    logger.warn(`Could not start BullMQ workers: ${err.message}`);
  }
};

export const closeWorkers = async () => {
  const promises = [];
  if (payrollWorker) promises.push(payrollWorker.close());
  if (pdfWorker) promises.push(pdfWorker.close());
  if (emailWorker) promises.push(emailWorker.close());
  await Promise.allSettled(promises);
  logger.info('BullMQ workers shut down gracefully');
};
