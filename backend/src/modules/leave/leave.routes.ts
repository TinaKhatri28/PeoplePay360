import { Router } from 'express';
import { leaveController } from './leave.controller';
import { authenticate } from '../../shared/guards/authenticate.guard';
import { requireRole } from '../../shared/guards/require-permission.guard';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { createLeaveRequestSchema, createAllocationSchema } from './leave.schema';

const router = Router();

router.use(authenticate);

// Types
router.get('/types', leaveController.getTypes);

// Requests
router.get('/requests', leaveController.getRequests);
router.post('/requests', validateRequest({ body: createLeaveRequestSchema }), leaveController.createRequest);
router.post('/requests/:id/approve', requireRole('HR Manager', 'Admin'), leaveController.approve);
router.post('/requests/:id/refuse', requireRole('HR Manager', 'Admin'), leaveController.refuse);

// Allocations
router.get('/allocations', leaveController.getAllocations);
router.post('/allocations', requireRole('HR Manager', 'Admin'), validateRequest({ body: createAllocationSchema }), leaveController.createAllocation);

export default router;
