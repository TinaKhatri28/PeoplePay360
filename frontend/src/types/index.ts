// Shared TypeScript Interfaces for PeoplePay360

export interface User {
  id: number;
  email: string;
  roles: string[];
  employee_id?: number | null;
  employee_name?: string | null;
  status?: string;
}

export interface Department {
  id: number;
  name: string;
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  position?: string | null;
  department_id?: number | null;
  department_name?: string | null;
  manager_id?: number | null;
  schedule_id?: number | null;
  schedule_name?: string | null;
  company?: string;
  work_location?: string | null;
  bank_account?: string | null;
  status?: string;
  avatar_initials?: string;
  contract?: Contract;
  counts?: {
    contracts: number;
    attendance: number;
    time_off: number;
    allocations: number;
  };
}

export interface Contract {
  id: string | number;
  ref: string;
  employee_id: string | number;
  employee_name?: string;
  start_date: string;
  end_date?: string | null;
  wage: number;
  status: 'Running' | 'Expired' | 'Draft';
  department?: string | null;
  position?: string | null;
  schedule_id?: string | number | null;
  schedule_name?: string | null;
  salary_structure_id?: string | number | null;
  salary_structure_name?: string | null;
  employee?: any;
  salary_structure?: any;
  schedule?: any;
}

export interface AttendanceRecord {
  id: string | number;
  employee_id: string | number;
  employee_name?: string;
  department_name?: string;
  manager_name?: string;
  date: string;
  check_in?: string | null;
  check_out?: string | null;
  worked_hours: number;
  overtime_hours: number;
  status: 'Present' | 'Absent' | 'Late' | 'Overtime' | 'Anomaly';
  notes?: string | null;
  employee?: any;
}

export interface TimeOffType {
  id: number;
  name: string;
  unit: 'Days' | 'Hours';
  allocation_required: number;
  approval_role: string;
}

export interface TimeOffAllocation {
  id: number;
  employee_id: number;
  employee_name?: string;
  type_id: number;
  type_name?: string;
  unit?: string;
  allocated: number;
  taken: number;
  status: string;
  approver_id?: number | null;
}

export interface TimeOffRequest {
  id: number;
  employee_id: number;
  employee_name?: string;
  type_id: number;
  type_name?: string;
  unit?: string;
  start_date: string;
  end_date: string;
  duration: number;
  reason?: string | null;
  status: 'To Approve' | 'Approved' | 'Refused';
  created_at?: string;
}

export interface SalaryStructure {
  id: number;
  name: string;
  rules?: SalaryRule[];
}

export interface SalaryRule {
  id: number;
  structure_id: number;
  name: string;
  category: 'Basic' | 'Allowance' | 'Deduction';
  compute_method: 'FIXED' | 'PERCENTAGE' | 'FORMULA';
  amount?: number | null;
  percentage?: number | null;
  percentage_of?: string | null;
  formula_key?: string | null;
  sequence: number;
}

export interface Payrun {
  id: number;
  period_month: number;
  period_year: number;
  structure_id?: number | null;
  company?: string;
  status: 'Draft' | 'Computed' | 'Validated' | 'Paid';
  created_at?: string;
  payslips?: Payslip[];
}

export interface PayslipLine {
  name: string;
  category: 'Basic' | 'Allowance' | 'Deduction';
  amount: number;
}

export interface Payslip {
  id: number;
  payrun_id: number;
  employee_id: number;
  employee_name: string;
  contract_id?: number | null;
  gross: number;
  deductions: number;
  net: number;
  lines?: PayslipLine[];
  status: 'Draft' | 'Done' | 'Paid';
  sent: number;
  warnings?: string[];
  created_at?: string;
}

export interface WorkingSchedule {
  id: number;
  name: string;
  company: string;
  days_per_week: number;
  total_hours: number;
  days?: Array<{ day: string; start: string; end: string; breakHours?: number }>;
}

export interface DashboardData {
  period: { year: number; month: number };
  netSalary: number;
  netSalaryChange?: string;
  payslipCount: number;
  paidCount?: number;
  pendingCount?: number;
  doneCount?: number;
  warningCount?: number;
  avgSalary: number;
  approvedTimeOffDays?: number;
  attendanceHealth?: number;
  attendanceRate?: number;
  byDepartment: Array<{ name: string; total: number; headcount?: number }>;
  monthlyTrend: Array<{ label: string; total: number }>;
  alerts?: {
    missingBankCount: number;
    duplicatePayslipWarning: number;
    unvalidatedDrafts: number;
    expiringContracts: number;
  };
  attendance: {
    present: number;
    absent: number;
    late: number;
    overtime: number;
    missingCheckouts?: number;
    manualEdits?: number;
    coveragePct?: number;
  };
  timeOff?: Array<{ name: string; approvedDays: number; pending: number; remainingBalance: number | string; unit?: string }>;
  leave?: Array<{ name: string; approved: number; pending: number; remaining: number }>;
  departmentOverview?: Array<{ department: string; headcount: number; monthlySalary: number }>;
  payrunStatus: string;
  modelsToAggregate?: string[];
}
