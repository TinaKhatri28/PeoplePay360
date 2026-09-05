import { prisma } from '../../config/database';

export class SalaryStructureRepository {
  async findAllStructures(organizationId: string) {
    return prisma.salaryStructure.findMany({
      where: { organization_id: organizationId },
      include: {
        rules: {
          orderBy: { sequence: 'asc' },
        },
      },
    });
  }

  async findStructureById(organizationId: string, id: string) {
    return prisma.salaryStructure.findFirst({
      where: { id, organization_id: organizationId },
      include: {
        rules: {
          orderBy: { sequence: 'asc' },
        },
      },
    });
  }

  async createStructure(organizationId: string, name: string, code?: string, description?: string) {
    return prisma.salaryStructure.create({
      data: {
        organization_id: organizationId,
        name,
        code,
        description,
      },
    });
  }

  async findAllRules(organizationId: string, structureId?: string) {
    const where: any = { organization_id: organizationId };
    if (structureId) where.structure_id = structureId;

    return prisma.salaryRule.findMany({
      where,
      orderBy: { sequence: 'asc' },
    });
  }

  async createRule(organizationId: string, data: any) {
    return prisma.salaryRule.create({
      data: {
        organization_id: organizationId,
        structure_id: data.structure_id,
        name: data.name,
        code: data.code,
        category: data.category,
        compute_method: data.compute_method,
        amount: data.amount !== undefined ? Number(data.amount) : null,
        percentage: data.percentage !== undefined ? Number(data.percentage) : null,
        percentage_of: data.percentage_of || null,
        formula_key: data.formula_key || null,
        sequence: data.sequence !== undefined ? Number(data.sequence) : 10,
        is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
      },
    });
  }

  async updateRule(organizationId: string, id: string, data: any) {
    return prisma.salaryRule.updateMany({
      where: { id, organization_id: organizationId },
      data,
    });
  }

  async deleteRule(organizationId: string, id: string) {
    return prisma.salaryRule.deleteMany({
      where: { id, organization_id: organizationId },
    });
  }
}

export const salaryStructureRepository = new SalaryStructureRepository();
