import { prisma } from '../../config/database';
import { InsufficientLeaveBalanceError, NotFoundError } from '../../shared/errors/app.error';

export class LeaveRepository {
  async findAllTypes(organizationId: string) {
    return prisma.leaveType.findMany({
      where: { organization_id: organizationId },
    });
  }

  async findAllRequests(organizationId: string, filters: { employee_id?: string; status?: string }) {
    const where: any = { organization_id: organizationId };
    if (filters.employee_id) where.employee_id = filters.employee_id;
    if (filters.status) where.status = filters.status;

    return prisma.leaveRequest.findMany({
      where,
      include: {
        employee: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        leave_type: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findRequestById(organizationId: string, id: string) {
    return prisma.leaveRequest.findFirst({
      where: { id, organization_id: organizationId },
      include: {
        employee: true,
        leave_type: true,
      },
    });
  }

  async findAllocation(organizationId: string, employeeId: string, typeId: string) {
    return prisma.leaveAllocation.findFirst({
      where: {
        organization_id: organizationId,
        employee_id: employeeId,
        type_id: typeId,
      },
    });
  }

  async findAllAllocations(organizationId: string, employeeId?: string) {
    const where: any = { organization_id: organizationId };
    if (employeeId) where.employee_id = employeeId;

    return prisma.leaveAllocation.findMany({
      where,
      include: {
        employee: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        leave_type: true,
      },
    });
  }

  async findApprovedLeavesForEmployees(
    organizationId: string,
    employeeIds: string[],
    periodStart: Date,
    periodEnd: Date
  ) {
    return prisma.leaveRequest.findMany({
      where: {
        organization_id: organizationId,
        employee_id: { in: employeeIds },
        status: { in: ['Approved', 'To Approve'] },
        start_date: { lte: periodEnd },
        end_date: { gte: periodStart },
      },
      include: { leave_type: true },
    });
  }

  async findOverlappingRequests(
    organizationId: string,
    employeeId: string,
    startDate: Date,
    endDate: Date
  ) {
    return prisma.leaveRequest.findMany({
      where: {
        organization_id: organizationId,
        employee_id: employeeId,
        status: { in: ['Approved', 'To Approve'] },
        start_date: { lte: endDate },
        end_date: { gte: startDate },
      },
    });
  }

  async getPendingDuration(
    organizationId: string,
    employeeId: string,
    typeId: string
  ): Promise<number> {
    const aggregate = await prisma.leaveRequest.aggregate({
      where: {
        organization_id: organizationId,
        employee_id: employeeId,
        type_id: typeId,
        status: 'To Approve',
      },
      _sum: {
        duration: true,
      },
    });
    return aggregate._sum.duration || 0;
  }

  async createRequest(data: any) {
    return prisma.leaveRequest.create({
      data,
      include: { leave_type: true },
    });
  }

  async createAllocation(data: any) {
    return prisma.leaveAllocation.create({
      data,
      include: { leave_type: true },
    });
  }

  /**
   * ATOMIC DATABASE TRANSACTION:
   * Approves or rejects a leave request and updates the employee's allocation in a single transaction.
   */
  async processLeaveApprovalTx(params: {
    requestId: string;
    organizationId: string;
    newStatus: string;
    approverId?: string | null;
    rejectionReason?: string | null;
    allocationId?: string | null;
    deductDuration?: number;
  }) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch current request within transaction lock with strict tenant boundary
      const req = await tx.leaveRequest.findFirst({
        where: { id: params.requestId, organization_id: params.organizationId },
      });

      if (!req) {
        throw new Error('Leave request not found');
      }

      // Idempotency: If already in target status, return existing without double-deduction
      if (req.status === params.newStatus) {
        return req;
      }

      // 2. If approving, atomically deduct allocation with balance condition to prevent Race Condition 2
      if (params.newStatus === 'Approved' && params.allocationId && params.deductDuration) {
        const alloc = await tx.leaveAllocation.findFirst({
          where: { id: params.allocationId, organization_id: params.organizationId },
        });

        if (!alloc) {
          throw new NotFoundError('Leave allocation not found');
        }

        const maxAllowedTaken = alloc.allocated - params.deductDuration;
        if (alloc.taken > maxAllowedTaken) {
          throw new InsufficientLeaveBalanceError(
            `Insufficient leave balance. Available: ${alloc.allocated - alloc.taken}, requested: ${params.deductDuration}`
          );
        }

        // Atomic conditional increment: eliminates race condition and prevents concurrent over-deduction
        const updateResult = await tx.leaveAllocation.updateMany({
          where: {
            id: alloc.id,
            organization_id: params.organizationId,
            taken: { lte: maxAllowedTaken },
          },
          data: {
            taken: { increment: params.deductDuration },
          },
        });

        if (updateResult.count === 0) {
          throw new InsufficientLeaveBalanceError(
            'Concurrent approval conflict: Insufficient leave balance available to approve this request.'
          );
        }
      }

      // 3. Update the request status
      const updatedReq = await tx.leaveRequest.update({
        where: { id: params.requestId },
        data: {
          status: params.newStatus,
          approver_id: params.approverId,
          rejection_reason: params.rejectionReason,
        },
        include: {
          leave_type: true,
          employee: true,
        },
      });

      return updatedReq;
    });
  }
}

export const leaveRepository = new LeaveRepository();
