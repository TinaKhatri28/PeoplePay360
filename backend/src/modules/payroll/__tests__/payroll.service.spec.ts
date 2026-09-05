import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PayrollService } from '../payroll.service';
import { ConflictError, NotFoundError } from '../../../shared/errors/app.error';

describe('PayrollService - Race Condition 1 Concurrent Payrun Computation', () => {
  let payrollService: PayrollService;
  let mockRepo: any;
  let mockCalculation: any;
  let mockAudit: any;

  beforeEach(() => {
    mockRepo = {
      findPayrunById: vi.fn(),
      transitionPayrunStatus: vi.fn(),
      updatePayrunStatus: vi.fn(),
      commitBatchPayrunCalculationTx: vi.fn(),
    };
    mockCalculation = {
      calculateBatchPayroll: vi.fn(),
    };
    mockAudit = {
      log: vi.fn(),
    };
    payrollService = new PayrollService(mockRepo, mockCalculation, mockAudit);
  });

  it('aborts with ConflictError if payrun is already locked/Processing by another request (Race Condition 1 Fix)', async () => {
    // transitionPayrunStatus returns 0 because another request already transitioned status to 'Processing'
    mockRepo.transitionPayrunStatus.mockResolvedValue(0);
    mockRepo.findPayrunById.mockResolvedValue({
      id: 'payrun_1',
      status: 'Processing',
    });

    await expect(
      payrollService.computePayrun('org_1', 'payrun_1', 'admin_1')
    ).rejects.toThrow(ConflictError);

    // Verify calculation was NOT triggered
    expect(mockCalculation.calculateBatchPayroll).not.toHaveBeenCalled();
    expect(mockRepo.commitBatchPayrunCalculationTx).not.toHaveBeenCalled();
  });

  it('aborts with ConflictError if payrun is already Paid', async () => {
    mockRepo.transitionPayrunStatus.mockResolvedValue(0);
    mockRepo.findPayrunById.mockResolvedValue({
      id: 'payrun_1',
      status: 'Paid',
    });

    await expect(
      payrollService.computePayrun('org_1', 'payrun_1', 'admin_1')
    ).rejects.toThrow(ConflictError);

    expect(mockCalculation.calculateBatchPayroll).not.toHaveBeenCalled();
  });

  it('aborts with NotFoundError if payrun does not exist', async () => {
    mockRepo.transitionPayrunStatus.mockResolvedValue(0);
    mockRepo.findPayrunById.mockResolvedValue(null);

    await expect(
      payrollService.computePayrun('org_1', 'payrun_missing', 'admin_1')
    ).rejects.toThrow(NotFoundError);
  });

  it('proceeds with calculation and commits when atomic transition succeeds', async () => {
    // transitionPayrunStatus returns 1 (successfully transitioned)
    mockRepo.transitionPayrunStatus.mockResolvedValue(1);
    mockRepo.findPayrunById.mockResolvedValue({
      id: 'payrun_1',
      status: 'Processing',
      period_year: 2026,
      period_month: 6,
      structure_id: 'struct_1',
      payslips: [
        { id: 'slip_1', employee_id: 'emp_1' },
      ],
    });

    const resultMap = new Map();
    resultMap.set('emp_1', {
      contractId: 'contract_1',
      grossSalary: 5000,
      totalDeductions: 500,
      netSalary: 4500,
      lines: [],
      warnings: [],
    });
    mockCalculation.calculateBatchPayroll.mockResolvedValue(resultMap);
    mockRepo.commitBatchPayrunCalculationTx.mockResolvedValue({});

    const result = await payrollService.computePayrun('org_1', 'payrun_1', 'admin_1');

    expect(result.ok).toBe(true);
    expect(mockRepo.transitionPayrunStatus).toHaveBeenCalledWith('payrun_1', 'org_1', 'Processing', ['Draft', 'Computed']);
    expect(mockCalculation.calculateBatchPayroll).toHaveBeenCalledWith('org_1', ['emp_1'], 2026, 6, 'struct_1');
    expect(mockRepo.commitBatchPayrunCalculationTx).toHaveBeenCalled();
  });
});
