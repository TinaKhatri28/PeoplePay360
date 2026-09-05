import { Request, Response, NextFunction } from 'express';
import { employeeService, EmployeeService } from './employee.service';
import { departmentService } from '../departments/department.service';

export class EmployeeController {
  constructor(private readonly service: EmployeeService = employeeService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const employees = await this.service.listEmployees(orgId, req.query as any);
      res.json(employees);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const employee = await this.service.getEmployeeById(orgId, req.params.id as string);
      res.json(employee);
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
      const contracts = await this.service.getEmployeeContracts(orgId, req.params.id as string);
      res.json(contracts);
    } catch (err) {
      next(err);
    }
  };

  getAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const attendance = await this.service.getEmployeeAttendance(orgId, req.params.id as string);
      res.json(attendance);
    } catch (err) {
      next(err);
    }
  };

  getTimeOff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const requests = await this.service.getEmployeeTimeOffRequests(orgId, req.params.id as string);
      res.json(requests);
    } catch (err) {
      next(err);
    }
  };

  getAllocations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const allocations = await this.service.getEmployeeTimeOffAllocations(orgId, req.params.id as string);
      res.json(allocations);
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
