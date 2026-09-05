import express from 'express';
import db from '../db';
import { authRequired, requireRole, AuthRequest } from '../auth';

const router = express.Router();
router.use(authRequired as any);

function nextRef(): string {
  const year = new Date().getFullYear();
  const count = (db.prepare("SELECT COUNT(*) c FROM contracts WHERE ref LIKE ?").get(`CON/${year}/%`) as any).c;
  return `CON/${year}/${String(count + 1).padStart(4, '0')}`;
}

router.get('/', (_req: express.Request, res: express.Response) => {
  res.json(db.prepare(`
    SELECT c.*, e.name as employee_name FROM contracts c
    JOIN employees e ON e.id = c.employee_id ORDER BY c.start_date DESC
  `).all());
});

router.get('/:id', (req: express.Request, res: express.Response) => {
  const c = db.prepare(`
    SELECT c.*, e.name as employee_name, s.name as structure_name, w.name as schedule_name
    FROM contracts c JOIN employees e ON e.id = c.employee_id
    LEFT JOIN salary_structures s ON s.id = c.salary_structure_id
    LEFT JOIN working_schedules w ON w.id = c.schedule_id
    WHERE c.id = ?
  `).get(req.params.id);
  if (!c) return res.status(404).json({ error: 'Contract not found' });
  res.json(c);
});

router.post('/', requireRole('HR Manager', 'HR Payroll User'), (req: AuthRequest, res: express.Response) => {
  const b = req.body;
  if (!b.employee_id || !b.start_date || !b.wage) {
    return res.status(400).json({ error: 'employee_id, start_date and wage are required' });
  }

  if ((b.status || 'Running') === 'Running') {
    const existing = db.prepare(`
      SELECT * FROM contracts WHERE employee_id = ? AND status = 'Running'
      AND (end_date IS NULL OR end_date >= ?)
    `).all(b.employee_id, b.start_date) as any[];
    if (existing.length) {
      const prevDay = new Date(b.start_date);
      prevDay.setDate(prevDay.getDate() - 1);
      const prevDayStr = prevDay.toISOString().slice(0, 10);
      for (const ex of existing) {
        db.prepare("UPDATE contracts SET status = 'Expired', end_date = ? WHERE id = ?").run(prevDayStr, ex.id);
      }
    }
  }

  const ref = nextRef();
  const info = db.prepare(`
    INSERT INTO contracts (ref, employee_id, start_date, end_date, wage, status, department, position, schedule_id, salary_structure_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    ref, b.employee_id, b.start_date, b.end_date || null, b.wage, b.status || 'Running',
    b.department || null, b.position || null, b.schedule_id || null, b.salary_structure_id || null
  );
  res.status(201).json({ id: Number(info.lastInsertRowid), ref });
});

router.put('/:id', requireRole('HR Manager', 'HR Payroll User'), (req: AuthRequest, res: express.Response) => {
  const b = req.body;
  db.prepare(`
    UPDATE contracts SET end_date=COALESCE(?,end_date), wage=COALESCE(?,wage), status=COALESCE(?,status),
      salary_structure_id=COALESCE(?,salary_structure_id) WHERE id = ?
  `).run(b.end_date, b.wage, b.status, b.salary_structure_id, req.params.id);
  res.json({ ok: true });
});

export default router;
