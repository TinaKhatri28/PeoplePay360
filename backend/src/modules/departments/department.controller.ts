import { Request, Response, NextFunction } from 'express';
import { departmentService, DepartmentService } from './department.service';

export class DepartmentController {
  constructor(private readonly service: DepartmentService = departmentService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const departments = await this.service.getAllDepartments(orgId);
      res.json(departments);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const { name } = req.body;
      const department = await this.service.createDepartment(orgId, name);
      res.status(201).json(department);
    } catch (err) {
      next(err);
    }
  };
}

export const departmentController = new DepartmentController();
