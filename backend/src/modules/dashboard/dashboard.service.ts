import { dashboardRepository, DashboardRepository } from './dashboard.repository';

export class DashboardService {
  constructor(private readonly repo: DashboardRepository = dashboardRepository) {}

  async getDashboardSummary(organizationId: string, year?: number, month?: number) {
    const targetYear = year || new Date().getFullYear();
    const targetMonth = month || (new Date().getMonth() + 1);

    const data = await this.repo.getMetrics(organizationId, targetYear, targetMonth);

    // Dynamic attendance breakdown for today
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    for (const a of data.attendanceToday) {
      if (a.status === 'Late') lateCount++;
      else if (a.status === 'Absent') absentCount++;
      else presentCount++;
    }

    // Dynamic average salary calculation
    const totalWage = data.contracts.reduce((sum, c) => sum + (c.wage || 0), 0);
    const averageSalary = data.contracts.length > 0 ? +(totalWage / data.contracts.length).toFixed(2) : 0;

    // Find payrun matching period or latest
    const currentPayrun = data.payruns.find(
      (p) => p.period_year === targetYear && p.period_month === targetMonth
    ) || data.payruns[0] || null;

    let totalPayrollCost = 0;
    let warningsCount = 0;
    if (currentPayrun) {
      totalPayrollCost = currentPayrun.total_gross || 0;
      for (const s of currentPayrun.payslips) {
        try {
          const w = JSON.parse(s.warnings_json || '[]');
          warningsCount += w.length;
        } catch {}
      }
    }

    // Department distribution
    const departmentDistribution = data.departments.map((d) => {
      let deptSalary = 0;
      for (const emp of d.employees) {
        if (emp.contracts[0]) {
          deptSalary += emp.contracts[0].wage || 0;
        }
      }
      return {
        department: d.name,
        employee_count: d.employees.length,
        total_salary: +deptSalary.toFixed(2),
      };
    });

    return {
      stats: {
        total_employees: data.totalEmployees,
        active_employees: data.activeEmployees,
        pending_leaves: data.pendingLeaves,
        attendance_today: {
          present: presentCount,
          late: lateCount,
          absent: absentCount,
          logged: data.attendanceToday.length,
        },
        payroll_status: currentPayrun ? currentPayrun.status : 'Not Started',
        total_payroll_cost: totalPayrollCost,
        average_salary: averageSalary,
        warnings_count: warningsCount,
      },
      current_payrun: currentPayrun,
      recent_payruns: data.payruns.map((p) => ({
        id: p.id,
        period: `${p.period_month}/${p.period_year}`,
        status: p.status,
        gross: p.total_gross,
        net: p.total_net,
        employee_count: p.payslips.length,
      })),
      department_distribution: departmentDistribution,
    };
  }
}

export const dashboardService = new DashboardService();
