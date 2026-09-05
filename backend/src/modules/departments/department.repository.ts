import { prisma } from '../../config/database';

export class DepartmentRepository {
  async findAll(organizationId: string) {
    return prisma.department.findMany({
      where: { organization_id: organizationId },
      orderBy: { name: 'asc' },
    });
  }

  async findByName(organizationId: string, name: string) {
    return prisma.department.findFirst({
      where: { organization_id: organizationId, name },
    });
  }

  async create(organizationId: string, name: string) {
    return prisma.department.create({
      data: {
        organization_id: organizationId,
        name,
      },
    });
  }
}

export const departmentRepository = new DepartmentRepository();
