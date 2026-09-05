import { z } from 'zod';

export const checkInSchema = z.object({
  employee_id: z.string().optional(), // If not provided, defaults to req.user.employeeId
  date: z.string().optional(), // YYYY-MM-DD
  time: z.string().optional(), // HH:mm or ISO
  notes: z.string().optional(),
});

export const checkOutSchema = z.object({
  employee_id: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  notes: z.string().optional(),
});

export const updateAttendanceSchema = z.object({
  check_in: z.string().optional().nullable(),
  check_out: z.string().optional().nullable(),
  status: z.enum(['Present', 'Late', 'Absent', 'Overtime', 'Anomaly']).optional(),
  notes: z.string().optional().nullable(),
  worked_hours: z.coerce.number().optional(),
  overtime_hours: z.coerce.number().optional(),
});

export const createAttendanceSchema = z.object({
  employee_id: z.string().min(1, 'Employee ID is required'),
  date: z.string().min(1, 'Date is required'),
  check_in: z.string().optional().nullable(),
  check_out: z.string().optional().nullable(),
  worked_hours: z.coerce.number().optional().default(0),
  overtime_hours: z.coerce.number().optional().default(0),
  status: z.enum(['Present', 'Late', 'Absent', 'Overtime', 'Anomaly']).default('Present'),
  notes: z.string().optional().nullable(),
});
