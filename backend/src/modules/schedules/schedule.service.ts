import { scheduleRepository, ScheduleRepository } from './schedule.repository';
import { NotFoundError } from '../../shared/errors/app.error';

export interface ScheduleDay {
  day: string; // Monday, Tuesday, etc.
  start?: string; // 09:00
  end?: string; // 18:00
  breakHours?: number;
  isOff?: boolean;
}

export class ScheduleService {
  constructor(private readonly repo: ScheduleRepository = scheduleRepository) {}

  /**
   * Dynamically compute weekly hours from day definitions
   */
  calculateWeeklyHours(days: ScheduleDay[]): number {
    let total = 0;
    for (const d of days) {
      if (d.isOff || !d.start || !d.end) continue;
      const [sh, sm] = d.start.split(':').map(Number);
      const [eh, em] = d.end.split(':').map(Number);
      let dayDuration = (eh + em / 60) - (sh + sm / 60);
      if (dayDuration < 0) {
        dayDuration += 24; // overnight shift handling
      }
      dayDuration -= (d.breakHours || 0);
      total += Math.max(0, dayDuration);
    }
    return +total.toFixed(2);
  }

  async getAllSchedules(organizationId: string) {
    const schedules = await this.repo.findAll(organizationId);
    return schedules.map((s) => {
      let days: ScheduleDay[] = [];
      try {
        days = JSON.parse(s.schedule_json || '[]');
      } catch {
        days = [];
      }
      const weeklyHours = this.calculateWeeklyHours(days);
      return {
        ...s,
        schedule: days,
        weekly_hours: weeklyHours,
      };
    });
  }

  async getScheduleById(organizationId: string, id: string) {
    const s = await this.repo.findById(organizationId, id);
    if (!s) {
      throw new NotFoundError(`Schedule with id ${id} not found`);
    }
    let days: ScheduleDay[] = [];
    try {
      days = JSON.parse(s.schedule_json || '[]');
    } catch {
      days = [];
    }
    return {
      ...s,
      schedule: days,
      weekly_hours: this.calculateWeeklyHours(days),
    };
  }

  async createSchedule(organizationId: string, data: any) {
    const days: ScheduleDay[] = Array.isArray(data.schedule) 
      ? data.schedule 
      : (typeof data.schedule_json === 'string' ? JSON.parse(data.schedule_json) : []);

    const workingDays = days.filter((d) => !d.isOff && d.start && d.end).length;
    const weeklyHours = this.calculateWeeklyHours(days);
    const standardHours = workingDays > 0 ? +(weeklyHours / workingDays).toFixed(2) : 8;

    const created = await this.repo.create({
      organization_id: organizationId,
      name: data.name,
      days_per_week: workingDays,
      standard_hours: standardHours,
      schedule_json: JSON.stringify(days),
    });

    return {
      ...created,
      schedule: days,
      weekly_hours: weeklyHours,
    };
  }
}

export const scheduleService = new ScheduleService();
