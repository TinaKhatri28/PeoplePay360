import { prisma } from '../../config/database';

export class DashboardRepository {
  async getMetrics(organizationId: string, year: number, month: number) {
    const today = new Date().toISOString().slice(0, 10);
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const [
      totalEmployees,
      activeEmployees,
      departments,
      contractAggregate,
      attendanceGroup,
      attendanceMonth,
      pendingLeaves,
      leaveTypes,
      payruns,
      missingBankCount,
      expiringContractsCount,
    ] = await Promise.all([
      prisma.employee.count({ where: { organization_id: organizationId } }),
      prisma.employee.count({ where: { organization_id: organizationId, status: 'Active' } }),
      prisma.department.findMany({
        where: { organization_id: organizationId },
        select: {
          id: true,
          name: true,
          employees: {
            where: { status: 'Active' },
            select: {
              id: true,
              contracts: {
                where: { status: 'Running' },
                take: 1,
                select: { wage: true },
              },
            },
          },
        },
      }),
      prisma.employmentContract.aggregate({
        where: { organization_id: organizationId, status: 'Running' },
        _avg: { wage: true },
        _sum: { wage: true },
        _count: { id: true },
      }),
      prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: { organization_id: organizationId, date: today },
        _count: true,
      }),
      prisma.attendanceRecord.findMany({
        where: {
          organization_id: organizationId,
          OR: [
            { date: { startsWith: monthPrefix } },
            { date: { startsWith: `${year}-` } },
          ],
        },
        select: {
          status: true,
          date: true,
        },
      }),
      prisma.leaveRequest.count({
        where: { organization_id: organizationId, status: 'To Approve' },
      }),
      prisma.leaveType.findMany({
        where: { organization_id: organizationId },
        select: {
          id: true,
          name: true,
          code: true,
          requests: {
            select: { status: true, duration: true },
          },
          allocations: {
            select: { allocated: true, taken: true },
          },
        },
      }),
      prisma.payrun.findMany({
        where: { organization_id: organizationId },
        orderBy: [{ period_year: 'desc' }, { period_month: 'desc' }],
        take: 6,
        select: {
          id: true,
          period_year: true,
          period_month: true,
          status: true,
          total_gross: true,
          total_net: true,
          _count: {
            select: { payslips: true },
          },
        },
      }),
      prisma.employee.count({
        where: {
          organization_id: organizationId,
          OR: [{ bank_account: null }, { bank_account: '' }],
        },
      }),
      prisma.employmentContract.count({
        where: {
          organization_id: organizationId,
          status: 'Running',
          end_date: { lte: new Date(thirtyDaysFromNow), not: null },
        },
      }),
    ]);

    return {
      today,
      totalEmployees,
      activeEmployees,
      departments,
      contractAggregate,
      attendanceGroup,
      attendanceMonth,
      pendingLeaves,
      leaveTypes,
      payruns,
      missingBankCount,
      expiringContractsCount,
    };
  }

  async getWarningsCountForPayrun(payrunId: string): Promise<number> {
    return prisma.payslip.count({
      where: {
        payrun_id: payrunId,
        NOT: [{ warnings_json: '[]' }, { warnings_json: '' }],
      },
    });
  }
}

export const dashboardRepository = new DashboardRepository();
