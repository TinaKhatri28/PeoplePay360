import { Request, Response, NextFunction } from 'express';
import { attendanceService, AttendanceService } from './attendance.service';
import { ValidationError } from '../../shared/errors/app.error';

export class AttendanceController {
  constructor(private readonly service: AttendanceService = attendanceService) {}

  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const filters = {
        date: req.query.date as string,
        employee_id: req.query.employee_id as string,
      };
      const records = await this.service.listAttendance(orgId, filters);
      res.json(records);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const record = await this.service.getAttendanceById(orgId, req.params.id as string);
      res.json(record);
    } catch (err) {
      next(err);
    }
  };

  createManual = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const record = await this.service.createManual(orgId, req.body);
      res.status(201).json(record);
    } catch (err) {
      next(err);
    }
  };

  getMyStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const employeeId = req.user?.employeeId;
      if (!employeeId) {
        res.json({ checkedIn: false, record: null });
        return;
      }
      const status = await this.service.getMyStatus(orgId, employeeId);
      res.json(status);
    } catch (err) {
      next(err);
    }
  };

  checkIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const isPrivileged = req.user?.role === 'Admin' || req.user?.role === 'HR Manager';
      const employeeId = isPrivileged ? (req.body.employee_id || req.user?.employeeId) : req.user?.employeeId;
      if (!employeeId) {
        throw new ValidationError('Employee ID is required for check-in');
      }
      const result = await this.service.checkIn(orgId, employeeId, req.body.time, req.body.notes);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  checkOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const isPrivileged = req.user?.role === 'Admin' || req.user?.role === 'HR Manager';
      const employeeId = isPrivileged ? (req.body.employee_id || req.user?.employeeId) : req.user?.employeeId;
      if (!employeeId) {
        throw new ValidationError('Employee ID is required for check-out');
      }
      const result = await this.service.checkOut(orgId, employeeId, req.body.time, req.body.notes);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const result = await this.service.updateAttendance(orgId, req.params.id as string, req.body, req.user?.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  bulkUpdate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const result = await this.service.bulkUpdateAttendanceStatus(orgId, req.body.ids, req.body.status, req.user?.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  bulkDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orgId = req.organizationId || 'org_default';
      const result = await this.service.bulkDeleteAttendance(orgId, req.body.ids, req.user?.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };
}

export const attendanceController = new AttendanceController();
