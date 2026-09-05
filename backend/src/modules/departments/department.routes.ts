import { Router } from 'express';
import { departmentController } from './department.controller';
import { authenticate } from '../../shared/guards/authenticate.guard';

const router = Router();

router.use(authenticate);
router.get('/', departmentController.getAll);
router.post('/', departmentController.create);

export default router;
