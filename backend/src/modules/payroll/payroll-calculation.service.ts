import { employeeRepository, EmployeeRepository } from '../employees/employee.repository';
import { contractRepository, ContractRepository } from '../contracts/contract.repository';
import { contractService, ContractService } from '../contracts/contract.service';
import { attendanceRepository, AttendanceRepository } from '../attendance/attendance.repository';
import { leaveRepository, LeaveRepository } from '../leave/leave.repository';
import { salaryStructureRepository, SalaryStructureRepository } from '../salary-structures/salary-structure.repository';
import { salaryRuleEvaluator, SalaryRuleEvaluator } from '../salary-structures/salary-rule.evaluator';
import { PayrollCalculationResult, PayslipLineResult } from './payroll.types';

export class PayrollCalculationService {
  constructor(
    private readonly employees: EmployeeRepository = employeeRepository,
    private readonly contractRepo: ContractRepository = contractRepository,
    private readonly contracts: ContractService = contractService,
    private readonly attendanceRepo: AttendanceRepository = attendanceRepository,
    private readonly leaveRepo: LeaveRepository = leaveRepository,
    private readonly salaryRepo: SalaryStructureRepository = salaryStructureRepository,
    private readonly ruleEvaluator: SalaryRuleEvaluator = salaryRuleEvaluator
  ) {}

  /**
   * Determine applicable contract valid for the specific period
   */
  async getApplicableContract(organizationId: string, employeeId: string, year: number, month: number) {
    return this.contracts.getContractForPeriod(organizationId, employeeId, year, month);
  }

  /**
   * Calculate monthly attendance impact for a single employee
   */
  async calculateAttendanceImpact(organizationId: string, employeeId: string, year: number, month: number) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const records = await this.attendanceRepo.findMonthlyRecordsForEmployees(organizationId, [employeeId], prefix);

    let workedHours = 0;
    let overtimeHours = 0;
    let absentDays = 0;
    let presentDays = 0;

    for (const r of records) {
      workedHours += r.worked_hours || 0;
      overtimeHours += r.overtime_hours || 0;
      if (r.status === 'Absent') {
        absentDays++;
      } else {
        presentDays++;
      }
    }

    return {
      workedHours: +workedHours.toFixed(2),
      overtimeHours: +overtimeHours.toFixed(2),
      absentDays,
      presentDays,
    };
  }

  /**
   * Calculate leave impact for a single employee
   */
  async calculateLeaveImpact(organizationId: string, employeeId: string, year: number, month: number) {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    const approvedLeaves = await this.leaveRepo.findApprovedLeavesForEmployees(
      organizationId,
      [employeeId],
      monthStart,
      monthEnd
    );

    let unpaidLeaveDays = 0;
    for (const l of approvedLeaves) {
      if (!l.leave_type.is_paid || l.leave_type.name.toLowerCase().includes('unpaid')) {
        unpaidLeaveDays += l.duration;
      }
    }

    return { unpaidLeaveDays };
  }

  /**
   * Execute deterministic payroll calculation for one employee
   */
  async calculateEmployeePayroll(
    organizationId: string,
    employeeId: string,
    year: number,
    month: number,
    structureIdOverride?: string | null
  ): Promise<PayrollCalculationResult> {
    const batchMap = await this.calculateBatchPayroll(
      organizationId,
      [employeeId],
      year,
      month,
      structureIdOverride
    );

    return (
      batchMap.get(employeeId) || {
        employeeId,
        contractId: null,
        basicSalary: 0,
        grossSalary: 0,
        totalDeductions: 0,
        netSalary: 0,
        workedDays: 0,
        overtimeHours: 0,
        unpaidLeaveDays: 0,
        absentDays: 0,
        lines: [],
        warnings: ['Employee payroll could not be evaluated'],
      }
    );
  }

  /**
   * HIGH-PERFORMANCE BATCH CALCULATION:
   * Prefetches all employees, contracts, attendance records, leaves, and salary rules in 5 bulk queries,
   * completely eliminating N+1 query loops.
   */
  async calculateBatchPayroll(
    organizationId: string,
    employeeIds: string[],
    year: number,
    month: number,
    structureIdOverride?: string | null
  ): Promise<Map<string, PayrollCalculationResult>> {
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0);

    // 1-4. Batch fetch data in parallel
    const [employees, allContracts, attendanceRecords, approvedLeaves] = await Promise.all([
      this.employees.findManyByIds(organizationId, employeeIds),
      this.contractRepo.findContractsValidForPeriodForEmployees(organizationId, employeeIds, periodStart, periodEnd),
      this.attendanceRepo.findMonthlyRecordsForEmployees(organizationId, employeeIds, monthPrefix),
      this.leaveRepo.findApprovedLeavesForEmployees(organizationId, employeeIds, periodStart, periodEnd),
    ]);

    // Index contracts by employee_id (prefer 'Running' status)
    const contractMap = new Map<string, any>();
    for (const c of allContracts) {
      if (!contractMap.has(c.employee_id) || c.status === 'Running') {
        contractMap.set(c.employee_id, c);
      }
    }

    // Index attendance summaries by employee_id
    const attendanceMap = new Map<string, { workedHours: number; overtimeHours: number; absentDays: number; presentDays: number; absentDates: string[] }>();
    for (const eid of employeeIds) {
      attendanceMap.set(eid, { workedHours: 0, overtimeHours: 0, absentDays: 0, presentDays: 0, absentDates: [] });
    }
    for (const r of attendanceRecords) {
      const entry = attendanceMap.get(r.employee_id);
      if (entry) {
        entry.workedHours += r.worked_hours || 0;
        entry.overtimeHours += r.overtime_hours || 0;
        if (r.status === 'Absent') {
          entry.absentDays++;
          if (r.date) {
            entry.absentDates.push(r.date);
          }
        } else {
          entry.presentDays++;
        }
      }
    }

    // Index unpaid leave days and detailed leave records by employee_id
    interface UnpaidLeaveItem {
      id: string;
      typeName: string;
      duration: number;
      startDate: Date;
      endDate: Date;
      status: string;
      reason?: string | null;
    }

    const leaveMap = new Map<string, number>();
    const unpaidLeavesByEmployee = new Map<string, UnpaidLeaveItem[]>();

    for (const l of approvedLeaves) {
      const isUnpaid =
        !l.leave_type?.is_paid ||
        l.leave_type?.name.toLowerCase().includes('unpaid') ||
        (l.leave_type?.code && l.leave_type.code.toLowerCase().includes('unpaid'));

      if (isUnpaid) {
        const cur = leaveMap.get(l.employee_id) || 0;
        leaveMap.set(l.employee_id, cur + l.duration);

        const list = unpaidLeavesByEmployee.get(l.employee_id) || [];
        list.push({
          id: l.id,
          typeName: l.leave_type?.name || 'Unpaid Leave',
          duration: l.duration,
          startDate: new Date(l.start_date),
          endDate: new Date(l.end_date),
          status: l.status,
          reason: l.reason,
        });
        unpaidLeavesByEmployee.set(l.employee_id, list);
      }
    }

    // Collect all unique salary structure IDs
    const structureIdsToFetch = new Set<string>();
    for (const [_, contract] of contractMap) {
      const sId = structureIdOverride || contract.salary_structure_id;
      if (sId) structureIdsToFetch.add(sId);
    }

    // 5. Fetch all required rules in 1 bulk query
    const rulesByStructure = new Map<string, any[]>();
    if (structureIdsToFetch.size > 0) {
      const allRules = await this.salaryRepo.findRulesForStructures(organizationId, Array.from(structureIdsToFetch));
      for (const rule of allRules) {
        const list = rulesByStructure.get(rule.structure_id) || [];
        list.push(rule);
        rulesByStructure.set(rule.structure_id, list);
      }
    }

    // Index employees by id
    const empMap = new Map<string, any>();
    for (const e of employees) {
      empMap.set(e.id, e);
    }

    // Compute all employee results in-memory
    const results = new Map<string, PayrollCalculationResult>();

    for (const eid of employeeIds) {
      const warnings: string[] = [];
      const employee = empMap.get(eid);
      if (!employee) {
        warnings.push(`Employee with ID ${eid} not found`);
        results.set(eid, {
          employeeId: eid,
          contractId: null,
          basicSalary: 0,
          grossSalary: 0,
          totalDeductions: 0,
          netSalary: 0,
          workedDays: 0,
          overtimeHours: 0,
          unpaidLeaveDays: 0,
          absentDays: 0,
          lines: [],
          warnings,
        });
        continue;
      }

      const contract = contractMap.get(eid);
      if (!contract) {
        warnings.push('No valid contract found covering this payroll period');
        results.set(eid, {
          employeeId: eid,
          contractId: null,
          basicSalary: 0,
          grossSalary: 0,
          totalDeductions: 0,
          netSalary: 0,
          workedDays: 0,
          overtimeHours: 0,
          unpaidLeaveDays: 0,
          absentDays: 0,
          lines: [],
          warnings,
        });
        continue;
      }

      const attendance = attendanceMap.get(eid) || { workedHours: 0, overtimeHours: 0, absentDays: 0, presentDays: 0, absentDates: [] };
      const unpaidLeaveDays = leaveMap.get(eid) || 0;
      const empUnpaidLeaves = unpaidLeavesByEmployee.get(eid) || [];

      const targetStructureId = structureIdOverride || contract.salary_structure_id;
      const rules = (targetStructureId && rulesByStructure.get(targetStructureId)) || [];
      const basicSalary = Number(contract.wage) || 0;
      const expectedWorkingDays = 26;
      const dailyRate = expectedWorkingDays > 0 ? +(basicSalary / expectedWorkingDays).toFixed(2) : 0;

      const context = {
        basic: basicSalary,
        grossSoFar: basicSalary,
        overtimeHours: attendance.overtimeHours,
        unpaidLeaveDays,
        absentDays: attendance.absentDays,
        expectedWorkingDays,
        standardMonthlyHours: 160,
      };

      const lines: PayslipLineResult[] = [];
      let grossSalary = 0;
      let totalDeductions = 0;
      let hasHandledUnpaidLeave = false;
      let hasHandledAbsence = false;

      // Format date like "05-Sep" or "Sep 05"
      const formatDateStr = (dStr: string): string => {
        try {
          const d = new Date(dStr);
          if (isNaN(d.getTime())) return dStr;
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const day = String(d.getUTCDate()).padStart(2, '0');
          return `${day}-${months[d.getUTCMonth()]}`;
        } catch {
          return dStr;
        }
      };

      // Push itemized unpaid leave deduction lines with breakdown details
      const pushUnpaidLeaveDeductions = () => {
        if (empUnpaidLeaves.length === 0) return;
        let pendingDays = 0;

        for (const ul of empUnpaidLeaves) {
          const itemDeduction = +(ul.duration * dailyRate).toFixed(2);
          const startStr = formatDateStr(ul.startDate.toISOString());
          const endStr = formatDateStr(ul.endDate.toISOString());
          const dateStr = startStr === endStr ? startStr : `${startStr} - ${endStr}`;
          const isPending = ul.status === 'To Approve';
          if (isPending) pendingDays += ul.duration;
          const statusTag = isPending ? ' [Pending Approval]' : '';
          const rateFormatted = dailyRate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

          lines.push({
            name: `Unpaid Leave Deduction - ${ul.typeName} (${ul.duration} ${ul.duration === 1 ? 'day' : 'days'} @ ₹${rateFormatted}/day: ${dateStr})${statusTag}`,
            category: 'Deduction',
            amount: itemDeduction,
          });
          totalDeductions += itemDeduction;
        }

        if (pendingDays > 0) {
          warnings.push(`Contains ${pendingDays} day(s) of unpaid leave pending approval`);
        }
      };

      // Push itemized attendance absence deduction lines with breakdown details
      const pushAbsenceDeductions = (prefixName?: string) => {
        if (attendance.absentDays === 0) return;
        const absenceAmount = +(attendance.absentDays * dailyRate).toFixed(2);
        const formattedDates = attendance.absentDates.map(formatDateStr).join(', ');
        const datesTag = formattedDates ? `: ${formattedDates}` : '';
        const label = prefixName || 'Attendance Absence Deduction';
        const rateFormatted = dailyRate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        lines.push({
          name: `${label} (${attendance.absentDays} ${attendance.absentDays === 1 ? 'day' : 'days'} @ ₹${rateFormatted}/day${datesTag})`,
          category: 'Deduction',
          amount: absenceAmount,
        });
        totalDeductions += absenceAmount;
      };

      for (const rule of rules) {
        let amount = 0;
        if (rule.category === 'Basic') {
          amount = basicSalary;
        } else {
          amount = this.ruleEvaluator.evaluate(rule, context);
        }

        // Handle UNPAID_LEAVE_DEDUCTION rule by inserting the itemized breakdown
        if (rule.formula_key === 'UNPAID_LEAVE_DEDUCTION') {
          hasHandledUnpaidLeave = true;
          pushUnpaidLeaveDeductions();
          continue;
        }

        // Handle ATTENDANCE_BASED rule by inserting the itemized absence breakdown
        if (rule.formula_key === 'ATTENDANCE_BASED') {
          hasHandledAbsence = true;
          pushAbsenceDeductions(rule.name);
          continue;
        }

        const isDeductionFormula = rule.formula_key === 'ATTENDANCE_BASED';
        const effectiveCategory = isDeductionFormula ? 'Deduction' : rule.category;
        const absAmount = Math.abs(amount);

        // Omit zero-amount deductions to keep payslip clean
        if (effectiveCategory === 'Deduction' && absAmount === 0) {
          continue;
        }

        lines.push({
          name: rule.name,
          category: effectiveCategory,
          amount: absAmount,
        });

        if (effectiveCategory === 'Deduction') {
          totalDeductions += absAmount;
        } else {
          grossSalary += absAmount;
          context.grossSoFar = grossSalary;
        }
      }

      // If structure did NOT have an explicit UNPAID_LEAVE_DEDUCTION rule, but employee has unpaid leaves
      if (!hasHandledUnpaidLeave && empUnpaidLeaves.length > 0) {
        pushUnpaidLeaveDeductions();
      }

      // If structure did NOT have an explicit ATTENDANCE_BASED rule, but employee has absent days
      if (!hasHandledAbsence && attendance.absentDays > 0) {
        pushAbsenceDeductions();
      }

      if (lines.length === 0 || !lines.some((l) => l.category === 'Basic')) {
        grossSalary = basicSalary;
        lines.unshift({ name: 'Basic Salary', category: 'Basic', amount: basicSalary });
      }

      totalDeductions = +totalDeductions.toFixed(2);
      grossSalary = +grossSalary.toFixed(2);
      let netSalary = +(grossSalary - totalDeductions).toFixed(2);
      if (netSalary < 0) {
        warnings.push(
          `Deductions (₹${totalDeductions.toFixed(2)}) exceed gross earnings (₹${grossSalary.toFixed(2)}). Net salary capped at ₹0.00 (Flagged for payroll review)`
        );
        netSalary = 0;
      }

      if (!employee.bank_account) {
        warnings.push('Missing bank account details');
      }

      if (contract.end_date) {
        const daysUntilExpiry = Math.round((new Date(contract.end_date).getTime() - periodEnd.getTime()) / 86400000);
        if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30) {
          warnings.push(`Contract expiring within ${daysUntilExpiry} days`);
        }
      }

      if (attendance.overtimeHours > 50) {
        warnings.push(`High overtime logged: ${attendance.overtimeHours} hours`);
      }

      results.set(eid, {
        employeeId: eid,
        contractId: contract.id,
        basicSalary,
        grossSalary: +grossSalary.toFixed(2),
        totalDeductions: +totalDeductions.toFixed(2),
        netSalary,
        workedDays: attendance.presentDays,
        overtimeHours: +attendance.overtimeHours.toFixed(2),
        unpaidLeaveDays,
        absentDays: attendance.absentDays,
        lines,
        warnings,
      });
    }

    return results;
  }
}

export const payrollCalculationService = new PayrollCalculationService();
