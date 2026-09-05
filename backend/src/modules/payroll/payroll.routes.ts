import { Router } from 'express';
import { payrollController } from './payroll.controller';
import { authenticate } from '../../shared/guards/authenticate.guard';
import { requireRole } from '../../shared/guards/require-permission.guard';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { createPayrunSchema } from './payroll.schema';

const router = Router();

router.use(authenticate);

// Eligible employees for payrun
router.get('/eligible-employees', payrollController.getEligibleEmployees);

// Payruns lifecycle
router.get('/payruns', payrollController.getPayruns);
router.get('/payruns/:id', payrollController.getPayrunById);
router.post(
  '/payruns',
  requireRole('HR Payroll User', 'HR Payroll Admin', 'Admin'),
  validateRequest({ body: createPayrunSchema }),
  payrollController.createPayrun
);
router.post(
  '/payruns/:id/compute',
  requireRole('HR Payroll User', 'HR Payroll Admin', 'Admin'),
  payrollController.computePayrun
);
router.post(
  '/payruns/:id/validate',
  requireRole('HR Payroll User', 'HR Payroll Admin', 'Admin'),
  payrollController.validatePayrun
);
router.post(
  '/payruns/:id/mark-paid',
  requireRole('HR Payroll Admin', 'Admin'),
  payrollController.markPaid
);
router.post(
  '/payruns/:id/send-payslips',
  requireRole('HR Payroll User', 'HR Payroll Admin', 'Admin'),
  payrollController.sendPayslips
);

// Payslips & PDF download
router.get('/payslips/:id', payrollController.getPayslip);
router.get('/payslips/:id/pdf', payrollController.downloadPdf);

export default router;
