import { describe, it, expect, vi } from 'vitest';
import { PayrollCalculationService } from '../payroll-calculation.service';
import { salaryRuleEvaluator } from '../../salary-structures/salary-rule.evaluator';

describe('PayrollCalculationService - Bug 1 & Bug 3 Fixes', () => {
  const mockEmployeesRepo = {
    findManyByIds: vi.fn(),
  };
  const mockContractRepo = {
    findContractsValidForPeriodForEmployees: vi.fn(),
  };
  const mockContractService = {
    getContractForPeriod: vi.fn(),
  };
  const mockAttendanceRepo = {
    findMonthlyRecordsForEmployees: vi.fn(),
  };
  const mockLeaveRepo = {
    findApprovedLeavesForEmployees: vi.fn(),
  };
  const mockSalaryRepo = {
    findRulesForStructures: vi.fn(),
  };

  const service = new PayrollCalculationService(
    mockEmployeesRepo as any,
    mockContractRepo as any,
    mockContractService as any,
    mockAttendanceRepo as any,
    mockLeaveRepo as any,
    mockSalaryRepo as any,
    salaryRuleEvaluator
  );

  it('enforces ATTENDANCE_BASED as deduction and does not add absence loss to gross salary (Bug 1 Fix)', async () => {
    mockEmployeesRepo.findManyByIds.mockResolvedValue([
      { id: 'emp_1', first_name: 'John', last_name: 'Doe', bank_account: 'ACC12345678' },
    ]);
    mockContractRepo.findContractsValidForPeriodForEmployees.mockResolvedValue([
      {
        id: 'contract_1',
        employee_id: 'emp_1',
        wage: 2600,
        salary_structure_id: 'struct_1',
      },
    ]);
    // 5 absent days out of 26 expected
    mockAttendanceRepo.findMonthlyRecordsForEmployees.mockResolvedValue([
      { employee_id: 'emp_1', status: 'Absent', worked_hours: 0, overtime_hours: 0 },
      { employee_id: 'emp_1', status: 'Absent', worked_hours: 0, overtime_hours: 0 },
      { employee_id: 'emp_1', status: 'Absent', worked_hours: 0, overtime_hours: 0 },
      { employee_id: 'emp_1', status: 'Absent', worked_hours: 0, overtime_hours: 0 },
      { employee_id: 'emp_1', status: 'Absent', worked_hours: 0, overtime_hours: 0 },
    ]);
    mockLeaveRepo.findApprovedLeavesForEmployees.mockResolvedValue([]);
    // Even if structure rule had category misconfigured as 'Allowance', formula key ATTENDANCE_BASED must be treated as Deduction!
    mockSalaryRepo.findRulesForStructures.mockResolvedValue([
      {
        structure_id: 'struct_1',
        name: 'Basic Salary',
        category: 'Basic',
        compute_method: 'FIXED',
        sequence: 1,
      },
      {
        structure_id: 'struct_1',
        name: 'Absence Penalty',
        category: 'Allowance', // Intentionally misconfigured in DB
        compute_method: 'FORMULA',
        formula_key: 'ATTENDANCE_BASED',
        sequence: 2,
      },
    ]);

    const results = await service.calculateBatchPayroll('org_1', ['emp_1'], 2026, 6);
    const empResult = results.get('emp_1')!;

    expect(empResult).toBeDefined();
    // Gross must NOT be inflated with absence deduction! Gross = 2600
    expect(empResult.grossSalary).toBe(2600);
    // Attended days = 26 - 5 = 21. Ratio = 21/26.
    // Absence deduction = 2600 * (1 - 21/26) = 2600 * (5/26) = 500
    expect(empResult.totalDeductions).toBe(500);
    expect(empResult.netSalary).toBe(2100);

    const absenceLine = empResult.lines.find((l) => l.name === 'Absence Penalty');
    expect(absenceLine).toBeDefined();
    expect(absenceLine?.category).toBe('Deduction');
    expect(absenceLine?.amount).toBe(500);
  });

  it('caps net salary at 0.00 and logs warning when deductions exceed gross earnings (Bug 3 Fix)', async () => {
    mockEmployeesRepo.findManyByIds.mockResolvedValue([
      { id: 'emp_2', first_name: 'Jane', last_name: 'Smith', bank_account: 'ACC98765432' },
    ]);
    mockContractRepo.findContractsValidForPeriodForEmployees.mockResolvedValue([
      {
        id: 'contract_2',
        employee_id: 'emp_2',
        wage: 1000,
        salary_structure_id: 'struct_deduct',
      },
    ]);
    mockAttendanceRepo.findMonthlyRecordsForEmployees.mockResolvedValue([]);
    mockLeaveRepo.findApprovedLeavesForEmployees.mockResolvedValue([]);
    // Heavy deductions totaling $1,500 on $1,000 basic wage
    mockSalaryRepo.findRulesForStructures.mockResolvedValue([
      {
        structure_id: 'struct_deduct',
        name: 'Basic',
        category: 'Basic',
        compute_method: 'FIXED',
        sequence: 1,
      },
      {
        structure_id: 'struct_deduct',
        name: 'Garnishment',
        category: 'Deduction',
        compute_method: 'FIXED',
        amount: 1500,
        sequence: 2,
      },
    ]);

    const results = await service.calculateBatchPayroll('org_1', ['emp_2'], 2026, 6);
    const empResult = results.get('emp_2')!;

    expect(empResult).toBeDefined();
    expect(empResult.grossSalary).toBe(1000);
    expect(empResult.totalDeductions).toBe(1500);
    // Net salary must NOT be -$500. It must be capped at 0
    expect(empResult.netSalary).toBe(0);
    expect(empResult.warnings.some((w) => w.includes('exceed gross earnings') && w.includes('Net salary capped at $0.00'))).toBe(true);
  });
});
