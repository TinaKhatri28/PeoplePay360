import db from './db';

// Find the contract that is "Running" and covers the given period for an employee
export function findRunningContract(employeeId: number, year: number, month: number) {
  const periodEnd = new Date(year, month, 0); // last day of month
  const periodEndStr = periodEnd.toISOString().slice(0, 10);
  const contracts = db.prepare(`
    SELECT * FROM contracts WHERE employee_id = ? AND start_date <= ?
    ORDER BY start_date DESC
  `).all(employeeId, periodEndStr);

  for (const c of contracts) {
    const coversStart = c.start_date <= periodEndStr;
    const coversEnd = !c.end_date || c.end_date >= periodEndStr || c.status === 'Running';
    if (coversStart && coversEnd) return c;
  }
  return contracts[0] || null;
}

export function getWorkedHoursForMonth(employeeId: number, year: number, month: number) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const rows = db.prepare(`
    SELECT COALESCE(SUM(worked_hours),0) as worked, COALESCE(SUM(overtime_hours),0) as ot,
           SUM(CASE WHEN status='Absent' THEN 1 ELSE 0 END) as absent_days
    FROM attendance WHERE employee_id = ? AND date LIKE ?
  `).get(employeeId, `${prefix}%`);
  return { worked: rows?.worked || 0, overtime: rows?.ot || 0, absentDays: rows?.absent_days || 0 };
}

export function getUnpaidLeaveDays(employeeId: number, year: number, month: number) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const rows = db.prepare(`
    SELECT COALESCE(SUM(r.duration),0) as days
    FROM time_off_requests r
    JOIN time_off_types t ON t.id = r.type_id
    WHERE r.employee_id = ? AND r.status = 'Approved' AND r.start_date LIKE ?
      AND t.name LIKE '%Unpaid%'
  `).get(employeeId, `${prefix}%`);
  return rows?.days || 0;
}

// Evaluate a single salary rule given a running context
export function evalRule(rule: any, ctx: any) {
  if (rule.compute_method === 'FIXED') {
    return rule.amount || 0;
  }
  if (rule.compute_method === 'PERCENTAGE') {
    const base = rule.percentage_of === 'GROSS_SO_FAR' ? ctx.grossSoFar : ctx.basic;
    return +(base * (rule.percentage || 0) / 100).toFixed(2);
  }
  if (rule.compute_method === 'FORMULA') {
    if (rule.formula_key === 'OVERTIME') {
      const hourlyRate = ctx.basic / (ctx.standardMonthlyHours || 160);
      return +(ctx.overtimeHours * hourlyRate * 1.5).toFixed(2);
    }
    if (rule.formula_key === 'UNPAID_LEAVE_DEDUCTION') {
      const perDay = ctx.basic / 30;
      return +(perDay * ctx.unpaidLeaveDays).toFixed(2);
    }
    if (rule.formula_key === 'ATTENDANCE_BASED') {
      const ratio = ctx.expectedWorkingDays > 0
        ? Math.max(0, (ctx.expectedWorkingDays - ctx.absentDays) / ctx.expectedWorkingDays)
        : 1;
      return +((ctx.basic * ratio) - ctx.basic).toFixed(2);
    }
  }
  return 0;
}

export function computeEmployeePayslip(employeeId: number, year: number, month: number, structureId?: number | null) {
  const contract = findRunningContract(employeeId, year, month);
  const warnings: string[] = [];
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId);

  if (!contract) {
    warnings.push('No contract found covering this period');
    return { gross: 0, deductions: 0, net: 0, lines: [], warnings, contract: null };
  }

  const structId = structureId || contract.salary_structure_id;
  const rules = db.prepare('SELECT * FROM salary_rules WHERE structure_id = ? ORDER BY sequence ASC').all(structId);

  const attendance = getWorkedHoursForMonth(employeeId, year, month);
  const unpaidLeaveDays = getUnpaidLeaveDays(employeeId, year, month);

  const basic = contract.wage;

  const ctx = {
    basic,
    overtimeHours: attendance.overtime,
    unpaidLeaveDays,
    absentDays: attendance.absentDays,
    expectedWorkingDays: 26,
    standardMonthlyHours: 160,
    grossSoFar: basic,
  };

  const lines: Array<{ name: string; category: string; amount: number }> = [];
  let gross = 0;
  let deductions = 0;

  for (const r of rules) {
    if (r.category === 'Basic') {
      lines.push({ name: r.name, category: 'Basic', amount: basic });
      gross += basic;
      continue;
    }

    const val = evalRule(r, ctx);
    if (r.category === 'Allowance') {
      lines.push({ name: r.name, category: 'Allowance', amount: val });
      gross += val;
      ctx.grossSoFar += val;
    } else if (r.category === 'Deduction') {
      lines.push({ name: r.name, category: 'Deduction', amount: Math.abs(val) });
      deductions += Math.abs(val);
    }
  }

  if (!employee?.bank_account) {
    warnings.push('Employee missing bank account information');
  }
  if (contract.end_date) {
    const end = new Date(contract.end_date);
    const periodEnd = new Date(year, month, 0);
    if (end <= periodEnd) {
      warnings.push(`Contract ${contract.ref} expires on or before ${contract.end_date}`);
    }
  }

  const net = +(gross - deductions).toFixed(2);
  return {
    gross: +gross.toFixed(2),
    deductions: +deductions.toFixed(2),
    net,
    lines,
    warnings,
    contract,
  };
}
