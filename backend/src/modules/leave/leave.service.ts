import { leaveRepository, LeaveRepository } from './leave.repository';
import { auditService, AuditService } from '../audit/audit.service';
import { InsufficientLeaveBalanceError, NotFoundError, ValidationError } from '../../shared/errors/app.error';
import { cacheService } from '../../shared/utils/cache.service';

export class LeaveService {
  constructor(
    private readonly repo: LeaveRepository = leaveRepository,
    private readonly audit: AuditService = auditService
  ) {}

  async getLeaveTypes(organizationId: string) {
    const cacheKey = `leave_types:${organizationId}`;
    return cacheService.getOrSet(cacheKey, () => this.repo.findAllTypes(organizationId), 300);
  }

  async getLeaveRequests(organizationId: string, filters: { employee_id?: string; status?: string }) {
    const requests = await this.repo.findAllRequests(organizationId, filters);
    return requests.map((r) => ({
      ...r,
      employee_name: r.employee ? `${r.employee.first_name} ${r.employee.last_name}` : 'Unknown',
      type_name: r.leave_type?.name || 'Unknown',
    }));
  }

  async getLeaveAllocations(organizationId: string, employeeId?: string) {
    const allocs = await this.repo.findAllAllocations(organizationId, employeeId);
    return allocs.map((a) => ({
      ...a,
      employee_name: a.employee ? `${a.employee.first_name} ${a.employee.last_name}` : 'Unknown',
      type_name: a.leave_type?.name || 'Unknown',
      remaining: +(a.allocated - a.taken).toFixed(2),
    }));
  }

  async createLeaveRequest(organizationId: string, employeeId: string, data: any, actorUserId?: string) {
    const duration = Number(data.duration);
    if (duration <= 0) {
      throw new ValidationError('Leave duration must be greater than 0');
    }

    // Check allocation balance
    const alloc = await this.repo.findAllocation(organizationId, employeeId, data.type_id);
    if (alloc) {
      const remaining = alloc.allocated - alloc.taken;
      if (remaining < duration) {
        throw new InsufficientLeaveBalanceError(
          `Insufficient leave balance. You have ${remaining} days remaining, but requested ${duration} days.`
        );
      }
    }

    const created = await this.repo.createRequest({
      organization_id: organizationId,
      employee_id: employeeId,
      type_id: data.type_id,
      start_date: new Date(data.start_date),
      end_date: new Date(data.end_date),
      duration,
      reason: data.reason || null,
      status: 'To Approve',
    });

    await this.audit.log({
      organizationId,
      userId: actorUserId,
      action: 'LEAVE_REQUESTED',
      resourceType: 'leave_request',
      resourceId: created.id,
      details: { employee_id: employeeId, duration, type_id: data.type_id },
    });

    return created;
  }

  async processApproval(organizationId: string, requestId: string, action: 'Approved' | 'Refused' | 'Cancelled', approverId?: string, rejectionReason?: string) {
    const existing = await this.repo.findRequestById(organizationId, requestId);
    if (!existing) {
      throw new NotFoundError(`Leave request with id ${requestId} not found`);
    }

    let allocationId: string | null = null;
    let deductDuration = 0;

    if (action === 'Approved') {
      const alloc = await this.repo.findAllocation(organizationId, existing.employee_id, existing.type_id);
      if (alloc) {
        allocationId = alloc.id;
        deductDuration = existing.duration;
      }
    }

    const result = await this.repo.processLeaveApprovalTx({
      requestId,
      organizationId,
      newStatus: action,
      approverId,
      rejectionReason,
      allocationId,
      deductDuration,
    });

    await this.audit.log({
      organizationId,
      userId: approverId,
      action: `LEAVE_${action.toUpperCase()}`,
      resourceType: 'leave_request',
      resourceId: requestId,
      details: { action, employee_id: existing.employee_id, duration: existing.duration },
    });

    return result;
  }

  async createAllocation(organizationId: string, data: any, actorUserId?: string) {
    const created = await this.repo.createAllocation({
      organization_id: organizationId,
      employee_id: data.employee_id,
      type_id: data.type_id,
      allocated: Number(data.allocated),
      taken: 0,
      status: 'Approved',
      approver_id: actorUserId || null,
    });

    return created;
  }
}

export const leaveService = new LeaveService();
