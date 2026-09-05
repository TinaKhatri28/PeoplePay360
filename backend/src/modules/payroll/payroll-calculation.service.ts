import { prisma } from '../../config/database';
import { contractService, ContractService } from '../contracts/contract.service';
import { salaryRuleEvaluator, SalaryRuleEvaluator } from '../salary-structures/salary-rule.evaluator';
import { PayrollCalculationResult, PayslipLineResult } from './payroll.types';

export class PayrollCalculationService {
  constructor(
    private readonly contracts: ContractService = contractService,
    private readonly ruleEvaluator: SalaryRuleEvaluator = salaryRuleEvaluator
  ) {}

  /**
   * Determine applicable contract valid for the specific period
   */
  async getApplicableContract(organizationId: string, employeeId: string, year: number, month: number) {
    return this.contracts.getContractForPeriod(organizationId, employeeId, year, month);
  }

  /**
   * Calculate monthly attendance impact (worked hours, overtime, absences)
   */
  async calculateAttendanceImpact(organizationId: string, employeeId: string, year: number, month: number) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;

    const records = await prisma.attendanceRecord.findMany({
      where: {
        organization_id: organizationId,
        employee_id: employeeId,
        date: { startsWith: prefix },
      },
    });

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
   * Calculate leave impact (unpaid leave deduction days)
   */
  async calculateLeaveImpact(organizationId: string, employeeId: string, year: number, month: number) {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    const approvedLeaves = await prisma.leaveRequest.findMany({
      where: {
        organization_id: organizationId,
        employee_id: employeeId,
        status: 'Approved',
        start_date: { lte: monthEnd },
        end_date: { gte: monthStart },
      },
      include: { leave_type: true },
    });

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
    const warnings: string[] = [];

    // 1. Fetch employee
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organization_id: organizationId },
    });

    if (!employee) {
      warnings.push(`Employee with ID ${employeeId} not found`);
      return {
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
        warnings,
      };
    }

    // 2. Applicable contract for period
    const contract = await this.getApplicableContract(organizationId, employeeId, year, month);
    if (!contract) {
      warnings.push('No valid contract found covering this payroll period');
      return {
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
        warnings,
      };
    }

    // 3. Attendance & Leave impacts
    const attendance = await this.calculateAttendanceImpact(organizationId, employeeId, year, month);
    const leave = await this.calculateLeaveImpact(organizationId, employeeId, year, month);

    // 4. Resolve salary structure & rules
    const targetStructureId = structureIdOverride || contract.salary_structure_id;
    let rules: any[] = [];
    if (targetStructureId) {
      rules = await prisma.salaryRule.findMany({
        where: { structure_id: targetStructureId, is_active: true },
        orderBy: { sequence: 'asc' },
      });
    }

    const basicSalary = Number(contract.wage) || 0;

    const context = {
      basic: basicSalary,
      grossSoFar: basicSalary,
      overtimeHours: attendance.overtimeHours,
      unpaidLeaveDays: leave.unpaidLeaveDays,
      absentDays: attendance.absentDays,
      expectedWorkingDays: 26,
      standardMonthlyHours: 160,
    };

    const lines: PayslipLineResult[] = [];
    let grossSalary = 0;
    let totalDeductions = 0;

    // Execute rules in deterministic sequence
    for (const rule of rules) {
      let amount = 0;
      if (rule.category === 'Basic') {
        amount = basicSalary;
      } else {
        amount = this.ruleEvaluator.evaluate(rule, context);
      }

      lines.push({
        name: rule.name,
        category: rule.category,
        amount: Math.abs(amount),
      });

      if (rule.category === 'Deduction') {
        totalDeductions += Math.abs(amount);
      } else {
        grossSalary += amount;
        context.grossSoFar = grossSalary;
      }
    }

    // Fallback if no rules defined: basic salary is gross
    if (lines.length === 0) {
      grossSalary = basicSalary;
      lines.push({ name: 'Basic Salary', category: 'Basic', amount: basicSalary });
    }

    const netSalary = +(grossSalary - totalDeductions).toFixed(2);

    // 5. Generate Warnings
    if (!employee.bank_account) {
      warnings.push('Missing bank account details');
    }

    if (contract.end_date) {
      const periodEnd = new Date(year, month, 0);
      const daysUntilExpiry = Math.round((contract.end_date.getTime() - periodEnd.getTime()) / 86400000);
      if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30) {
        warnings.push(`Contract expiring within ${daysUntilExpiry} days`);
      }
    }

    if (attendance.overtimeHours > 50) {
      warnings.push(`High overtime logged: ${attendance.overtimeHours} hours`);
    }

    return {
      employeeId,
      contractId: contract.id,
      basicSalary,
      grossSalary: +grossSalary.toFixed(2),
      totalDeductions: +totalDeductions.toFixed(2),
      netSalary,
      workedDays: attendance.presentDays,
      overtimeHours: attendance.overtimeHours,
      unpaidLeaveDays: leave.unpaidLeaveDays,
      absentDays: attendance.absentDays,
      lines,
      warnings,
    };
  }
}

export const payrollCalculationService = new PayrollCalculationService();
