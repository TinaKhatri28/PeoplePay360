import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authenticate } from '../../shared/guards/authenticate.guard';

const router = Router();

router.use(authenticate);
router.get('/', dashboardController.getSummary);

export default router;
