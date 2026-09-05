import { prisma } from '../../config/database';
import { ConflictError, NotFoundError } from '../../shared/errors/app.error';

export class PayrollRepository {
  async findEligibleEmployees(organizationId: string, periodStart: Date, periodEnd: Date) {
    // Employees who have active status
    const employees = await prisma.employee.findMany({
      where: { organization_id: organizationId, status: 'Active' },
      include: {
        contracts: {
          orderBy: { start_date: 'desc' },
        },
      },
      orderBy: { first_name: 'asc' },
    });

    for (const emp of employees) {
      // Find running or valid contract
      let validContract = emp.contracts.find(
        (c) => c.status === 'Running' || (!c.end_date || new Date(c.end_date) >= periodStart)
      );

      if (!validContract && emp.contracts.length > 0) {
        validContract = emp.contracts[0];
      }

      if (!validContract) {
        try {
          const refCode = `CON-${(emp.first_name || 'EMP').slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
          validContract = await prisma.employmentContract.create({
            data: {
              organization_id: organizationId,
              employee_id: emp.id,
              ref: refCode,
              start_date: emp.joining_date || periodStart,
              wage: 30000,
              status: 'Running',
              position: emp.position || 'Staff',
            },
          });
        } catch (err) {
          console.error('Failed to auto-create contract in findEligibleEmployees:', err);
        }
      }

      emp.contracts = validContract ? [validContract] : [];
    }

    return employees;
  }

  async findAllPayruns(organizationId: string) {
    return prisma.payrun.findMany({
      where: { organization_id: organizationId },
      include: {
        structure: true,
        payslips: {
          select: {
            id: true,
            gross: true,
            deductions: true,
            net: true,
            status: true,
          },
        },
      },
      orderBy: [{ period_year: 'desc' }, { period_month: 'desc' }],
    });
  }

  async findPayrunById(organizationId: string, id: string) {
    return prisma.payrun.findFirst({
      where: { id, organization_id: organizationId },
      include: {
        structure: true,
        payslips: {
          include: {
            employee: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                position: true,
                bank_account: true,
              },
            },
            contract: true,
          },
        },
      },
    });
  }

  async findPayrunByPeriod(organizationId: string, year: number, month: number) {
    return prisma.payrun.findFirst({
      where: {
        organization_id: organizationId,
        period_year: year,
        period_month: month,
      },
    });
  }

  async createPayrun(data: {
    organization_id: string;
    period_month: number;
    period_year: number;
    structure_id?: string | null;
    status: string;
  }) {
    return prisma.payrun.create({
      data,
    });
  }

  async createDraftPayslips(payslipsData: any[]) {
    return prisma.payslip.createMany({
      data: payslipsData,
      skipDuplicates: true,
    });
  }

  /**
   * ATOMIC TRANSACTION:
   * Creates payrun and all associated draft payslips atomically.
   */
  async createPayrunWithDraftPayslipsTx(
    payrunData: {
      organization_id: string;
      period_month: number;
      period_year: number;
      structure_id?: string | null;
      status: string;
    },
    draftPayslips: Array<{
      organization_id: string;
      employee_id: string;
      contract_id: string | null;
      gross: number;
      deductions: number;
      net: number;
      lines_json: string;
      warnings_json: string;
      status: string;
    }>
  ) {
    return prisma.$transaction(async (tx) => {
      const payrun = await tx.payrun.create({
        data: payrunData,
      });

      if (draftPayslips.length > 0) {
        const slipsWithPayrunId = draftPayslips.map((s) => ({
          ...s,
          payrun_id: payrun.id,
        }));
        await tx.payslip.createMany({
          data: slipsWithPayrunId,
          skipDuplicates: true,
        });
      }

      return payrun;
    });
  }

  /**
   * ATOMIC TRANSACTION:
   * Commits computed results for all payslips and updates the payrun totals in a single atomic transaction.
   */
  async commitBatchPayrunCalculationTx(
    payrunId: string,
    calculatedSlips: Array<{
      payslipId: string;
      contract_id: string | null;
      gross: number;
      deductions: number;
      net: number;
      lines_json: string;
      warnings_json: string;
      status: string;
    }>,
    totals: { gross: number; deductions: number; net: number }
  ) {
    const payslipUpdates = calculatedSlips.map((slip) =>
      prisma.payslip.update({
        where: { id: slip.payslipId },
        data: {
          contract_id: slip.contract_id,
          gross: slip.gross,
          deductions: slip.deductions,
          net: slip.net,
          lines_json: slip.lines_json,
          warnings_json: slip.warnings_json,
          status: slip.status,
        },
      })
    );

    const payrunUpdate = prisma.payrun.update({
      where: { id: payrunId },
      data: {
        status: 'Computed',
        total_gross: totals.gross,
        total_deductions: totals.deductions,
        total_net: totals.net,
      },
    });

    const results = await prisma.$transaction([...payslipUpdates, payrunUpdate], {
      timeout: 30000,
    });

    return results[results.length - 1];
  }

  async updatePayslipCalculation(
    payslipId: string,
    data: {
      contract_id: string | null;
      gross: number;
      deductions: number;
      net: number;
      lines_json: string;
      warnings_json: string;
      status: string;
    }
  ) {
    return prisma.payslip.update({
      where: { id: payslipId },
      data,
    });
  }

  async updatePayrunStatus(
    payrunId: string,
    status: string,
    totals?: { gross: number; deductions: number; net: number }
  ) {
    const data: any = { status };
    if (totals) {
      data.total_gross = totals.gross;
      data.total_deductions = totals.deductions;
      data.total_net = totals.net;
    }
    return prisma.payrun.update({
      where: { id: payrunId },
      data,
    });
  }

  /**
   * ATOMIC STATUS TRANSITION (Row Lock / Compare-And-Swap):
   * Transitions payrun to targetStatus ONLY IF current status is in allowedCurrentStatuses.
   * Guarantees atomic mutual exclusion against concurrent compute requests.
   */
  async transitionPayrunStatus(
    payrunId: string,
    organizationId: string,
    targetStatus: string,
    allowedCurrentStatuses: string[]
  ): Promise<number> {
    const result = await prisma.payrun.updateMany({
      where: {
        id: payrunId,
        organization_id: organizationId,
        status: { in: allowedCurrentStatuses },
      },
      data: {
        status: targetStatus,
      },
    });
    return result.count;
  }

  /**
   * ATOMIC TRANSACTION:
   * Transitions payrun to 'Paid' and atomically updates all associated payslips to 'Paid'.
   * Validates that payrun is in a payable status (Computed, Validated, or Approved).
   */
  async markPayrunPaidTx(organizationId: string, payrunId: string) {
    return prisma.$transaction(async (tx) => {
      const run = await tx.payrun.findFirst({
        where: { id: payrunId, organization_id: organizationId },
      });

      if (!run) {
        throw new NotFoundError(`Payrun with id ${payrunId} not found`);
      }

      if (run.status === 'Paid') {
        return run;
      }

      const payableStatuses = ['Computed', 'Validated', 'Approved'];
      if (!payableStatuses.includes(run.status)) {
        throw new ConflictError(
          `Cannot mark payrun as Paid from status '${run.status}'. Payrun must be Computed or Validated first.`
        );
      }

      // Atomically update all payslips of this payrun to Paid
      await tx.payslip.updateMany({
        where: { payrun_id: payrunId, organization_id: organizationId },
        data: { status: 'Paid' },
      });

      // Update payrun status to Paid
      const updated = await tx.payrun.update({
        where: { id: payrunId },
        data: { status: 'Paid' },
      });

      return updated;
    });
  }

  async findPayslipById(organizationId: string, payslipId: string) {
    return prisma.payslip.findFirst({
      where: { id: payslipId, organization_id: organizationId },
      include: {
        employee: true,
        contract: true,
        payrun: true,
      },
    });
  }
}

export const payrollRepository = new PayrollRepository();
