import { employeeRepository, EmployeeRepository } from './employee.repository';
import { auditService, AuditService } from '../audit/audit.service';
import { ConflictError, NotFoundError } from '../../shared/errors/app.error';

export class EmployeeService {
  constructor(
    private readonly repo: EmployeeRepository = employeeRepository,
    private readonly audit: AuditService = auditService
  ) {}

  private formatEmployee(emp: any) {
    if (!emp) return null;
    const name = emp.first_name && emp.last_name 
      ? `${emp.first_name} ${emp.last_name}` 
      : (emp.first_name || emp.last_name || emp.email.split('@')[0]);

    return {
      ...emp,
      name,
      department: emp.department?.name || emp.department || null,
      manager_name: emp.manager ? `${emp.manager.first_name} ${emp.manager.last_name}` : null,
      schedule_name: emp.schedule?.name || null,
      running_contract: emp.contracts?.[0] || null,
      counts: {
        contracts: emp._count?.contracts ?? (emp.contracts ? emp.contracts.length : 0),
        attendance: emp._count?.attendance ?? 0,
        time_off: emp._count?.leave_requests ?? 0,
        allocations: emp._count?.leave_allocations ?? 0,
      },
    };
  }

  async listEmployees(organizationId: string, query: {
    search?: string;
    department_id?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const { total, items } = await this.repo.findAll(organizationId, {
      search: query.search,
      department_id: query.department_id,
      status: query.status,
      skip,
      take: limit,
    });

    return items.map(this.formatEmployee);
  }

  async getEmployeeById(organizationId: string, id: string) {
    const emp = await this.repo.findById(organizationId, id);
    if (!emp) {
      throw new NotFoundError(`Employee with id ${id} not found`);
    }
    return this.formatEmployee(emp);
  }

  async createEmployee(organizationId: string, data: any, actorUserId?: string) {
    const existing = await this.repo.findByEmail(data.email);
    if (existing) {
      throw new ConflictError(`Employee with email ${data.email} already exists`);
    }

    // Split name if single name is provided by frontend
    let firstName = data.first_name || '';
    let lastName = data.last_name || '';
    if (data.name && (!firstName || !lastName)) {
      const parts = data.name.trim().split(/\s+/);
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }

    const avatarInitials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'EM';

    const created = await this.repo.create({
      organization_id: organizationId,
      first_name: firstName,
      last_name: lastName,
      email: data.email,
      phone: data.phone || null,
      position: data.position || null,
      department_id: data.department_id || null,
      manager_id: data.manager_id || null,
      schedule_id: data.schedule_id || null,
      work_location: data.work_location || null,
      bank_account: data.bank_account || null,
      status: data.status || 'Active',
      avatar_initials: avatarInitials,
      joining_date: data.joining_date ? new Date(data.joining_date) : new Date(),
    });

    await this.audit.log({
      organizationId,
      userId: actorUserId,
      action: 'EMPLOYEE_CREATED',
      resourceType: 'employee',
      resourceId: created.id,
      details: { email: created.email, name: `${firstName} ${lastName}` },
    });

    return this.formatEmployee(created);
  }

  async updateEmployee(organizationId: string, id: string, data: any, actorUserId?: string) {
    const emp = await this.repo.findById(organizationId, id);
    if (!emp) {
      throw new NotFoundError(`Employee with id ${id} not found`);
    }

    const updateData: any = {};
    if (data.first_name !== undefined) updateData.first_name = data.first_name;
    if (data.last_name !== undefined) updateData.last_name = data.last_name;
    if (data.name) {
      const parts = data.name.trim().split(/\s+/);
      updateData.first_name = parts[0] || '';
      updateData.last_name = parts.slice(1).join(' ') || '';
    }
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.department_id !== undefined) updateData.department_id = data.department_id;
    if (data.manager_id !== undefined) updateData.manager_id = data.manager_id;
    if (data.schedule_id !== undefined) updateData.schedule_id = data.schedule_id;
    if (data.work_location !== undefined) updateData.work_location = data.work_location;
    if (data.bank_account !== undefined) updateData.bank_account = data.bank_account;
    if (data.status !== undefined) updateData.status = data.status;

    await this.repo.update(organizationId, id, updateData);

    await this.audit.log({
      organizationId,
      userId: actorUserId,
      action: 'EMPLOYEE_UPDATED',
      resourceType: 'employee',
      resourceId: id,
      details: updateData,
    });

    return this.getEmployeeById(organizationId, id);
  }

  async getEmployeeContracts(organizationId: string, employeeId: string) {
    return this.repo.getContracts(organizationId, employeeId);
  }

  async getEmployeeAttendance(organizationId: string, employeeId: string) {
    return this.repo.getAttendance(organizationId, employeeId);
  }

  async getEmployeeTimeOffRequests(organizationId: string, employeeId: string) {
    return this.repo.getTimeOffRequests(organizationId, employeeId);
  }

  async getEmployeeTimeOffAllocations(organizationId: string, employeeId: string) {
    return this.repo.getTimeOffAllocations(organizationId, employeeId);
  }
}

export const employeeService = new EmployeeService();
