import { Router } from 'express';
import { contractController } from './contract.controller';
import { authenticate } from '../../shared/guards/authenticate.guard';
import { requireRole } from '../../shared/guards/require-permission.guard';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { createContractSchema, updateContractSchema } from './contract.schema';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requireRole('Admin', 'HR Manager', 'HR Payroll Admin', 'HR Payroll User', 'Employee'),
  contractController.getAll
);
router.get(
  '/:id',
  requireRole('Admin', 'HR Manager', 'HR Payroll Admin', 'HR Payroll User', 'Employee'),
  contractController.getById
);

router.post(
  '/',
  requireRole('HR Manager', 'HR Payroll User', 'HR Payroll Admin', 'Admin'),
  validateRequest({ body: createContractSchema }),
  contractController.create
);

router.put(
  '/:id',
  requireRole('HR Manager', 'HR Payroll User', 'HR Payroll Admin', 'Admin'),
  validateRequest({ body: updateContractSchema }),
  contractController.update
);

export default router;
