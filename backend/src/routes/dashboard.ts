import express from 'express';
import db from '../db';
import { authRequired, AuthRequest } from '../auth';

const router = express.Router();
router.use(authRequired as any);

router.get('/', (req: express.Request, res: express.Response) => {
  const { year, month } = req.query;
  const y = Number(year) || new Date().getFullYear();
  const m = Number(month) || new Date().getMonth() + 1;

  const run = db.prepare('SELECT * FROM payruns WHERE period_year = ? AND period_month = ? ORDER BY id DESC LIMIT 1').get(y, m) as any;
  let netSalary = 0, payslipCount = 0, avgSalary = 0;
  let byDept: Array<{ name: string; total: number }> = [];
  if (run) {
    const slips = db.prepare(`
      SELECT p.*, e.department_id, d.name as dept_name FROM payslips p
      JOIN employees e ON e.id = p.employee_id LEFT JOIN departments d ON d.id = e.department_id
      WHERE p.payrun_id = ?
    `).all(run.id) as any[];
    netSalary = slips.reduce((s, x) => s + x.net, 0);
    payslipCount = slips.length;
    avgSalary = payslipCount ? netSalary / payslipCount : 0;

    const deptMap: Record<string, number> = {};
    for (const s of slips) {
      const key = s.dept_name || 'Unassigned';
      deptMap[key] = (deptMap[key] || 0) + s.net;
    }
    byDept = Object.entries(deptMap).map(([name, total]) => ({ name, total: +total.toFixed(2) }));
  }

  const trend: Array<{ label: string; total: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    const ty = d.getFullYear(), tm = d.getMonth() + 1;
    const r = db.prepare('SELECT * FROM payruns WHERE period_year = ? AND period_month = ? ORDER BY id DESC LIMIT 1').get(ty, tm) as any;
    let total = 0;
    if (r) {
      total = (db.prepare('SELECT COALESCE(SUM(net),0) t FROM payslips WHERE payrun_id = ?').get(r.id) as any).t;
    }
    trend.push({ label: d.toLocaleString('en-US', { month: 'short' }), total: +total.toFixed(2) });
  }

  const prefix = `${y}-${String(m).padStart(2, '0')}`;
  const att = db.prepare(`
    SELECT
      SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) as present,
      SUM(CASE WHEN status='Absent' THEN 1 ELSE 0 END) as absent,
      SUM(CASE WHEN status='Late' THEN 1 ELSE 0 END) as late,
      SUM(CASE WHEN overtime_hours > 0 THEN 1 ELSE 0 END) as overtime
    FROM attendance WHERE date LIKE ?
  `).get(`${prefix}%`) as any;

  const totalAttendanceRows = (db.prepare('SELECT COUNT(*) c FROM attendance WHERE date LIKE ?').get(`${prefix}%`) as any).c;
  const attendanceRate = totalAttendanceRows ? Math.round(((att.present || 0) / totalAttendanceRows) * 100) : 0;

  const leaveTypes = db.prepare('SELECT * FROM time_off_types').all() as any[];
  const leaveSummary = leaveTypes.map(t => {
    const approved = (db.prepare("SELECT COUNT(*) c FROM time_off_requests WHERE type_id = ? AND status = 'Approved'").get(t.id) as any).c;
    const pending = (db.prepare("SELECT COUNT(*) c FROM time_off_requests WHERE type_id = ? AND status = 'To Approve'").get(t.id) as any).c;
    const remaining = (db.prepare('SELECT COALESCE(SUM(allocated - taken),0) r FROM time_off_allocations WHERE type_id = ?').get(t.id) as any).r;
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

export default router;
