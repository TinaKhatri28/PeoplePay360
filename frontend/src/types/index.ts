// Shared TypeScript Interfaces for PeoplePay360

export interface User {
  id: string | number;
  email: string;
  roles: string[];
  role?: string;
  employee_id?: string | number | null;
  employeeId?: string | number | null;
  employee_name?: string | null;
  status?: string;
}

export interface Department {
  id: string | number;
  name: string;
}

export interface Employee {
  id: string | number;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string | null;
  position?: string | null;
  department?: string | null;
  department_id?: string | number | null;
  department_name?: string | null;
  manager_id?: string | number | null;
  schedule_id?: string | number | null;
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
  id: string | number;
  name: string;
  unit: 'Days' | 'Hours';
  allocation_required: number;
  approval_role: string;
}

export interface TimeOffAllocation {
  id: string | number;
  employee_id: string | number;
  employee_name?: string;
  type_id: string | number;
  type_name?: string;
  unit?: string;
  allocated: number;
  taken: number;
  status: string;
  approver_id?: string | number | null;
}

export interface TimeOffRequest {
  id: string | number;
  employee_id: string | number;
  employee_name?: string;
  type_id: string | number;
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
  id: string | number;
  name: string;
  rules?: SalaryRule[];
}

export interface SalaryRule {
  id: string | number;
  structure_id: string | number;
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
  id: string | number;
  period_month: number;
  period_year: number;
  structure_id?: string | number | null;
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
  id: string | number;
  payrun_id: string | number;
  employee_id: string | number;
  employee_name: string;
  contract_id?: string | number | null;
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
  id: string | number;
  name: string;
  company?: string;
  days_per_week: number;
  standard_hours?: number;
  total_hours?: number;
  weekly_hours?: number;
  schedule_json?: string;
  schedule?: Array<{ day: string; start?: string; end?: string; breakHours?: number; isOff?: boolean }>;
  days?: Array<{ day: string; start?: string; end?: string; breakHours?: number; isOff?: boolean }>;
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
  stats?: {
    total_employees: number;
    active_employees: number;
    pending_leaves: number;
    attendance_today: {
      present: number;
      late: number;
      absent: number;
      logged: number;
    };
    payroll_status: string;
    total_payroll_cost: number;
    average_salary: number;
    warnings_count: number;
  };
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
