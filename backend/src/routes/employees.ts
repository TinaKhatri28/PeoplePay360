import express from 'express';
import db from '../db';
import { authRequired, requireRole, AuthRequest } from '../auth';

const router = express.Router();
router.use(authRequired as any);

function initials(name: string): string {
  return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

router.get('/', (req: express.Request, res: express.Response) => {
  const search = req.query.search as string | undefined;
  let rows: any[];
  if (search) {
    rows = db.prepare(`
      SELECT e.*, d.name as department_name, w.name as schedule_name
      FROM employees e LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN working_schedules w ON w.id = e.schedule_id
      WHERE e.name LIKE ? OR e.email LIKE ? OR e.position LIKE ?
      ORDER BY e.name
    `).all(`%${search}%`, `%${search}%`, `%${search}%`) as any[];
  } else {
    rows = db.prepare(`
      SELECT e.*, d.name as department_name, w.name as schedule_name
      FROM employees e LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN working_schedules w ON w.id = e.schedule_id
      ORDER BY e.name
    `).all() as any[];
  }
  res.json(rows);
});

router.get('/meta/departments', (_req: express.Request, res: express.Response) => {
  res.json(db.prepare('SELECT * FROM departments ORDER BY name').all());
});

router.get('/:id', (req: express.Request, res: express.Response) => {
  const emp = db.prepare(`
    SELECT e.*, d.name as department_name, w.name as schedule_name, m.name as manager_name
    FROM employees e LEFT JOIN departments d ON d.id = e.department_id
    LEFT JOIN working_schedules w ON w.id = e.schedule_id
    LEFT JOIN employees m ON m.id = e.manager_id
    WHERE e.id = ?
  `).get(req.params.id) as any;
  if (!emp) return res.status(404).json({ error: 'Employee not found' });

  const contractsCount = (db.prepare('SELECT COUNT(*) c FROM contracts WHERE employee_id = ?').get(emp.id) as any).c;
  const attendanceCount = (db.prepare('SELECT COUNT(*) c FROM attendance WHERE employee_id = ?').get(emp.id) as any).c;
  const timeOffCount = (db.prepare('SELECT COUNT(*) c FROM time_off_requests WHERE employee_id = ?').get(emp.id) as any).c;
  const allocCount = (db.prepare('SELECT COUNT(*) c FROM time_off_allocations WHERE employee_id = ?').get(emp.id) as any).c;

  res.json({ ...emp, counts: { contracts: contractsCount, attendance: attendanceCount, time_off: timeOffCount, allocations: allocCount } });
});

router.post('/', requireRole('HR Manager'), (req: AuthRequest, res: express.Response) => {
  const b = req.body;
  if (!b.name || !b.email) return res.status(400).json({ error: 'Name and email are required' });
  const info = db.prepare(`
    INSERT INTO employees (name, email, phone, position, department_id, manager_id, schedule_id, company, work_location, bank_account, status, avatar_initials)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    b.name, b.email, b.phone || null, b.position || null, b.department_id || null, b.manager_id || null,
    b.schedule_id || null, b.company || 'OXP Pvt Ltd', b.work_location || null, b.bank_account || null,
    b.status || 'Active', initials(b.name)
  );
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

router.put('/:id', requireRole('HR Manager'), (req: AuthRequest, res: express.Response) => {
  const b = req.body;
  db.prepare(`
    UPDATE employees SET name=COALESCE(?,name), email=COALESCE(?,email), phone=COALESCE(?,phone),
      position=COALESCE(?,position), department_id=COALESCE(?,department_id), manager_id=COALESCE(?,manager_id),
      schedule_id=COALESCE(?,schedule_id), work_location=COALESCE(?,work_location),
      bank_account=COALESCE(?,bank_account), status=COALESCE(?,status)
    WHERE id = ?
  `).run(
    b.name, b.email, b.phone, b.position, b.department_id, b.manager_id, b.schedule_id,
    b.work_location, b.bank_account, b.status, req.params.id
  );
  res.json({ ok: true });
});

router.get('/:id/contracts', (req: express.Request, res: express.Response) => {
  res.json(db.prepare('SELECT * FROM contracts WHERE employee_id = ? ORDER BY start_date DESC').all(req.params.id));
});

router.get('/:id/attendance', (req: express.Request, res: express.Response) => {
  res.json(db.prepare('SELECT * FROM attendance WHERE employee_id = ? ORDER BY date DESC').all(req.params.id));
});

router.get('/:id/time-off', (req: express.Request, res: express.Response) => {
  res.json(db.prepare(`
    SELECT r.*, t.name as type_name FROM time_off_requests r
    JOIN time_off_types t ON t.id = r.type_id WHERE r.employee_id = ? ORDER BY r.start_date DESC
  `).all(req.params.id));
});

router.get('/:id/allocations', (req: express.Request, res: express.Response) => {
  res.json(db.prepare(`
    SELECT a.*, t.name as type_name, t.unit FROM time_off_allocations a
    JOIN time_off_types t ON t.id = a.type_id WHERE a.employee_id = ?
  `).all(req.params.id));
});

router.get('/:id/payslips', (req: express.Request, res: express.Response) => {
  res.json(db.prepare(`
    SELECT p.*, r.period_month, r.period_year, r.company
    FROM payslips p JOIN payruns r ON r.id = p.payrun_id
    WHERE p.employee_id = ? ORDER BY r.period_year DESC, r.period_month DESC
  `).all(req.params.id));
});

export default router;
