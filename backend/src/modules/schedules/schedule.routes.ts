import { Router } from 'express';
import { scheduleController } from './schedule.controller';
import { authenticate } from '../../shared/guards/authenticate.guard';

const router = Router();

router.use(authenticate);
router.get('/', scheduleController.getAll);
router.get('/:id', scheduleController.getById);
router.post('/', scheduleController.create);

export default router;
