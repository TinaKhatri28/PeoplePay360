import { departmentRepository, DepartmentRepository } from './department.repository';
import { ConflictError } from '../../shared/errors/app.error';
import { cacheService } from '../../shared/utils/cache.service';

export class DepartmentService {
  constructor(private readonly repo: DepartmentRepository = departmentRepository) {}

  async getAllDepartments(organizationId: string) {
    const cacheKey = `departments:${organizationId}`;
    return cacheService.getOrSet(cacheKey, () => this.repo.findAll(organizationId), 300);
  }

  async createDepartment(organizationId: string, name: string) {
    const existing = await this.repo.findByName(organizationId, name);
    if (existing) {
      throw new ConflictError(`Department "${name}" already exists`);
    }
    const created = await this.repo.create(organizationId, name);
    await cacheService.del(`departments:${organizationId}`);
    return created;
  }
}

export const departmentService = new DepartmentService();
