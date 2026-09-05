import { prisma } from '../../config/database';
import { attendanceRepository, AttendanceRepository } from './attendance.repository';
import { scheduleService, ScheduleService } from '../schedules/schedule.service';
import { auditService, AuditService } from '../audit/audit.service';
import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors/app.error';

export class AttendanceService {
  constructor(
    private readonly repo: AttendanceRepository = attendanceRepository,
    private readonly schedule: ScheduleService = scheduleService,
    private readonly audit: AuditService = auditService
  ) {}

  async listAttendance(organizationId: string, filters: { date?: string; employee_id?: string }) {
    const records = await this.repo.findAll(organizationId, filters);
    return records.map((r: any) => ({
      ...r,
      employee_name: r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : 'Unknown',
      department_name: r.employee?.department?.name || 'General',
      manager_name: r.employee?.manager ? `${r.employee.manager.first_name} ${r.employee.manager.last_name}` : 'None',
    }));
  }

  async getAttendanceById(id: string) {
    const record = await this.repo.findById(id);
    if (!record) {
      throw new NotFoundError('Attendance record not found');
    }
    return {
      ...record,
      employee_name: record.employee ? `${record.employee.first_name} ${record.employee.last_name}` : 'Unknown',
      department_name: record.employee?.department?.name || 'General',
      manager_name: record.employee?.manager ? `${record.employee.manager.first_name} ${record.employee.manager.last_name}` : 'None',
    };
  }

  async createManual(organizationId: string, data: any) {
    const checkIn = data.check_in ? new Date(data.check_in) : null;
    const checkOut = data.check_out ? new Date(data.check_out) : null;

    let workedHours = Number(data.worked_hours) || 0;
    let overtimeHours = Number(data.overtime_hours) || 0;

    if (checkIn && checkOut && !data.worked_hours) {
      const diffMs = checkOut.getTime() - checkIn.getTime();
      workedHours = Math.max(0, +(diffMs / (1000 * 60 * 60)).toFixed(2));
      overtimeHours = workedHours > 8 ? +(workedHours - 8).toFixed(2) : 0;
    }

    return this.repo.create({
      organization_id: organizationId,
      employee_id: data.employee_id,
      date: data.date,
      check_in: checkIn,
      check_out: checkOut,
      worked_hours: workedHours,
      overtime_hours: overtimeHours,
      status: data.status || 'Present',
      notes: data.notes || 'Manually recorded by HR/Manager',
    });
  }

  async getMyStatus(organizationId: string, employeeId: string) {
    const today = new Date().toISOString().slice(0, 10);
    const record = await this.repo.findByEmployeeAndDate(organizationId, employeeId, today);
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });

    let elapsedMinutes = 0;
    let elapsedFormatted = '0h00';
    if (record && record.check_in && !record.check_out) {
      const diffMs = Date.now() - new Date(record.check_in).getTime();
      elapsedMinutes = Math.max(0, Math.floor(diffMs / 60000));
      const hours = Math.floor(elapsedMinutes / 60);
      const mins = elapsedMinutes % 60;
      elapsedFormatted = `${hours}h${String(mins).padStart(2, '0')}`;
    }

    return {
      checkedIn: !!(record && record.check_in && !record.check_out),
      userName: emp ? `${emp.first_name} ${emp.last_name}` : 'User',
      checkInTime: record?.check_in || null,
      elapsedMinutes,
      elapsedFormatted,
      todayWorkedHours: record?.worked_hours || 0,
      record,
    };
  }

  async checkIn(organizationId: string, employeeId: string, inputTime?: string, notes?: string) {
    // 1. Concurrency & duplicate check: verify employee does not already have an open session
    const openSession = await this.repo.findActiveOpenCheckIn(organizationId, employeeId);
    if (openSession) {
      throw new ConflictError('Employee already has an active check-in session. Please check out first.');
    }

    const now = inputTime ? new Date(inputTime) : new Date();
    const dateStr = now.toISOString().slice(0, 10);

    // 2. Schedule comparison for Late Detection
    let isLate = false;
    let lateMinutes = 0;
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    const scheduleId = emp?.schedule_id;
    if (scheduleId) {
      try {
        const sched = await this.schedule.getScheduleById(organizationId, scheduleId);
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[now.getDay()];
        const dayConfig = sched.schedule.find((d) => d.day === dayName);

        if (dayConfig && !dayConfig.isOff && dayConfig.start) {
          const [sh, sm] = dayConfig.start.split(':').map(Number);
          const scheduledCheckIn = new Date(now);
          scheduledCheckIn.setHours(sh, sm, 0, 0);

          if (now > scheduledCheckIn) {
            lateMinutes = Math.round((now.getTime() - scheduledCheckIn.getTime()) / 60000);
            if (lateMinutes > 15) { // 15 minutes grace period
              isLate = true;
            }
          }
        }
      } catch {}
    }

    const created = await this.repo.create({
      organization_id: organizationId,
      employee_id: employeeId,
      date: dateStr,
      check_in: now,
      late_minutes: lateMinutes,
      status: isLate ? 'Late' : 'Present',
      notes: notes || null,
    });

    return created;
  }

  async checkOut(organizationId: string, employeeId: string, inputTime?: string, notes?: string) {
    const active = await this.repo.findActiveOpenCheckIn(organizationId, employeeId);
    if (!active || !active.check_in) {
      throw new NotFoundError('No active check-in session found for this employee.');
    }

    const checkOutTime = inputTime ? new Date(inputTime) : new Date();

    if (checkOutTime <= active.check_in) {
      throw new ValidationError('Check-out time must be strictly after check-in time.');
    }

    // Calculate worked hours
    const diffMs = checkOutTime.getTime() - active.check_in.getTime();
    const workedHours = +(diffMs / (1000 * 60 * 60)).toFixed(2);

    // Standard hours is 8.0, calculate overtime
    const standardHours = 8.0;
    const overtimeHours = workedHours > standardHours ? +(workedHours - standardHours).toFixed(2) : 0;

    let finalStatus = active.status;
    if (overtimeHours > 0) {
      finalStatus = 'Overtime';
    } else if (active.status === 'Present') {
      finalStatus = 'Present';
    }

    const updated = await this.repo.update(active.id, {
      check_out: checkOutTime,
      worked_hours: workedHours,
      overtime_hours: overtimeHours,
      status: finalStatus,
      notes: notes || active.notes,
    });

    return updated;
  }

  async updateAttendance(id: string, data: any, actorUserId?: string) {
    const updatePayload: any = {};
    if (data.check_in) updatePayload.check_in = new Date(data.check_in);
    if (data.check_out) updatePayload.check_out = new Date(data.check_out);
    if (data.status) updatePayload.status = data.status;
    if (data.notes !== undefined) updatePayload.notes = data.notes;
    if (data.worked_hours !== undefined) updatePayload.worked_hours = Number(data.worked_hours);
    if (data.overtime_hours !== undefined) updatePayload.overtime_hours = Number(data.overtime_hours);

    return this.repo.update(id, updatePayload);
  }
}

export const attendanceService = new AttendanceService();
