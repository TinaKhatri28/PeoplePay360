import { z } from 'zod';

export const createStructureSchema = z.object({
  name: z.string().min(1, 'Structure name is required'),
  code: z.string().optional(),
  description: z.string().optional(),
});

export const createRuleSchema = z.object({
  structure_id: z.string().min(1, 'Structure ID is required'),
  name: z.string().min(1, 'Rule name is required'),
  code: z.string().optional(),
  category: z.enum(['Basic', 'Allowance', 'Deduction']).default('Allowance'),
  compute_method: z.enum(['FIXED', 'PERCENTAGE', 'FORMULA']),
  amount: z.coerce.number().optional().nullable(),
  percentage: z.coerce.number().min(0).max(100).optional().nullable(),
  percentage_of: z.enum(['BASIC', 'GROSS_SO_FAR']).optional().nullable(),
  formula_key: z.enum(['OVERTIME', 'UNPAID_LEAVE_DEDUCTION', 'ATTENDANCE_BASED']).optional().nullable(),
  sequence: z.coerce.number().default(10),
  is_active: z.boolean().default(true),
});

export const updateRuleSchema = createRuleSchema.partial();
