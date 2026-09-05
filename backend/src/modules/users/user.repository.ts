import { prisma } from '../../config/database';

export class UserRepository {
  async findAll(organizationId: string) {
    return prisma.user.findMany({
      where: { organization_id: organizationId },
      include: { employee: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async findById(organizationId: string, id: string) {
    return prisma.user.findFirst({
      where: { id, organization_id: organizationId },
      include: { employee: true },
    });
  }

  async findByEmail(organizationId: string, email: string) {
    return prisma.user.findFirst({
      where: { email, organization_id: organizationId },
      include: { employee: true },
    });
  }

  async create(data: {
    organization_id: string;
    email: string;
    password_hash: string;
    role: string;
    employee_id?: string | null;
  }) {
    return prisma.user.create({
      data,
    });
  }

  async update(
    organizationId: string,
    id: string,
    data: {
      role?: string;
      status?: string;
      password_hash?: string;
      employee_id?: string | null;
    }
  ) {
    return prisma.user.updateMany({
      where: { id, organization_id: organizationId },
      data,
    });
  }

  async count(organizationId: string, whereClause: any = {}) {
    return prisma.user.count({
      where: { organization_id: organizationId, ...whereClause },
    });
  }
}

export const userRepository = new UserRepository();
