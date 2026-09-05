import { prisma } from '../../config/database';

export class ContractRepository {
  async findAll(organizationId: string) {
    return prisma.employmentContract.findMany({
      where: { organization_id: organizationId },
      include: {
        employee: true,
        salary_structure: true,
        schedule: true,
      },
      orderBy: { start_date: 'desc' },
    });
  }

  async findById(organizationId: string, id: string) {
    return prisma.employmentContract.findFirst({
      where: { id, organization_id: organizationId },
      include: {
        employee: true,
        salary_structure: {
          include: {
            rules: {
              where: { is_active: true },
              orderBy: { sequence: 'asc' },
            },
          },
        },
        schedule: true,
      },
    });
  }

  async findActiveContractsForEmployee(organizationId: string, employeeId: string) {
    return prisma.employmentContract.findMany({
      where: {
        organization_id: organizationId,
        employee_id: employeeId,
        status: 'Running',
      },
    });
  }

  async findContractValidForPeriod(organizationId: string, employeeId: string, periodStart: Date, periodEnd: Date) {
    // A contract covers the period if:
    // contract.start_date <= periodEnd AND (contract.end_date is null OR contract.end_date >= periodStart)
    const contracts = await prisma.employmentContract.findMany({
      where: {
        organization_id: organizationId,
        employee_id: employeeId,
        start_date: { lte: periodEnd },
        OR: [
          { end_date: null },
          { end_date: { gte: periodStart } },
        ],
      },
      include: {
        salary_structure: {
          include: {
            rules: {
              where: { is_active: true },
              orderBy: { sequence: 'asc' },
            },
          },
        },
      },
      orderBy: { start_date: 'desc' },
    });

    // Prefer Running contract
    const running = contracts.find((c) => c.status === 'Running');
    return running || contracts[0] || null;
  }

  async findContractsValidForPeriodForEmployees(
    organizationId: string,
    employeeIds: string[],
    periodStart: Date,
    periodEnd: Date
  ) {
    return prisma.employmentContract.findMany({
      where: {
        organization_id: organizationId,
        employee_id: { in: employeeIds },
        start_date: { lte: periodEnd },
        OR: [
          { end_date: null },
          { end_date: { gte: periodStart } },
        ],
      },
      include: {
        salary_structure: {
          include: {
            rules: {
              where: { is_active: true },
              orderBy: { sequence: 'asc' },
            },
          },
        },
      },
      orderBy: { start_date: 'desc' },
    });
  }

  async create(data: any) {
    return prisma.employmentContract.create({
      data,
      include: {
        employee: true,
        salary_structure: true,
      },
    });
  }

  async update(organizationId: string, id: string, data: any) {
    return prisma.employmentContract.updateMany({
      where: { id, organization_id: organizationId },
      data,
    });
  }
}

export const contractRepository = new ContractRepository();
