import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate } from '../../shared/guards/authenticate.guard';
import { requireRole } from '../../shared/guards/require-permission.guard';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { createUserSchema, updateUserSchema, userIdParamSchema } from './user.schema';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('HR Manager', 'Admin', 'HR Payroll Admin'), userController.getAll);
router.post(
  '/',
  requireRole('Admin', 'HR Payroll Admin', 'HR Manager'),
  validateRequest({ body: createUserSchema }),
  userController.create
);
router.put(
  '/:id',
  requireRole('Admin', 'HR Payroll Admin', 'HR Manager'),
  validateRequest({ params: userIdParamSchema, body: updateUserSchema }),
  userController.update
);

export default router;
