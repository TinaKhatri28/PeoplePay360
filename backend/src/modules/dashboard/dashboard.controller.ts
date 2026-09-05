import { Request, Response, NextFunction } from 'express';
import { dashboardService, DashboardService } from './dashboard.service';

export class DashboardController {
  constructor(private readonly service: DashboardService = dashboardService) {}

  getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const year = req.query.year ? Number(req.query.year) : undefined;
      const month = req.query.month ? Number(req.query.month) : undefined;
      const department = req.query.department ? String(req.query.department) : undefined;
      const status = req.query.status ? String(req.query.status) : undefined;
      const entity = req.query.entity ? String(req.query.entity) : undefined;

      const data = await this.service.getDashboardSummary(orgId, year, month, department, status, entity);
      res.json(data);
    } catch (err) {
      next(err);
    }
  };
}

export const dashboardController = new DashboardController();
