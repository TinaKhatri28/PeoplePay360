import { prisma } from '../../config/database';

export class EmployeeRepository {
  async findAll(organizationId: string, filters: {
    search?: string;
    department_id?: string;
    status?: string;
    skip?: number;
    take?: number;
  }) {
    const where: any = {
      organization_id: organizationId,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.department_id) {
      where.department_id = filters.department_id;
    }

    if (filters.search) {
      where.OR = [
        { first_name: { contains: filters.search } },
        { last_name: { contains: filters.search } },
        { email: { contains: filters.search } },
        { position: { contains: filters.search } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        include: {
          department: true,
          manager: true,
          schedule: true,
          contracts: {
            where: { status: 'Running' },
            take: 1,
            orderBy: { start_date: 'desc' },
          },
        },
        orderBy: { first_name: 'asc' },
        skip: filters.skip || 0,
        take: filters.take || 50,
      }),
    ]);

    return { total, items };
  }

  async findByEmail(emailOrOrgId: string, email?: string) {
    if (email) {
      return prisma.employee.findFirst({
        where: { email, organization_id: emailOrOrgId },
      });
    }
    return prisma.employee.findUnique({
      where: { email: emailOrOrgId },
    });
  }

  async findManyByIds(organizationId: string, ids: string[]) {
    return prisma.employee.findMany({
      where: { id: { in: ids }, organization_id: organizationId },
    });
  }

  async findById(organizationId: string, id: string) {
    return prisma.employee.findFirst({
      where: { id, organization_id: organizationId },
      include: {
        department: true,
        manager: true,
        schedule: true,
        contracts: {
          orderBy: { start_date: 'desc' },
        },
        _count: {
          select: {
            contracts: true,
            attendance: true,
            leave_requests: true,
            leave_allocations: true,
          },
        },
      },
    });
  }

  async create(data: any) {
    return prisma.employee.create({
      data,
      include: {
        department: true,
        schedule: true,
      },
    });
  }

  async update(organizationId: string, id: string, data: any) {
    return prisma.employee.updateMany({
      where: { id, organization_id: organizationId },
      data,
    });
  }

  async getContracts(organizationId: string, employeeId: string) {
    return prisma.employmentContract.findMany({
      where: { employee_id: employeeId, organization_id: organizationId },
      include: { salary_structure: true, schedule: true },
      orderBy: { start_date: 'desc' },
    });
  }

  async getAttendance(organizationId: string, employeeId: string) {
    return prisma.attendanceRecord.findMany({
      where: { employee_id: employeeId, organization_id: organizationId },
      orderBy: { date: 'desc' },
      take: 60,
    });
  }

  async getTimeOffRequests(organizationId: string, employeeId: string) {
    return prisma.leaveRequest.findMany({
      where: { employee_id: employeeId, organization_id: organizationId },
      include: { leave_type: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async getTimeOffAllocations(organizationId: string, employeeId: string) {
    return prisma.leaveAllocation.findMany({
      where: { employee_id: employeeId, organization_id: organizationId },
      include: { leave_type: true },
    });
  }
}

export const employeeRepository = new EmployeeRepository();
