import express from 'express';
import db from '../db';
import { authRequired, AuthRequest } from '../auth';

const router = express.Router();
router.use(authRequired as any);

function hoursBetween(inTime: string, outTime: string): number {
  return +(((new Date(outTime).getTime() - new Date(inTime).getTime()) / 3600000)).toFixed(2);
}

router.get('/', (_req: express.Request, res: express.Response) => {
  res.json(db.prepare(`
    SELECT a.*, e.name as employee_name FROM attendance a
    JOIN employees e ON e.id = a.employee_id ORDER BY a.date DESC, a.id DESC
  `).all());
});

router.get('/me/status', (req: AuthRequest, res: express.Response) => {
  const employeeId = req.user?.employee_id;
  if (!employeeId) return res.status(400).json({ error: 'No employee linked to this account' });
  const today = new Date().toISOString().slice(0, 10);
  const row = db.prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?').get(employeeId, today) as any;
  if (!row) return res.json({ checkedIn: false, record: null });
  res.json({ checkedIn: !row.check_out, record: row });
});

router.post('/check-in', (req: AuthRequest, res: express.Response) => {
  const employeeId = req.body.employee_id || req.user?.employee_id;
  if (!employeeId) return res.status(400).json({ error: 'employee_id required' });
  const today = new Date().toISOString().slice(0, 10);
  const existing = db.prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?').get(employeeId, today) as any;
  if (existing && !existing.check_out) return res.status(400).json({ error: 'Already checked in today' });
  const now = new Date().toISOString();
  if (existing) {
    return res.status(400).json({ error: 'Attendance already recorded for today' });
  }
  const info = db.prepare(`
    INSERT INTO attendance (employee_id, date, check_in, status) VALUES (?, ?, ?, 'Present')
  `).run(employeeId, today, now);
  res.status(201).json({ id: Number(info.lastInsertRowid), check_in: now });
});

router.post('/check-out', (req: AuthRequest, res: express.Response) => {
  const employeeId = req.body.employee_id || req.user?.employee_id;
  const today = new Date().toISOString().slice(0, 10);
  const row = db.prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?').get(employeeId, today) as any;
  if (!row || row.check_out) return res.status(400).json({ error: 'No active check-in found' });
  const now = new Date().toISOString();
  const worked = hoursBetween(row.check_in, now);
  const overtime = worked > 8 ? +(worked - 8).toFixed(2) : 0;
  db.prepare('UPDATE attendance SET check_out = ?, worked_hours = ?, overtime_hours = ? WHERE id = ?')
    .run(now, worked, overtime, row.id);
  res.json({ ok: true, worked_hours: worked, overtime_hours: overtime });
});

router.put('/:id', (req: express.Request, res: express.Response) => {
  const { check_in, check_out, status, notes } = req.body;
  const row = db.prepare('SELECT * FROM attendance WHERE id = ?').get(req.params.id) as any;
  if (!row) return res.status(404).json({ error: 'Record not found' });
  const ci = check_in || row.check_in;
  const co = check_out || row.check_out;
  let worked = row.worked_hours, overtime = row.overtime_hours;
  if (ci && co) {
    worked = hoursBetween(ci, co);
    overtime = worked > 8 ? +(worked - 8).toFixed(2) : 0;
  }
  db.prepare(`
    UPDATE attendance SET check_in=?, check_out=?, worked_hours=?, overtime_hours=?, status=COALESCE(?,status), notes=COALESCE(?,notes)
    WHERE id = ?
  `).run(ci, co, worked, overtime, status, notes, req.params.id);
  res.json({ ok: true });
});

export default router;
