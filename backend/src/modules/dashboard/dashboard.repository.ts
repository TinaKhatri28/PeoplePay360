import { prisma } from '../../config/database';

export class DashboardRepository {
  async getMetrics(organizationId: string, year: number, month: number) {
    const today = new Date().toISOString().slice(0, 10);
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;

    const [
      totalEmployees,
      activeEmployees,
      departments,
      contracts,
      attendanceToday,
      attendanceMonth,
      pendingLeaves,
      leaveTypes,
      payruns,
    ] = await Promise.all([
      prisma.employee.count({ where: { organization_id: organizationId } }),
      prisma.employee.count({ where: { organization_id: organizationId, status: 'Active' } }),
      prisma.department.findMany({
        where: { organization_id: organizationId },
        include: {
          employees: {
            where: { status: 'Active' },
            include: {
              contracts: {
                where: { status: 'Running' },
                take: 1,
              },
            },
          },
        },
      }),
      prisma.employmentContract.findMany({
        where: { organization_id: organizationId, status: 'Running' },
      }),
      prisma.attendanceRecord.findMany({
        where: { organization_id: organizationId, date: today },
      }),
      prisma.attendanceRecord.findMany({
        where: {
          organization_id: organizationId,
          OR: [
            { date: { startsWith: monthPrefix } },
            { date: { startsWith: `${year}-` } },
          ],
        },
      }),
      prisma.leaveRequest.count({
        where: { organization_id: organizationId, status: 'To Approve' },
      }),
      prisma.leaveType.findMany({
        where: { organization_id: organizationId },
        include: {
          requests: true,
          allocations: true,
        },
      }),
      prisma.payrun.findMany({
        where: { organization_id: organizationId },
        orderBy: [{ period_year: 'desc' }, { period_month: 'desc' }],
        take: 6,
        include: {
          payslips: true,
        },
      }),
    ]);

    return {
      totalEmployees,
      activeEmployees,
      departments,
      contracts,
      attendanceToday,
      attendanceMonth,
      pendingLeaves,
      leaveTypes,
      payruns,
    };
  }
}

export const dashboardRepository = new DashboardRepository();

