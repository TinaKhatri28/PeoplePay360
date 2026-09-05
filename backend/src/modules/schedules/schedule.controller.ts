import { Request, Response, NextFunction } from 'express';
import { scheduleService, ScheduleService } from './schedule.service';

export class ScheduleController {
  constructor(private readonly service: ScheduleService = scheduleService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const schedules = await this.service.getAllSchedules(orgId);
      res.json(schedules);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const schedule = await this.service.getScheduleById(orgId, req.params.id as string);
      res.json(schedule);
    } catch (err) {
      next(err);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const schedule = await this.service.createSchedule(orgId, req.body);
      res.status(201).json(schedule);
    } catch (err) {
      next(err);
    }
  };
}

export const scheduleController = new ScheduleController();
