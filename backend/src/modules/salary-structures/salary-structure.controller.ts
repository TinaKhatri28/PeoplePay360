import { Request, Response, NextFunction } from 'express';
import { salaryStructureService, SalaryStructureService } from './salary-structure.service';

export class SalaryStructureController {
  constructor(private readonly service: SalaryStructureService = salaryStructureService) {}

  getStructures = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const structures = await this.service.getAllStructures(orgId);
      res.json(structures);
    } catch (err) {
      next(err);
    }
  };

  createStructure = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const { name, code, description } = req.body;
      const created = await this.service.createStructure(orgId, name, code, description, req.user?.id);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  };

  getRules = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const structureId = req.query.structure_id as string;
      const rules = await this.service.getAllRules(orgId, structureId);
      res.json(rules);
    } catch (err) {
      next(err);
    }
  };

  createRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const created = await this.service.createRule(orgId, req.body, req.user?.id);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  };

  updateRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const updated = await this.service.updateRule(orgId, req.params.id as string, req.body, req.user?.id);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  };

  deleteRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const result = await this.service.deleteRule(orgId, req.params.id as string, req.user?.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}

export const salaryStructureController = new SalaryStructureController();
