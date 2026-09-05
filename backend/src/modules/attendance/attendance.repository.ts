import { prisma } from '../../config/database';

export class AttendanceRepository {
  async findAll(organizationId: string, filters: { date?: string; employee_id?: string }) {
    const where: any = { organization_id: organizationId };
    if (filters.date) where.date = filters.date;
    if (filters.employee_id) where.employee_id = filters.employee_id;

    return prisma.attendanceRecord.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            position: true,
            schedule_id: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findByEmployeeAndDate(organizationId: string, employeeId: string, dateStr: string) {
    return prisma.attendanceRecord.findFirst({
      where: {
        organization_id: organizationId,
        employee_id: employeeId,
        date: dateStr,
      },
      include: {
        employee: {
          include: { schedule: true },
        },
      },
    });
  }

  async findActiveOpenCheckIn(organizationId: string, employeeId: string) {
    return prisma.attendanceRecord.findFirst({
      where: {
        organization_id: organizationId,
        employee_id: employeeId,
        check_out: null,
      },
      orderBy: { created_at: 'desc' },
      include: {
        employee: {
          include: { schedule: true },
        },
      },
    });
  }

  async create(data: any) {
    return prisma.attendanceRecord.create({
      data,
    });
  }

  async update(id: string, data: any) {
    return prisma.attendanceRecord.update({
      where: { id },
      data,
    });
  }
}

export const attendanceRepository = new AttendanceRepository();
