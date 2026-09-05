export type PayrunStatus =
  | 'Draft'
  | 'Processing'
  | 'Computed'
  | 'Validated'
  | 'Approved'
  | 'Paid'
  | 'Cancelled'
  | 'Failed';

export interface PayslipLineResult {
  name: string;
  category: 'Basic' | 'Allowance' | 'Deduction' | string;
  amount: number;
}

export interface PayrollCalculationResult {
  employeeId: string;
  contractId: string | null;
  basicSalary: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  workedDays: number;
  overtimeHours: number;
  unpaidLeaveDays: number;
  absentDays: number;
  lines: PayslipLineResult[];
  warnings: string[];
}
