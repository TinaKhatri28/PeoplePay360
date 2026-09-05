import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContractController } from '../contract.controller';
import { ForbiddenError, NotFoundError } from '../../../shared/errors/app.error';

describe('Contract RBAC & IDOR Security', () => {
  const mockService = {
    getAllContracts: vi.fn(),
    getContractById: vi.fn(),
    createContract: vi.fn(),
    updateContract: vi.fn(),
  };

  const controller = new ContractController(mockService as any);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('restricts contract lookup to own employeeId for non-privileged users', async () => {
    mockService.getAllContracts.mockResolvedValueOnce([
      { id: 'ct_1', employee_id: 'emp_123', wage: 5000 },
    ]);

    const req: any = {
      organizationId: 'org_1',
      user: { id: 'usr_1', role: 'Employee', employeeId: 'emp_123' },
    };
    const res: any = { json: vi.fn() };
    const next = vi.fn();

    await controller.getAll(req, res, next);

    expect(mockService.getAllContracts).toHaveBeenCalledWith('org_1', 'emp_123');
    expect(res.json).toHaveBeenCalledWith([
      { id: 'ct_1', employee_id: 'emp_123', wage: 5000 },
    ]);
  });

  it('returns empty array if unprivileged user has no linked employee profile', async () => {
    const req: any = {
      organizationId: 'org_1',
      user: { id: 'usr_1', role: 'Employee', employeeId: null },
    };
    const res: any = { json: vi.fn() };
    const next = vi.fn();

    await controller.getAll(req, res, next);

    expect(mockService.getAllContracts).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it('rejects an employee attempting to view another employee contract by ID with ForbiddenError', async () => {
    mockService.getContractById.mockResolvedValueOnce({
      id: 'ct_2',
      employee_id: 'emp_other_person',
      wage: 15000,
    });

    const req: any = {
      organizationId: 'org_1',
      params: { id: 'ct_2' },
      user: { id: 'usr_1', role: 'Employee', employeeId: 'emp_my_own_id' },
    };
    const res: any = { json: vi.fn() };
    const next = vi.fn();

    await controller.getById(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it('allows Admin to view any contract by ID without ForbiddenError', async () => {
    mockService.getContractById.mockResolvedValueOnce({
      id: 'ct_3',
      employee_id: 'emp_any',
      wage: 20000,
    });

    const req: any = {
      organizationId: 'org_1',
      params: { id: 'ct_3' },
      user: { id: 'usr_admin', role: 'Admin', employeeId: 'emp_admin' },
    };
    const res: any = { json: vi.fn() };
    const next = vi.fn();

    await controller.getById(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      id: 'ct_3',
      employee_id: 'emp_any',
      wage: 20000,
    });
  });
});
