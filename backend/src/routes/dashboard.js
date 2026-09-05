const express = require('express');
const db = require('../db');
const { authRequired } = require('../auth');

const router = express.Router();
router.use(authRequired);

router.get('/', (req, res) => {
  const { year, month } = req.query;
  const y = +year || new Date().getFullYear();
  const m = +month || new Date().getMonth() + 1;

  const run = db.prepare('SELECT * FROM payruns WHERE period_year = ? AND period_month = ? ORDER BY id DESC LIMIT 1').get(y, m);
  let netSalary = 0, payslipCount = 0, avgSalary = 0;
  let byDept = [];
  if (run) {
    const slips = db.prepare(`
      SELECT p.*, e.department_id, d.name as dept_name FROM payslips p
      JOIN employees e ON e.id = p.employee_id LEFT JOIN departments d ON d.id = e.department_id
      WHERE p.payrun_id = ?
    `).all(run.id);
    netSalary = slips.reduce((s, x) => s + x.net, 0);
    payslipCount = slips.length;
    avgSalary = payslipCount ? netSalary / payslipCount : 0;

    const deptMap = {};
    for (const s of slips) {
      const key = s.dept_name || 'Unassigned';
      deptMap[key] = (deptMap[key] || 0) + s.net;
    }
    byDept = Object.entries(deptMap).map(([name, total]) => ({ name, total: +total.toFixed(2) }));
  }

  // Monthly trend: last 6 months net salary from payruns/payslips
  const trend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    const ty = d.getFullYear(), tm = d.getMonth() + 1;
    const r = db.prepare('SELECT * FROM payruns WHERE period_year = ? AND period_month = ? ORDER BY id DESC LIMIT 1').get(ty, tm);
    let total = 0;
    if (r) {
      total = db.prepare('SELECT COALESCE(SUM(net),0) t FROM payslips WHERE payrun_id = ?').get(r.id).t;
    }
    trend.push({ label: d.toLocaleString('en-US', { month: 'short' }), total: +total.toFixed(2) });
  }

  // Attendance summary for the period
  const prefix = `${y}-${String(m).padStart(2, '0')}`;
  const att = db.prepare(`
    SELECT
      SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) as present,
      SUM(CASE WHEN status='Absent' THEN 1 ELSE 0 END) as absent,
      SUM(CASE WHEN status='Late' THEN 1 ELSE 0 END) as late,
      SUM(CASE WHEN overtime_hours > 0 THEN 1 ELSE 0 END) as overtime
    FROM attendance WHERE date LIKE ?
  `).get(`${prefix}%`);

  const totalAttendanceRows = db.prepare('SELECT COUNT(*) c FROM attendance WHERE date LIKE ?').get(`${prefix}%`).c;
  const attendanceRate = totalAttendanceRows ? Math.round(((att.present || 0) / totalAttendanceRows) * 100) : 0;

  // Leave summary
  const leaveTypes = db.prepare('SELECT * FROM time_off_types').all();
  const leaveSummary = leaveTypes.map(t => {
    const approved = db.prepare("SELECT COUNT(*) c FROM time_off_requests WHERE type_id = ? AND status = 'Approved'").get(t.id).c;
    const pending = db.prepare("SELECT COUNT(*) c FROM time_off_requests WHERE type_id = ? AND status = 'To Approve'").get(t.id).c;
    const remaining = db.prepare('SELECT COALESCE(SUM(allocated - taken),0) r FROM time_off_allocations WHERE type_id = ?').get(t.id).r;
    return { name: t.name, approved, pending, remaining };
  });

  res.json({
    period: { year: y, month: m },
    netSalary: +netSalary.toFixed(2),
    payslipCount,
    avgSalary: +avgSalary.toFixed(2),
    attendanceRate,
    byDepartment: byDept,
    monthlyTrend: trend,
    attendance: { present: att.present || 0, absent: att.absent || 0, late: att.late || 0, overtime: att.overtime || 0 },
    leave: leaveSummary,
    payrunStatus: run?.status || 'No payrun yet',
  });
});

module.exports = router;
