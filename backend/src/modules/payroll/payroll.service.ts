import { payrollRepository, PayrollRepository } from './payroll.repository';
import { payrollCalculationService, PayrollCalculationService } from './payroll-calculation.service';
import { auditService, AuditService } from '../audit/audit.service';
import { dispatchJob, PAYROLL_QUEUE_NAME, EMAIL_QUEUE_NAME } from '../../jobs/queue';
import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors/app.error';

export class PayrollService {
  constructor(
    private readonly repo: PayrollRepository = payrollRepository,
    private readonly calculation: PayrollCalculationService = payrollCalculationService,
    private readonly audit: AuditService = auditService
  ) {}

  async getEligibleEmployees(organizationId: string, year: number, month: number) {
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0);

    const employees = await this.repo.findEligibleEmployees(organizationId, periodStart, periodEnd);
    return employees.map((e) => ({
      ...e,
      name: `${e.first_name} ${e.last_name}`,
      contract: e.contracts[0] || null,
    }));
  }

  async listPayruns(organizationId: string) {
    return this.repo.findAllPayruns(organizationId);
  }

  async getPayrunById(organizationId: string, id: string) {
    const run = await this.repo.findPayrunById(organizationId, id);
    if (!run) {
      throw new NotFoundError(`Payrun with id ${id} not found`);
    }

    const payslips = run.payslips.map((p) => {
      let lines = [];
      let warnings = [];
      try {
        lines = JSON.parse(p.lines_json || '[]');
      } catch {}
      try {
        warnings = JSON.parse(p.warnings_json || '[]');
      } catch {}

      return {
        ...p,
        employee_name: p.employee ? `${p.employee.first_name} ${p.employee.last_name}` : 'Unknown',
        lines,
        warnings,
      };
    });

    return {
      ...run,
      payslips,
    };
  }

  async createPayrun(organizationId: string, data: any, actorUserId?: string) {
    const month = Number(data.period_month);
    const year = Number(data.period_year);
    const employeeIds: string[] = data.employee_ids || [];

    if (!month || !year || employeeIds.length === 0) {
      throw new ValidationError('period_month, period_year, and employee_ids are required');
    }

    const existing = await this.repo.findPayrunByPeriod(organizationId, year, month);
    if (existing) {
      throw new ConflictError(`A payrun for period ${month}/${year} already exists.`);
    }

    const payrun = await this.repo.createPayrun({
      organization_id: organizationId,
      period_month: month,
      period_year: year,
      structure_id: data.structure_id || null,
      status: 'Draft',
    });

    // Create draft payslips for all selected employees
    const draftPayslips = [];
    for (const eid of employeeIds) {
      const contract = await this.calculation.getApplicableContract(organizationId, eid, year, month);
      draftPayslips.push({
        organization_id: organizationId,
        payrun_id: payrun.id,
        employee_id: eid,
        contract_id: contract?.id || null,
        gross: 0,
        deductions: 0,
        net: 0,
        lines_json: '[]',
        warnings_json: '[]',
        status: 'Draft',
      });
    }

    if (draftPayslips.length > 0) {
      await this.repo.createDraftPayslips(draftPayslips);
    }

    await this.audit.log({
      organizationId,
      userId: actorUserId,
      action: 'PAYRUN_CREATED',
      resourceType: 'payrun',
      resourceId: payrun.id,
      details: { month, year, employee_count: employeeIds.length },
    });

    return { id: payrun.id, payrun };
  }

  /**
   * Execute full payroll computation across all employees in the payrun
   */
  async computePayrun(organizationId: string, payrunId: string, actorUserId?: string) {
    const run = await this.repo.findPayrunById(organizationId, payrunId);
    if (!run) {
      throw new NotFoundError(`Payrun with id ${payrunId} not found`);
    }

    // State machine check
    if (run.status === 'Paid') {
      throw new ConflictError('Cannot recompute a payrun that has already been marked Paid');
    }

    await this.repo.updatePayrunStatus(payrunId, 'Processing');

    const computeAction = async () => {
      const employeeIds = run.payslips.map((s) => s.employee_id);
      const resultMap = await this.calculation.calculateBatchPayroll(
        organizationId,
        employeeIds,
        run.period_year,
        run.period_month,
        run.structure_id
      );

      let totalGross = 0;
      let totalDeductions = 0;
      let totalNet = 0;

      const updatePromises = [];

      for (const slip of run.payslips) {
        const result = resultMap.get(slip.employee_id);
        if (!result) continue;

        totalGross += result.grossSalary;
        totalDeductions += result.totalDeductions;
        totalNet += result.netSalary;

        updatePromises.push(
          this.repo.updatePayslipCalculation(slip.id, {
            contract_id: result.contractId,
            gross: result.grossSalary,
            deductions: result.totalDeductions,
            net: result.netSalary,
            lines_json: JSON.stringify(result.lines),
            warnings_json: JSON.stringify(result.warnings),
            status: 'Done',
          })
        );
      }

      await Promise.all(updatePromises);

      await this.repo.updatePayrunStatus(payrunId, 'Computed', {
        gross: +totalGross.toFixed(2),
        deductions: +totalDeductions.toFixed(2),
        net: +totalNet.toFixed(2),
      });

      await this.audit.log({
        organizationId,
        userId: actorUserId,
        action: 'PAYRUN_COMPUTED',
        resourceType: 'payrun',
        resourceId: payrunId,
        details: { totalGross, totalNet, count: run.payslips.length },
      });
    };

    // Execute computation
    await computeAction();

    return { ok: true, computed: run.payslips.length };
  }

  /**
   * Validate payrun: surfaces warnings, detects missing bank info, duplicate payslips, etc.
   */
  async validatePayrun(organizationId: string, payrunId: string, actorUserId?: string) {
    const run = await this.repo.findPayrunById(organizationId, payrunId);
    if (!run) {
      throw new NotFoundError(`Payrun with id ${payrunId} not found`);
    }

    const issues: Array<{ type: string; message: string }> = [];
    const seenEmployees = new Set<string>();
    let validCount = 0;

    for (const slip of run.payslips) {
      const empName = slip.employee ? `${slip.employee.first_name} ${slip.employee.last_name}` : 'Employee';
      if (seenEmployees.has(slip.employee_id)) {
        issues.push({ type: 'duplicate', message: `Duplicate payslip for ${empName}` });
      }
      seenEmployees.add(slip.employee_id);

      if (slip.status !== 'Done') {
        issues.push({ type: 'draft', message: `${empName}'s payslip is still a draft (not computed)` });
      }

      let warnings: string[] = [];
      try {
        warnings = JSON.parse(slip.warnings_json || '[]');
      } catch {}

      for (const w of warnings) {
        issues.push({
          type: w.toLowerCase().includes('bank') ? 'bank' : 'contract',
          message: `${empName}: ${w}`,
        });
      }

      if (warnings.length === 0 && slip.status === 'Done') {
        validCount++;
      }
    }

    const newStatus = issues.length > 0 ? 'Review Required' : 'Validated';
    await this.repo.updatePayrunStatus(payrunId, newStatus);

    return {
      ok: true,
      total: run.payslips.length,
      valid: validCount,
      issues,
      warningsCount: issues.length,
    };
  }

  /**
   * Mark payrun as paid (State transition: Computed/Validated/Approved -> Paid)
   */
  async markPaid(organizationId: string, payrunId: string, actorUserId?: string) {
    const run = await this.repo.findPayrunById(organizationId, payrunId);
    if (!run) {
      throw new NotFoundError(`Payrun with id ${payrunId} not found`);
    }

    if (run.status === 'Paid') {
      return { ok: true, message: 'Payrun already paid' };
    }

    await this.repo.updatePayrunStatus(payrunId, 'Paid');

    // Update all payslips to Paid
    for (const slip of run.payslips) {
      await this.repo.updatePayslipCalculation(slip.id, {
        contract_id: slip.contract_id,
        gross: Number(slip.gross),
        deductions: Number(slip.deductions),
        net: Number(slip.net),
        lines_json: slip.lines_json,
        warnings_json: slip.warnings_json,
        status: 'Paid',
      });
    }

    await this.audit.log({
      organizationId,
      userId: actorUserId,
      action: 'PAYROLL_MARKED_PAID',
      resourceType: 'payrun',
      resourceId: payrunId,
      details: { total_net: run.total_net },
    });

    return { ok: true };
  }

  async sendPayslips(organizationId: string, payrunId: string, actorUserId?: string) {
    const run = await this.repo.findPayrunById(organizationId, payrunId);
    if (!run) {
      throw new NotFoundError(`Payrun with id ${payrunId} not found`);
    }

    for (const slip of run.payslips) {
      if (slip.employee?.email) {
        await dispatchJob(EMAIL_QUEUE_NAME, `send-payslip-${slip.id}`, {
          to: slip.employee.email,
          subject: `Your Payslip for ${run.period_month}/${run.period_year}`,
          html: `<p>Dear ${slip.employee.first_name},</p><p>Your payslip for ${run.period_month}/${run.period_year} has been processed.</p><p>Net Pay: $${Number(slip.net).toFixed(2)}</p>`,
          text: `Your payslip for ${run.period_month}/${run.period_year} has been processed. Net Pay: $${Number(slip.net).toFixed(2)}`,
        });
      }
    }

    return { ok: true, sent: run.payslips.length };
  }

  async getPayslipById(organizationId: string, payslipId: string) {
    const slip = await this.repo.findPayslipById(organizationId, payslipId);
    if (!slip) {
      throw new NotFoundError(`Payslip with id ${payslipId} not found`);
    }

    let lines = [];
    let warnings = [];
    try {
      lines = JSON.parse(slip.lines_json || '[]');
    } catch {}
    try {
      warnings = JSON.parse(slip.warnings_json || '[]');
    } catch {}

    return {
      ...slip,
      employee_name: slip.employee ? `${slip.employee.first_name} ${slip.employee.last_name}` : 'Unknown',
      lines,
      warnings,
    };
  }
}

export const payrollService = new PayrollService();
