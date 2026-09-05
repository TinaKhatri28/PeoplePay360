import { Router } from 'express';
import { payrollController } from './payroll.controller';
import { authenticate } from '../../shared/guards/authenticate.guard';
import { requireRole } from '../../shared/guards/require-permission.guard';
import { validateRequest } from '../../shared/middleware/validate.middleware';
import { createPayrunSchema, idParamSchema } from './payroll.schema';

const router = Router();

router.use(authenticate);

// Eligible employees for payrun
router.get('/eligible-employees', requireRole('HR Payroll User', 'HR Payroll Admin', 'Admin'), payrollController.getEligibleEmployees);

// Payruns lifecycle
router.get('/payruns', requireRole('HR Payroll User', 'HR Payroll Admin', 'Admin'), payrollController.getPayruns);
router.get(
  '/payruns/:id',
  requireRole('HR Payroll User', 'HR Payroll Admin', 'Admin'),
  validateRequest({ params: idParamSchema }),
  payrollController.getPayrunById
);
router.post(
  '/payruns',
  requireRole('HR Payroll User', 'HR Payroll Admin', 'Admin'),
  validateRequest({ body: createPayrunSchema }),
  payrollController.createPayrun
);
router.post(
  '/payruns/:id/compute',
  requireRole('HR Payroll User', 'HR Payroll Admin', 'Admin'),
  validateRequest({ params: idParamSchema }),
  payrollController.computePayrun
);
router.post(
  '/payruns/:id/validate',
  requireRole('HR Payroll User', 'HR Payroll Admin', 'Admin'),
  validateRequest({ params: idParamSchema }),
  payrollController.validatePayrun
);
router.post(
  '/payruns/:id/mark-paid',
  requireRole('HR Payroll Admin', 'Admin'),
  validateRequest({ params: idParamSchema }),
  payrollController.markPaid
);
router.post(
  '/payruns/:id/send-payslips',
  requireRole('HR Payroll User', 'HR Payroll Admin', 'Admin'),
  validateRequest({ params: idParamSchema }),
  payrollController.sendPayslips
);

// Payslips & PDF download
router.get('/payslips/:id', validateRequest({ params: idParamSchema }), payrollController.getPayslip);
router.get('/payslips/:id/pdf', validateRequest({ params: idParamSchema }), payrollController.downloadPdf);

export default router;
