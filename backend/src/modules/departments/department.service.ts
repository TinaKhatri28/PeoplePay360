import { departmentRepository, DepartmentRepository } from './department.repository';
import { ConflictError } from '../../shared/errors/app.error';

export class DepartmentService {
  constructor(private readonly repo: DepartmentRepository = departmentRepository) {}

  async getAllDepartments(organizationId: string) {
    return this.repo.findAll(organizationId);
  }

  async createDepartment(organizationId: string, name: string) {
    const existing = await this.repo.findByName(organizationId, name);
    if (existing) {
      throw new ConflictError(`Department "${name}" already exists`);
    }
    return this.repo.create(organizationId, name);
  }
}

export const departmentService = new DepartmentService();
