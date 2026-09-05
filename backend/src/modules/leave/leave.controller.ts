import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { leaveService, LeaveService } from './leave.service';
import { ValidationError } from '../../shared/errors/app.error';

export class LeaveController {
  constructor(private readonly service: LeaveService = leaveService) {}

  getTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const types = await this.service.getLeaveTypes(orgId);
      res.json(types);
    } catch (err) {
      next(err);
    }
  };

  getRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const filters = {
        employee_id: req.query.employee_id as string,
        status: req.query.status as string,
      };
      const requests = await this.service.getLeaveRequests(orgId, filters);
      res.json(requests);
    } catch (err) {
      next(err);
    }
  };

  getAllocations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const employeeId = req.query.employee_id as string;
      const allocs = await this.service.getLeaveAllocations(orgId, employeeId);
      res.json(allocs);
    } catch (err) {
      next(err);
    }
  };

  createRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const isPrivileged = req.user?.role === 'Admin' || req.user?.role === 'HR Manager';
      let employeeId = (isPrivileged && req.body.employee_id) ? req.body.employee_id : req.user?.employeeId;

      if (!employeeId && req.user?.id) {
        const user = await prisma.user.findUnique({
          where: { id: req.user.id },
          include: { employee: true },
        });
        if (user?.employee_id) {
          employeeId = user.employee_id;
        } else if (user?.email) {
          const emp = await prisma.employee.findFirst({
            where: { organization_id: orgId, email: user.email },
          });
          if (emp) {
            employeeId = emp.id;
          }
        }
      }

      if (!employeeId) {
        throw new ValidationError('Employee ID is required for leave request');
      }
      const request = await this.service.createLeaveRequest(orgId, employeeId, req.body, req.user?.id);
      res.status(201).json(request);
    } catch (err) {
      next(err);
    }
  };

  approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const result = await this.service.processApproval(
        orgId,
        req.params.id as string,
        'Approved',
        req.user?.id
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  refuse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const result = await this.service.processApproval(
        orgId,
        req.params.id as string,
        'Refused',
        req.user?.id,
        req.body.rejection_reason
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  createAllocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const alloc = await this.service.createAllocation(orgId, req.body, req.user?.id);
      res.status(201).json(alloc);
    } catch (err) {
      next(err);
    }
  };
}

export const leaveController = new LeaveController();
