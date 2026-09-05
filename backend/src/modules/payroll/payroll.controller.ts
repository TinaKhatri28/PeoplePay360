import { Request, Response, NextFunction } from 'express';
import { payrollService, PayrollService } from './payroll.service';
import { payslipPdfService } from '../payslips/payslip-pdf.service';

export class PayrollController {
  constructor(private readonly service: PayrollService = payrollService) {}

  getEligibleEmployees = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const year = Number(req.query.year) || new Date().getFullYear();
      const month = Number(req.query.month) || (new Date().getMonth() + 1);

      const eligible = await this.service.getEligibleEmployees(orgId, year, month);
      res.json(eligible);
    } catch (err) {
      next(err);
    }
  };

  getPayruns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const payruns = await this.service.listPayruns(orgId);
      res.json(payruns);
    } catch (err) {
      next(err);
    }
  };

  getPayrunById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const payrun = await this.service.getPayrunById(orgId, req.params.id as string);
      res.json(payrun);
    } catch (err) {
      next(err);
    }
  };

  createPayrun = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const result = await this.service.createPayrun(orgId, req.body, req.user?.id);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  computePayrun = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const result = await this.service.computePayrun(orgId, req.params.id as string, req.user?.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  validatePayrun = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const result = await this.service.validatePayrun(orgId, req.params.id as string, req.user?.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  markPaid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const result = await this.service.markPaid(orgId, req.params.id as string, req.user?.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  sendPayslips = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const result = await this.service.sendPayslips(orgId, req.params.id as string, req.user?.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  getPayslip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const slip = await this.service.getPayslipById(orgId, req.params.id as string);
      res.json(slip);
    } catch (err) {
      next(err);
    }
  };

  downloadPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const slip = await this.service.getPayslipById(orgId, req.params.id as string);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="payslip-${slip.id}.pdf"`);

      payslipPdfService.generatePayslipPdf(slip, res);
    } catch (err) {
      next(err);
    }
  };
}

export const payrollController = new PayrollController();
