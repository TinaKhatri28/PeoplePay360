import express from 'express';
import PDFDocument from 'pdfkit';
import db from '../db';
import { authRequired, requireRole, AuthRequest } from '../auth';
import { computeEmployeePayslip, findRunningContract } from '../payrollEngine';

const router = express.Router();
router.use(authRequired as any);

router.get('/eligible-employees', (req: express.Request, res: express.Response) => {
  const { year, month } = req.query;
  const employees = db.prepare("SELECT * FROM employees WHERE status = 'Active'").all() as any[];
  const eligible = employees
    .map(e => ({ ...e, contract: findRunningContract(e.id, Number(year), Number(month)) }))
    .filter(e => e.contract);
  res.json(eligible);
});

router.get('/payruns', (_req: express.Request, res: express.Response) => {
  res.json(db.prepare('SELECT * FROM payruns ORDER BY period_year DESC, period_month DESC').all());
});

router.get('/payruns/:id', (req: express.Request, res: express.Response) => {
  const run = db.prepare('SELECT * FROM payruns WHERE id = ?').get(req.params.id) as any;
  if (!run) return res.status(404).json({ error: 'Payrun not found' });
  const slips = db.prepare(`
    SELECT p.*, e.name as employee_name FROM payslips p JOIN employees e ON e.id = p.employee_id
    WHERE p.payrun_id = ?
  `).all(run.id) as any[];
  res.json({ ...run, payslips: slips.map(s => ({ ...s, lines: JSON.parse(s.lines_json || '[]'), warnings: JSON.parse(s.warnings_json || '[]') })) });
});

router.post('/payruns', requireRole('HR Payroll User'), (req: AuthRequest, res: express.Response) => {
  const { period_month, period_year, structure_id, company, employee_ids } = req.body;
  if (!period_month || !period_year || !employee_ids?.length) {
    return res.status(400).json({ error: 'period_month, period_year and employee_ids are required' });
  }
  const info = db.prepare(`
    INSERT INTO payruns (period_month, period_year, structure_id, company, status) VALUES (?,?,?,?, 'Draft')
  `).run(period_month, period_year, structure_id || null, company || 'OXP Pvt Ltd');
  const payrunId = Number(info.lastInsertRowid);

  const insertSlip = db.prepare(`
    INSERT INTO payslips (payrun_id, employee_id, contract_id, gross, deductions, net, lines_json, status, warnings_json)
    VALUES (?, ?, ?, 0, 0, 0, '[]', 'Draft', '[]')
  `);
  for (const eid of employee_ids) {
    const contract = findRunningContract(eid, period_year, period_month);
    insertSlip.run(payrunId, eid, contract?.id || null);
  }
  res.status(201).json({ id: payrunId });
});

router.post('/payruns/:id/compute', requireRole('HR Payroll User'), (req: AuthRequest, res: express.Response) => {
  const run = db.prepare('SELECT * FROM payruns WHERE id = ?').get(req.params.id) as any;
  if (!run) return res.status(404).json({ error: 'Payrun not found' });

  const slips = db.prepare('SELECT * FROM payslips WHERE payrun_id = ?').all(run.id) as any[];
  const update = db.prepare(`
    UPDATE payslips SET gross=?, deductions=?, net=?, lines_json=?, warnings_json=?, status='Done', contract_id=? WHERE id = ?
  `);
  for (const slip of slips) {
    const result = computeEmployeePayslip(slip.employee_id, run.period_year, run.period_month, run.structure_id);
    update.run(
      result.gross, result.deductions, result.net, JSON.stringify(result.lines),
      JSON.stringify(result.warnings), result.contract?.id || null, slip.id
    );
  }
  db.prepare("UPDATE payruns SET status = 'Computed' WHERE id = ?").run(run.id);
  res.json({ ok: true, computed: slips.length });
});

router.post('/payruns/:id/validate', requireRole('HR Payroll User'), (req: AuthRequest, res: express.Response) => {
  const run = db.prepare('SELECT * FROM payruns WHERE id = ?').get(req.params.id) as any;
  if (!run) return res.status(404).json({ error: 'Payrun not found' });

  const slips = db.prepare(`
    SELECT p.*, e.name as employee_name FROM payslips p JOIN employees e ON e.id = p.employee_id WHERE p.payrun_id = ?
  `).all(run.id) as any[];

  let validCount = 0;
  const issues: Array<{ type: string; message: string }> = [];
  const seenEmployees = new Set<number>();

  for (const slip of slips) {
    const warnings = JSON.parse(slip.warnings_json || '[]');
    if (seenEmployees.has(slip.employee_id)) {
      issues.push({ type: 'duplicate', message: `Duplicate payslip for ${slip.employee_name}` });
    }
    seenEmployees.add(slip.employee_id);

    if (slip.status !== 'Done') {
      issues.push({ type: 'draft', message: `${slip.employee_name}'s payslip is still a draft (not computed)` });
    }
    for (const w of warnings) {
      issues.push({ type: w.includes('bank') ? 'bank' : 'contract', message: `${slip.employee_name}: ${w}` });
    }
    if (warnings.length === 0 && slip.status === 'Done') validCount++;
  }

  db.prepare("UPDATE payruns SET status = 'Validated' WHERE id = ?").run(run.id);
  res.json({ valid: validCount, total: slips.length, issues });
});

router.post('/payruns/:id/mark-paid', requireRole('HR Payroll Admin'), (req: AuthRequest, res: express.Response) => {
  db.prepare("UPDATE payslips SET status = 'Paid' WHERE payrun_id = ?").run(req.params.id);
  db.prepare("UPDATE payruns SET status = 'Paid' WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

router.post('/payruns/:id/send-payslips', requireRole('HR Payroll User'), (req: AuthRequest, res: express.Response) => {
  db.prepare("UPDATE payslips SET sent = 1 WHERE payrun_id = ?").run(req.params.id);
  res.json({ ok: true, message: 'Payslips marked as sent (demo mode — no external mail server configured)' });
});

router.get('/payslips/:id', (req: express.Request, res: express.Response) => {
  const slip = db.prepare(`
    SELECT p.*, e.name as employee_name, e.email, e.position, r.period_month, r.period_year
    FROM payslips p JOIN employees e ON e.id = p.employee_id JOIN payruns r ON r.id = p.payrun_id
    WHERE p.id = ?
  `).get(req.params.id) as any;
  if (!slip) return res.status(404).json({ error: 'Payslip not found' });
  res.json({ ...slip, lines: JSON.parse(slip.lines_json || '[]'), warnings: JSON.parse(slip.warnings_json || '[]') });
});

router.get('/payslips/:id/pdf', (req: express.Request, res: express.Response) => {
  const slip = db.prepare(`
    SELECT p.*, e.name as employee_name, e.position, r.period_month, r.period_year, r.company
    FROM payslips p JOIN employees e ON e.id = p.employee_id JOIN payruns r ON r.id = p.payrun_id
    WHERE p.id = ?
  `).get(req.params.id) as any;
  if (!slip) return res.status(404).json({ error: 'Payslip not found' });
  const lines = JSON.parse(slip.lines_json || '[]');
  const monthName = new Date(slip.period_year, slip.period_month - 1).toLocaleString('en-US', { month: 'long' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=payslip-${slip.employee_name.replace(/\s/g, '_')}-${monthName}-${slip.period_year}.pdf`);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);
  doc.fontSize(18).text(slip.company || 'PeoplePay360', { align: 'left' });
  doc.fontSize(11).fillColor('#555').text('Payslip', { align: 'left' });
  doc.moveDown();
  doc.fillColor('#000').fontSize(14).text(slip.employee_name);
  doc.fontSize(10).fillColor('#555').text(`${slip.position || ''}`);
  doc.text(`Period: ${monthName} ${slip.period_year}`);
  doc.moveDown();

  doc.fillColor('#000').fontSize(12).text('Earnings & Deductions', { underline: true });
  doc.moveDown(0.5);
  lines.forEach((l: any) => {
    const sign = l.category === 'Deduction' ? '-' : '';
    doc.fontSize(10).text(`${l.name}`, { continued: true, width: 300 });
    doc.text(`${sign}₹${Math.abs(l.amount).toLocaleString('en-IN')}`, { align: 'right' });
  });
  doc.moveDown();
  doc.fontSize(11).text(`Gross Salary: ₹${slip.gross.toLocaleString('en-IN')}`);
  doc.text(`Total Deductions: ₹${slip.deductions.toLocaleString('en-IN')}`);
  doc.fontSize(13).fillColor('#000').text(`Net Salary: ₹${slip.net.toLocaleString('en-IN')}`, { underline: true });
  doc.moveDown(2);
  doc.fontSize(8).fillColor('#888').text('This is a system-generated payslip from PeoplePay360.');
  doc.end();
});

export default router;
