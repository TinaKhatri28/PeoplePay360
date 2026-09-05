const db = require('./db');

// Find the contract that is "Running" and covers the given period for an employee
function findRunningContract(employeeId, year, month) {
  const periodEnd = new Date(year, month, 0); // last day of month
  const periodEndStr = periodEnd.toISOString().slice(0, 10);
  const contracts = db.prepare(`
    SELECT * FROM contracts WHERE employee_id = ? AND start_date <= ?
    ORDER BY start_date DESC
  `).all(employeeId, periodEndStr);

  // Prefer a contract with status Running whose end_date is null or >= period end,
  // otherwise fall back to whichever contract was active during the period.
  for (const c of contracts) {
    const coversStart = c.start_date <= periodEndStr;
    const coversEnd = !c.end_date || c.end_date >= periodEndStr || c.status === 'Running';
    if (coversStart && coversEnd) return c;
  }
  return contracts[0] || null;
}

function getWorkedHoursForMonth(employeeId, year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const rows = db.prepare(`
    SELECT COALESCE(SUM(worked_hours),0) as worked, COALESCE(SUM(overtime_hours),0) as ot,
           SUM(CASE WHEN status='Absent' THEN 1 ELSE 0 END) as absent_days
    FROM attendance WHERE employee_id = ? AND date LIKE ?
  `).get(employeeId, `${prefix}%`);
  return { worked: rows.worked || 0, overtime: rows.ot || 0, absentDays: rows.absent_days || 0 };
}

function getUnpaidLeaveDays(employeeId, year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const rows = db.prepare(`
    SELECT COALESCE(SUM(r.duration),0) as days
    FROM time_off_requests r
    JOIN time_off_types t ON t.id = r.type_id
    WHERE r.employee_id = ? AND r.status = 'Approved' AND r.start_date LIKE ?
      AND t.name LIKE '%Unpaid%'
  `).get(employeeId, `${prefix}%`);
  return rows.days || 0;
}

// Evaluate a single salary rule given a running context
function evalRule(rule, ctx) {
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
      // pro-rate basic by attendance ratio if absent days present
      const ratio = ctx.expectedWorkingDays > 0
        ? Math.max(0, (ctx.expectedWorkingDays - ctx.absentDays) / ctx.expectedWorkingDays)
        : 1;
      return +((ctx.basic * ratio) - ctx.basic).toFixed(2); // negative adjustment
    }
  }
  return 0;
}

function computeEmployeePayslip(employeeId, year, month, structureId) {
  const contract = findRunningContract(employeeId, year, month);
  const warnings = [];
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId);

  if (!contract) {
    warnings.push('No contract found covering this period');
    return { gross: 0, deductions: 0, net: 0, lines: [], warnings, contract: null };
  }

  const structId = structureId || contract.salary_structure_id;
  const rules = db.prepare('SELECT * FROM salary_rules WHERE structure_id = ? ORDER BY sequence ASC').all(structId);

  const attendance = getWorkedHoursForMonth(employeeId, year, month);
  const unpaidLeaveDays = getUnpaidLeaveDays(employeeId, year, month);

  // Basic salary always comes from the employee's running contract wage —
  // the Basic-category rule exists so it appears as its own line on the payslip.
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

  const lines = [];
  let gross = 0;
  let deductions = 0;

  for (const rule of rules) {
    const amount = rule.category === 'Basic' ? basic : evalRule(rule, ctx);
    lines.push({ name: rule.name, category: rule.category, amount });
    if (rule.category === 'Deduction') {
      deductions += Math.abs(amount);
    } else {
      gross += amount;
      ctx.grossSoFar = gross;
    }
  }

  const net = +(gross - deductions).toFixed(2);

  if (!employee.bank_account) warnings.push('Missing bank account details');
  if (contract.end_date) {
    const end = new Date(contract.end_date);
    const periodEnd = new Date(year, month, 0);
    const daysUntilExpiry = Math.round((end - periodEnd) / 86400000);
    if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30) warnings.push('Contract expiring within 30 days');
  }

  return {
    gross: +gross.toFixed(2),
    deductions: +deductions.toFixed(2),
    net,
    lines,
    warnings,
    contract,
  };
}

module.exports = { computeEmployeePayslip, findRunningContract, getWorkedHoursForMonth };
