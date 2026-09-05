import { z } from 'zod';

export const createLeaveRequestSchema = z.object({
  employee_id: z.string().optional(),
  type_id: z.string().min(1, 'Leave type is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  duration: z.coerce.number().min(0.5, 'Duration must be at least 0.5 days'),
  reason: z.string().optional(),
}).refine(
  (data) => new Date(data.start_date) <= new Date(data.end_date),
  {
    message: 'Leave start date must be before or equal to end date',
    path: ['end_date'],
  }
);

export const approveLeaveSchema = z.object({
  action: z.enum(['Approved', 'Refused', 'Cancelled']),
  rejection_reason: z.string().optional(),
});

export const createAllocationSchema = z.object({
  employee_id: z.string().min(1, 'Employee ID is required'),
  type_id: z.string().min(1, 'Leave type is required'),
  allocated: z.coerce.number().min(0, 'Allocation must be >= 0'),
});
