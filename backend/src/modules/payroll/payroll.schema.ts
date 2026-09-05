import { z } from 'zod';

export const createPayrunSchema = z.object({
  period_month: z.coerce.number().min(1).max(12),
  period_year: z.coerce.number().min(2000).max(2100),
  structure_id: z.string().optional().nullable(),
  company: z.string().optional().default('OXP Pvt Ltd'),
  employee_ids: z.array(z.string()).min(1, 'At least one employee must be selected'),
});

export const queryEligibleSchema = z.object({
  year: z.coerce.number().min(2000).max(2100),
  month: z.coerce.number().min(1).max(12),
});
