import express from 'express';
import db from '../db';
import { authRequired, requireRole, AuthRequest } from '../auth';

const router = express.Router();
router.use(authRequired as any);

function totalHours(scheduleJson: string): number {
  const days = JSON.parse(scheduleJson || '[]');
  return days.reduce((sum: number, d: any) => {
    const start = new Date(`2000-01-01T${d.start}`).getTime();
    const end = new Date(`2000-01-01T${d.end}`).getTime();
    const hrs = (end - start) / 3600000 - (d.breakHours || 0);
    return sum + hrs;
  }, 0);
}

router.get('/', (_req: express.Request, res: express.Response) => {
  const rows = db.prepare('SELECT * FROM working_schedules').all() as any[];
  res.json(rows.map(r => ({ ...r, total_hours: +totalHours(r.schedule_json).toFixed(1), days: JSON.parse(r.schedule_json || '[]') })));
});

router.get('/:id', (req: express.Request, res: express.Response) => {
  const r = db.prepare('SELECT * FROM working_schedules WHERE id = ?').get(req.params.id) as any;
  if (!r) return res.status(404).json({ error: 'Not found' });
  res.json({ ...r, total_hours: +totalHours(r.schedule_json).toFixed(1), days: JSON.parse(r.schedule_json || '[]') });
});

router.post('/', requireRole('HR Manager'), (req: AuthRequest, res: express.Response) => {
  const { name, company, days } = req.body;
  const info = db.prepare('INSERT INTO working_schedules (name, company, days_per_week, schedule_json) VALUES (?,?,?,?)')
    .run(name, company || 'My Company', (days || []).length, JSON.stringify(days || []));
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

export default router;
