import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().default('file:./data/peoplepay360.db'),
  REDIS_URL: z.string().optional().default('redis://127.0.0.1:6379'),
  JWT_SECRET: z.string().default('peoplepay360-super-secret-jwt-key-change-in-prod-2026'),
  JWT_REFRESH_SECRET: z.string().default('peoplepay360-super-secret-refresh-key-change-in-prod-2026'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables configuration:', result.error.format());
    process.exit(1);
  }
  return result.data;
};

export const env = parseEnv();
