import { prisma } from '../../config/database';

export class ScheduleRepository {
  async findAll(organizationId: string) {
    return prisma.workingSchedule.findMany({
      where: { organization_id: organizationId },
      orderBy: { name: 'asc' },
    });
  }

  async findById(organizationId: string, id: string) {
    return prisma.workingSchedule.findFirst({
      where: { id, organization_id: organizationId },
    });
  }

  async create(data: {
    organization_id: string;
    name: string;
    standard_hours: number;
    days_per_week: number;
    schedule_json: string;
  }) {
    return prisma.workingSchedule.create({
      data,
    });
  }

  async update(organizationId: string, id: string, data: any) {
    return prisma.workingSchedule.updateMany({
      where: { id, organization_id: organizationId },
      data,
    });
  }
}

export const scheduleRepository = new ScheduleRepository();
