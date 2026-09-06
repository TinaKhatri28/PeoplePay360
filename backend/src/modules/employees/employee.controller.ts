import { Request, Response, NextFunction } from 'express';
import { employeeService, EmployeeService } from './employee.service';
import { departmentService } from '../departments/department.service';
import { ForbiddenError } from '../../shared/errors/app.error';
import { sanitizeEmployeePII } from '../../shared/utils/masking.util';

export class EmployeeController {
  constructor(private readonly service: EmployeeService = employeeService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const employees = await this.service.listEmployees(orgId, req.query as any);
      const isPrivileged = req.user?.role === 'Admin' || req.user?.role === 'HR Manager' || req.user?.role === 'HR Payroll Admin' || req.user?.role === 'HR Payroll User';
      const sanitized = employees.map(emp => sanitizeEmployeePII(emp, isPrivileged || req.user?.employeeId === emp.id));
      res.json(sanitized);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const employee = await this.service.getEmployeeById(orgId, req.params.id as string);
      const isPrivileged = req.user?.role === 'Admin' || req.user?.role === 'HR Manager' || req.user?.role === 'HR Payroll Admin' || req.user?.role === 'HR Payroll User';
      const sanitized = sanitizeEmployeePII(employee, isPrivileged || req.user?.employeeId === employee.id);
      res.json(sanitized);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const employee = await this.service.createEmployee(orgId, req.body, req.user?.id);
      res.status(201).json(employee);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const employee = await this.service.updateEmployee(orgId, req.params.id as string, req.body, req.user?.id);
      res.json(employee);
    } catch (err) {
      next(err);
    }
  };

  getContracts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const targetId = req.params.id as string;
      const isPrivileged = req.user?.role === 'Admin' || req.user?.role === 'HR Manager' || req.user?.role === 'HR Payroll Admin' || req.user?.role === 'HR Payroll User';
      if (!isPrivileged && req.user?.employeeId !== targetId) {
        throw new ForbiddenError('You are not authorized to view another employee\'s contracts');
      }
      const contracts = await this.service.getEmployeeContracts(orgId, targetId);
      res.json(contracts);
    } catch (err) {
      next(err);
    }
  };

  getAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const targetId = req.params.id as string;
      const isPrivileged = req.user?.role === 'Admin' || req.user?.role === 'HR Manager' || req.user?.role === 'HR Payroll Admin';
      if (!isPrivileged && req.user?.employeeId !== targetId) {
        throw new ForbiddenError('You are not authorized to view another employee\'s attendance');
      }
      const attendance = await this.service.getEmployeeAttendance(orgId, targetId);
      res.json(attendance);
    } catch (err) {
      next(err);
    }
  };

  getTimeOff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const targetId = req.params.id as string;
      const isPrivileged = req.user?.role === 'Admin' || req.user?.role === 'HR Manager';
      if (!isPrivileged && req.user?.employeeId !== targetId) {
        throw new ForbiddenError('You are not authorized to view another employee\'s time-off requests');
      }
      const requests = await this.service.getEmployeeTimeOffRequests(orgId, targetId);
      res.json(requests);
    } catch (err) {
      next(err);
    }
  };

  getAllocations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const targetId = req.params.id as string;
      const isPrivileged = req.user?.role === 'Admin' || req.user?.role === 'HR Manager';
      if (!isPrivileged && req.user?.employeeId !== targetId) {
        throw new ForbiddenError('You are not authorized to view another employee\'s leave allocations');
      }
      const allocations = await this.service.getEmployeeTimeOffAllocations(orgId, targetId);
      res.json(allocations);
    } catch (err) {
      next(err);
    }
  };

  getPayslips = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const targetId = req.params.id as string;
      const isPrivileged = req.user?.role === 'Admin' || req.user?.role === 'HR Manager' || req.user?.role === 'HR Payroll Admin' || req.user?.role === 'HR Payroll User';
      if (!isPrivileged && req.user?.employeeId !== targetId) {
        throw new ForbiddenError('You are not authorized to view another employee\'s payslips');
      }
      const slips = await this.service.getEmployeePayslips(orgId, targetId);
      res.json(slips);
    } catch (err) {
      next(err);
    }
  };

  getMetaDepartments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const departments = await departmentService.getAllDepartments(orgId);
      res.json(departments);
    } catch (err) {
      next(err);
    }
  };
}

export const employeeController = new EmployeeController();
