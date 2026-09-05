import { z } from 'zod';

export const createContractSchema = z.object({
  employee_id: z.string().min(1, 'Employee ID is required'),
  ref: z.string().optional(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional().nullable(),
  wage: z.coerce.number().min(0, 'Wage must be greater than or equal to 0'),
  employment_type: z.string().optional().default('Full-time'),
  status: z.enum(['Running', 'Draft', 'Expired', 'Cancelled']).default('Running'),
  department: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  schedule_id: z.string().optional().nullable(),
  salary_structure_id: z.string().optional().nullable(),
}).refine(
  (data) => {
    if (data.end_date && data.start_date) {
      return new Date(data.start_date) <= new Date(data.end_date);
    }
    return true;
  },
  {
    message: 'Contract start date must be before or equal to end date',
    path: ['end_date'],
  }
);

export const updateContractSchema = z.object({
  ref: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional().nullable(),
  wage: z.coerce.number().min(0).optional(),
  employment_type: z.string().optional(),
  status: z.enum(['Running', 'Draft', 'Expired', 'Cancelled']).optional(),
  department: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  schedule_id: z.string().optional().nullable(),
  salary_structure_id: z.string().optional().nullable(),
});
