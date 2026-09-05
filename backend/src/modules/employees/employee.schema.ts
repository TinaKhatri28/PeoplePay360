import { z } from 'zod';

export const createEmployeeSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  name: z.string().optional(), // frontend sends single 'name'
  email: z.string().email('Valid email is required'),
  phone: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  department_id: z.string().optional().nullable(),
  manager_id: z.string().optional().nullable(),
  schedule_id: z.string().optional().nullable(),
  company: z.string().optional().default('OXP Pvt Ltd'),
  work_location: z.string().optional().nullable(),
  bank_account: z.string().optional().nullable(),
  status: z.enum(['Active', 'Inactive', 'Terminated']).default('Active'),
  joining_date: z.string().optional().nullable(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export const queryEmployeeSchema = z.object({
  search: z.string().optional(),
  department_id: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});
