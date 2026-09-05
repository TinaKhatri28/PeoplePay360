import { describe, it, expect } from 'vitest';
import { salaryRuleEvaluator } from '../salary-rule.evaluator';

describe('SalaryRuleEvaluator', () => {
  const context = {
    basic: 50000,
    grossSoFar: 50000,
    overtimeHours: 10,
    unpaidLeaveDays: 2,
    absentDays: 1,
    expectedWorkingDays: 25,
    standardMonthlyHours: 160,
  };

  it('evaluates FIXED amount rule correctly', () => {
    const rule = {
      name: 'Transport Allowance',
      category: 'Allowance',
      compute_method: 'FIXED',
      amount: 2500,
      sequence: 10,
    };
    const result = salaryRuleEvaluator.evaluate(rule, context);
    expect(result).toBe(2500);
  });

  it('evaluates PERCENTAGE of BASIC rule correctly (HRA)', () => {
    const rule = {
      name: 'HRA',
      category: 'Allowance',
      compute_method: 'PERCENTAGE',
      percentage: 20,
      percentage_of: 'BASIC',
      sequence: 20,
    };
    const result = salaryRuleEvaluator.evaluate(rule, context);
    expect(result).toBe(10000); // 20% of 50,000
  });

  it('evaluates FORMULA for OVERTIME correctly without eval', () => {
    const rule = {
      name: 'Overtime Pay',
      category: 'Allowance',
      compute_method: 'FORMULA',
      formula_key: 'OVERTIME',
      sequence: 30,
    };
    // 50,000 / 160 * 10 * 1.5 = 312.5 * 15 = 4687.5
    const result = salaryRuleEvaluator.evaluate(rule, context);
    expect(result).toBe(4687.5);
  });

  it('evaluates FORMULA for UNPAID_LEAVE_DEDUCTION correctly', () => {
    const rule = {
      name: 'Unpaid Leave Deduction',
      category: 'Deduction',
      compute_method: 'FORMULA',
      formula_key: 'UNPAID_LEAVE_DEDUCTION',
      sequence: 40,
    };
    // 50,000 / 25 * 2 = 4000
    const result = salaryRuleEvaluator.evaluate(rule, context);
    expect(result).toBe(4000);
  });
});
