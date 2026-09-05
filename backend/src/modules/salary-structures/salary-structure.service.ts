import { salaryStructureRepository, SalaryStructureRepository } from './salary-structure.repository';
import { auditService, AuditService } from '../audit/audit.service';
import { NotFoundError } from '../../shared/errors/app.error';

export class SalaryStructureService {
  constructor(
    private readonly repo: SalaryStructureRepository = salaryStructureRepository,
    private readonly audit: AuditService = auditService
  ) {}

  async getAllStructures(organizationId: string) {
    return this.repo.findAllStructures(organizationId);
  }

  async getStructureById(organizationId: string, id: string) {
    const s = await this.repo.findStructureById(organizationId, id);
    if (!s) {
      throw new NotFoundError(`Salary structure with id ${id} not found`);
    }
    return s;
  }

  async createStructure(organizationId: string, name: string, code?: string, description?: string, actorUserId?: string) {
    const created = await this.repo.createStructure(organizationId, name, code, description);
    await this.audit.log({
      organizationId,
      userId: actorUserId,
      action: 'SALARY_STRUCTURE_CREATED',
      resourceType: 'salary_structure',
      resourceId: created.id,
      details: { name: created.name },
    });
    return created;
  }

  async getAllRules(organizationId: string, structureId?: string) {
    return this.repo.findAllRules(organizationId, structureId);
  }

  async createRule(organizationId: string, data: any, actorUserId?: string) {
    const created = await this.repo.createRule(organizationId, data);
    await this.audit.log({
      organizationId,
      userId: actorUserId,
      action: 'SALARY_RULE_CREATED',
      resourceType: 'salary_rule',
      resourceId: created.id,
      details: { name: created.name, structure_id: created.structure_id },
    });
    return created;
  }

  async updateRule(organizationId: string, id: string, data: any, actorUserId?: string) {
    await this.repo.updateRule(organizationId, id, data);
    await this.audit.log({
      organizationId,
      userId: actorUserId,
      action: 'SALARY_RULE_UPDATED',
      resourceType: 'salary_rule',
      resourceId: id,
      details: data,
    });
    return { success: true };
  }

  async deleteRule(organizationId: string, id: string, actorUserId?: string) {
    await this.repo.deleteRule(organizationId, id);
    await this.audit.log({
      organizationId,
      userId: actorUserId,
      action: 'SALARY_RULE_DELETED',
      resourceType: 'salary_rule',
      resourceId: id,
    });
    return { success: true };
  }
}

export const salaryStructureService = new SalaryStructureService();
