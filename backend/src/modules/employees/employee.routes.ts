import { Router } from 'express';
import { employeeController } from './employee.controller';
import { authenticate } from '../../shared/guards/authenticate.guard';
import { requirePermission, requireRole } from '../../shared/guards/require-permission.guard';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { createEmployeeSchema, updateEmployeeSchema, queryEmployeeSchema } from './employee.schema';
import { Permissions } from '../../shared/constants/permissions.constant';

const router = Router();

router.use(authenticate);

// List & search
router.get('/', validateRequest({ query: queryEmployeeSchema }), employeeController.getAll);

// Metadata route expected by frontend
router.get('/meta/departments', employeeController.getMetaDepartments);

// Specific employee sub-resources
router.get('/:id/contracts', employeeController.getContracts);
router.get('/:id/attendance', employeeController.getAttendance);
router.get('/:id/time-off', employeeController.getTimeOff);
router.get('/:id/allocations', employeeController.getAllocations);

// Employee CRUD
router.get('/:id', employeeController.getById);
router.post(
  '/',
  requireRole('HR Manager', 'Admin'),
  validateRequest({ body: createEmployeeSchema }),
  employeeController.create
);
router.put(
  '/:id',
  requireRole('HR Manager', 'Admin'),
  validateRequest({ body: updateEmployeeSchema }),
  employeeController.update
);

export default router;
