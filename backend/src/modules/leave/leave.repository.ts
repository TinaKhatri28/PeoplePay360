import { prisma } from '../../config/database';

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
        status: 'Approved',
        start_date: { lte: periodEnd },
        end_date: { gte: periodStart },
      },
      include: { leave_type: true },
    });
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
      // 1. Fetch current request within transaction lock
      const req = await tx.leaveRequest.findUnique({
        where: { id: params.requestId },
      });

      if (!req) {
        throw new Error('Leave request not found');
      }

      // Idempotency: If already in target status, return existing without double-deduction
      if (req.status === params.newStatus) {
        return req;
      }

      // 2. If approving, deduct allocation
      if (params.newStatus === 'Approved' && params.allocationId && params.deductDuration) {
        const alloc = await tx.leaveAllocation.findUnique({
          where: { id: params.allocationId },
        });

        if (!alloc) {
          throw new Error('Leave allocation not found');
        }

        const newTaken = alloc.taken + params.deductDuration;
        if (newTaken > alloc.allocated) {
          throw new Error(`Insufficient leave balance. Available: ${alloc.allocated - alloc.taken}, requested: ${params.deductDuration}`);
        }

        await tx.leaveAllocation.update({
          where: { id: alloc.id },
          data: { taken: newTaken },
        });
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
