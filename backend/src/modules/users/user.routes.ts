import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate } from '../../shared/guards/authenticate.guard';
import { requireRole } from '../../shared/guards/require-permission.guard';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('HR Manager', 'Admin'), userController.getAll);
router.post('/', requireRole('HR Payroll Admin', 'Admin'), userController.create);
router.put('/:id', requireRole('HR Payroll Admin', 'Admin'), userController.update);

export default router;
