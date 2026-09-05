import { userRepository, UserRepository } from './user.repository';
import { authService, AuthService } from '../auth/auth.service';
import { NotFoundError, ValidationError, ConflictError } from '../../shared/errors/app.error';

export const VALID_ROLES = ['Admin', 'HR Manager', 'HR Payroll Admin', 'HR Payroll User', 'Employee'] as const;
export type ValidRole = typeof VALID_ROLES[number];

export class UserService {
  constructor(
    private readonly repo: UserRepository = userRepository,
    private readonly auth: AuthService = authService
  ) {}

  async getAllUsers(organizationId: string) {
    const users = await this.repo.findAll(organizationId);
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      roles: u.role,
      status: u.status,
      employee_id: u.employee_id,
      employee_name: u.employee ? `${u.employee.first_name} ${u.employee.last_name}` : null,
      created_at: u.created_at,
    }));
  }

  async getUserById(organizationId: string, id: string) {
    const user = await this.repo.findById(organizationId, id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      roles: user.role,
      status: user.status,
      employee_id: user.employee_id,
      employee_name: user.employee ? `${user.employee.first_name} ${user.employee.last_name}` : null,
      created_at: user.created_at,
    };
  }

  async getUserByEmail(organizationId: string, email: string) {
    return this.repo.findByEmail(organizationId, email);
  }

  async createUser(
    organizationId: string,
    data: {
      email: string;
      password?: string;
      roles?: string;
      role?: string;
      employee_id?: string | null;
    }
  ) {
    if (!data.email) {
      throw new ValidationError('Email is required');
    }

    const existing = await this.repo.findByEmail(organizationId, data.email);
    if (existing) {
      throw new ConflictError(`User with email ${data.email} already exists`);
    }

    const targetRole = (data.role || data.roles || 'Employee') as ValidRole;
    if (!VALID_ROLES.includes(targetRole)) {
      throw new ValidationError(`Invalid role: ${targetRole}. Valid roles: ${VALID_ROLES.join(', ')}`);
    }

    const passwordHash = await this.auth.hashPassword(data.password || 'password123');

    const user = await this.repo.create({
      organization_id: organizationId,
      email: data.email,
      password_hash: passwordHash,
      role: targetRole,
      employee_id: data.employee_id || null,
    });

    return { id: user.id, email: user.email, role: user.role };
  }

  async updateUser(
    organizationId: string,
    id: string,
    data: {
      roles?: string;
      role?: string;
      status?: string;
      password?: string;
      employee_id?: string | null;
    }
  ) {
    const updateData: any = {};
    if (data.roles || data.role) {
      const targetRole = (data.role || data.roles) as ValidRole;
      if (!VALID_ROLES.includes(targetRole)) {
        throw new ValidationError(`Invalid role: ${targetRole}. Valid roles: ${VALID_ROLES.join(', ')}`);
      }
      updateData.role = targetRole;
    }
    if (data.status) updateData.status = data.status;
    if (data.password) updateData.password_hash = await this.auth.hashPassword(data.password);
    if (data.employee_id !== undefined) updateData.employee_id = data.employee_id;

    const result = await this.repo.update(organizationId, id, updateData);
    if (result.count === 0) {
      throw new NotFoundError('User not found');
    }

    return { ok: true };
  }
}

export const userService = new UserService();
