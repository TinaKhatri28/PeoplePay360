import { prisma } from '../../config/database';

export class AuthRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        organization: true,
        employee: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        organization: true,
        employee: true,
      },
    });
  }

  async createUser(data: {
    email: string;
    password_hash: string;
    role: string;
    organization_id: string;
    employee_id?: string;
  }) {
    return prisma.user.create({
      data: {
        email: data.email,
        password_hash: data.password_hash,
        role: data.role,
        organization_id: data.organization_id,
        employee_id: data.employee_id,
      },
      include: {
        organization: true,
        employee: true,
      },
    });
  }

  async updateRefreshTokenHash(userId: string, refreshHash: string | null) {
    return prisma.user.update({
      where: { id: userId },
      data: { refresh_hash: refreshHash },
    });
  }

  async updateStatus(userId: string, status: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { status },
    });
  }
}

export const authRepository = new AuthRepository();
