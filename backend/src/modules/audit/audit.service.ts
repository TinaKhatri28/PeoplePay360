import { auditRepository, AuditRepository } from './audit.repository';
import { logger } from '../../shared/logger/logger';

export class AuditService {
  constructor(private readonly repo: AuditRepository = auditRepository) {}

  async log(params: {
    organizationId: string;
    userId?: string | null;
    action: string;
    resourceType: string;
    resourceId: string;
    details?: any;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    try {
      // Never log sensitive passwords or tokens
      const sanitizedDetails = params.details ? JSON.stringify(params.details, (key, value) => {
        if (['password', 'password_hash', 'token', 'refreshToken', 'refresh_hash'].includes(key)) {
          return '[REDACTED]';
        }
        return value;
      }) : null;

      await this.repo.createLog({
        organization_id: params.organizationId,
        user_id: params.userId,
        action: params.action,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        details_json: sanitizedDetails,
        ip_address: params.ipAddress,
        user_agent: params.userAgent,
      });

      logger.info({
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        userId: params.userId,
      }, `Audit: ${params.action} on ${params.resourceType} (${params.resourceId})`);
    } catch (err: any) {
      logger.error(`Failed to record audit log: ${err.message}`);
    }
  }

  async getResourceAuditTrail(organizationId: string, resourceType: string, resourceId: string) {
    return this.repo.findByResource(organizationId, resourceType, resourceId);
  }
}

export const auditService = new AuditService();
