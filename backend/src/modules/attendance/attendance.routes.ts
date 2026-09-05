import { Router } from 'express';
import { attendanceController } from './attendance.controller';
import { authenticate } from '../../shared/guards/authenticate.guard';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { checkInSchema, checkOutSchema, updateAttendanceSchema, createAttendanceSchema } from './attendance.schema';

import { requireRole } from '../../shared/guards/require-permission.guard';

const router = Router();

router.use(authenticate);

router.get('/', attendanceController.getAll);
router.get('/me/status', attendanceController.getMyStatus);
router.get('/:id', attendanceController.getById);
router.post('/', requireRole('HR Manager', 'Admin'), validateRequest({ body: createAttendanceSchema }), attendanceController.createManual);
router.post('/check-in', validateRequest({ body: checkInSchema }), attendanceController.checkIn);
router.post('/check-out', validateRequest({ body: checkOutSchema }), attendanceController.checkOut);
router.put('/:id', requireRole('HR Manager', 'Admin'), validateRequest({ body: updateAttendanceSchema }), attendanceController.update);

export default router;
