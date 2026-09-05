import { prisma } from '../../config/database';

export class PayrollRepository {
  async findEligibleEmployees(organizationId: string, periodStart: Date, periodEnd: Date) {
    // Employees who have active status and a contract covering the period
    const employees = await prisma.employee.findMany({
      where: { organization_id: organizationId, status: 'Active' },
      include: {
        contracts: {
          where: {
            start_date: { lte: periodEnd },
            OR: [
              { end_date: null },
              { end_date: { gte: periodStart } },
            ],
          },
          orderBy: { start_date: 'desc' },
        },
      },
    });

    return employees.filter((e) => e.contracts.length > 0);
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
    return prisma.$transaction(async (tx) => {
      for (const slip of calculatedSlips) {
        await tx.payslip.update({
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
        });
      }

      const updatedPayrun = await tx.payrun.update({
        where: { id: payrunId },
        data: {
          status: 'Computed',
          total_gross: totals.gross,
          total_deductions: totals.deductions,
          total_net: totals.net,
        },
      });

      return updatedPayrun;
    });
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
