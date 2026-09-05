import { z } from 'zod';

export const userRoleEnum = z.enum([
  'Admin',
  'HR Manager',
  'HR Payroll Admin',
  'HR Payroll User',
  'Employee',
]);

export const createUserSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: userRoleEnum.optional(),
  roles: z.union([userRoleEnum, z.array(z.string())]).optional(),
  employee_id: z.string().nullable().optional(),
});

export const updateUserSchema = z.object({
  role: userRoleEnum.optional(),
  roles: z.union([userRoleEnum, z.array(z.string())]).optional(),
  status: z.enum(['Active', 'Inactive']).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  employee_id: z.string().nullable().optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
