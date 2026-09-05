import { Router } from 'express';
import { salaryStructureController } from './salary-structure.controller';
import { authenticate } from '../../shared/guards/authenticate.guard';
import { requireRole } from '../../shared/guards/require-permission.guard';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { createStructureSchema, createRuleSchema, updateRuleSchema } from './salary-structure.schema';

const router = Router();

router.use(authenticate);

// Structures
router.get('/structures', salaryStructureController.getStructures);
router.post(
  '/structures',
  requireRole('HR Payroll Admin', 'Admin'),
  validateRequest({ body: createStructureSchema }),
  salaryStructureController.createStructure
);

// Rules
router.get('/rules', salaryStructureController.getRules);
router.post(
  '/rules',
  requireRole('HR Payroll Admin', 'Admin'),
  validateRequest({ body: createRuleSchema }),
  salaryStructureController.createRule
);
router.put(
  '/rules/:id',
  requireRole('HR Payroll Admin', 'Admin'),
  validateRequest({ body: updateRuleSchema }),
  salaryStructureController.updateRule
);
router.delete(
  '/rules/:id',
  requireRole('HR Payroll Admin', 'Admin'),
  salaryStructureController.deleteRule
);

export default router;
