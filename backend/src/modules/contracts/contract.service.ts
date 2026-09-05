import { contractRepository, ContractRepository } from './contract.repository';
import { auditService, AuditService } from '../audit/audit.service';
import { ContractOverlapError, NotFoundError } from '../../shared/errors/app.error';

export class ContractService {
  constructor(
    private readonly repo: ContractRepository = contractRepository,
    private readonly audit: AuditService = auditService
  ) {}

  /**
   * Check whether [newStart, newEnd] overlaps with [existingStart, existingEnd]
   */
  private hasOverlap(
    newStart: Date,
    newEnd: Date | null,
    existStart: Date,
    existEnd: Date | null
  ): boolean {
    const end1 = newEnd ? newEnd.getTime() : Infinity;
    const start1 = newStart.getTime();

    const end2 = existEnd ? existEnd.getTime() : Infinity;
    const start2 = existStart.getTime();

    return start1 <= end2 && end1 >= start2;
  }

  async getAllContracts(organizationId: string, employeeId?: string) {
    const contracts = await this.repo.findAll(organizationId, employeeId);
    return contracts.map((c) => ({
      ...c,
      employee_name: c.employee ? `${c.employee.first_name} ${c.employee.last_name}` : 'Unknown',
      salary_structure_name: c.salary_structure?.name || null,
      schedule_name: c.schedule?.name || null,
    }));
  }

  async getContractById(organizationId: string, id: string) {
    const c = await this.repo.findById(organizationId, id);
    if (!c) {
      throw new NotFoundError(`Contract with id ${id} not found`);
    }
    return {
      ...c,
      employee_name: c.employee ? `${c.employee.first_name} ${c.employee.last_name}` : 'Unknown',
      salary_structure_name: c.salary_structure?.name || null,
      schedule_name: c.schedule?.name || null,
    };
  }

  async createContract(organizationId: string, data: any, actorUserId?: string) {
    const newStart = new Date(data.start_date);
    const newEnd = data.end_date ? new Date(data.end_date) : null;

    // Contract Overlap Protection
    if (data.status === 'Running' || !data.status) {
      const activeContracts = await this.repo.findActiveContractsForEmployee(organizationId, data.employee_id);
      for (const existing of activeContracts) {
        if (this.hasOverlap(newStart, newEnd, existing.start_date, existing.end_date)) {
          throw new ContractOverlapError(
            `Contract dates (${data.start_date} to ${data.end_date || 'indefinite'}) overlap with existing active contract ${existing.ref} (${existing.start_date.toISOString().slice(0,10)} to ${existing.end_date ? existing.end_date.toISOString().slice(0,10) : 'indefinite'})`
          );
        }
      }
    }

    const ref = data.ref || `CON-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const created = await this.repo.create({
      organization_id: organizationId,
      employee_id: data.employee_id,
      ref,
      start_date: newStart,
      end_date: newEnd,
      wage: Number(data.wage),
      employment_type: data.employment_type || 'Full-time',
      status: data.status || 'Running',
      department: data.department || null,
      position: data.position || null,
      schedule_id: data.schedule_id || null,
      salary_structure_id: data.salary_structure_id || null,
    });

    await this.audit.log({
      organizationId,
      userId: actorUserId,
      action: 'CONTRACT_CREATED',
      resourceType: 'contract',
      resourceId: created.id,
      details: { ref: created.ref, employee_id: created.employee_id, wage: created.wage },
    });

    return created;
  }

  async updateContract(organizationId: string, id: string, data: any, actorUserId?: string) {
    const existing = await this.repo.findById(organizationId, id);
    if (!existing) {
      throw new NotFoundError(`Contract with id ${id} not found`);
    }

    const updateData: any = {};
    if (data.ref) updateData.ref = data.ref;
    if (data.start_date) updateData.start_date = new Date(data.start_date);
    if (data.end_date !== undefined) updateData.end_date = data.end_date ? new Date(data.end_date) : null;
    if (data.wage !== undefined) updateData.wage = Number(data.wage);
    if (data.status) updateData.status = data.status;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.schedule_id !== undefined) updateData.schedule_id = data.schedule_id;
    if (data.salary_structure_id !== undefined) updateData.salary_structure_id = data.salary_structure_id;

    // Overlap validation on update
    const targetStatus = updateData.status || existing.status;
    if (targetStatus === 'Running') {
      const activeContracts = await this.repo.findActiveContractsForEmployee(organizationId, existing.employee_id);
      const otherContracts = activeContracts.filter((c) => c.id !== id);
      const startToCheck = updateData.start_date || existing.start_date;
      const endToCheck = updateData.end_date !== undefined ? updateData.end_date : existing.end_date;

      for (const other of otherContracts) {
        if (this.hasOverlap(startToCheck, endToCheck, other.start_date, other.end_date)) {
          throw new ContractOverlapError(
            `Updated dates overlap with existing contract ${other.ref}`
          );
        }
      }
    }

    await this.repo.update(organizationId, id, updateData);

    await this.audit.log({
      organizationId,
      userId: actorUserId,
      action: 'CONTRACT_UPDATED',
      resourceType: 'contract',
      resourceId: id,
      details: updateData,
    });

    return this.getContractById(organizationId, id);
  }

  async getContractForPeriod(organizationId: string, employeeId: string, year: number, month: number) {
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0); // last day of month
    return this.repo.findContractValidForPeriod(organizationId, employeeId, periodStart, periodEnd);
  }
}

export const contractService = new ContractService();
