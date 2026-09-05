import { prisma } from '../../config/database';

export class AuditRepository {
  async createLog(data: {
    organization_id: string;
    user_id?: string | null;
    action: string;
    resource_type: string;
    resource_id: string;
    details_json?: string | null;
    ip_address?: string | null;
    user_agent?: string | null;
  }) {
    return prisma.auditLog.create({
      data: {
        organization_id: data.organization_id,
        user_id: data.user_id || null,
        action: data.action,
        resource_type: data.resource_type,
        resource_id: data.resource_id,
        details_json: data.details_json || null,
        ip_address: data.ip_address || null,
        user_agent: data.user_agent || null,
      },
    });
  }

  async findByResource(organizationId: string, resourceType: string, resourceId: string) {
    return prisma.auditLog.findMany({
      where: {
        organization_id: organizationId,
        resource_type: resourceType,
        resource_id: resourceId,
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
  }
}

export const auditRepository = new AuditRepository();
