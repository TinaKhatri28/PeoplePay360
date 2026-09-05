import express from 'express';
import db from '../db';
import { authRequired, requireRole, AuthRequest } from '../auth';

const router = express.Router();
router.use(authRequired as any);

// ---- Types ----
router.get('/types', (_req: express.Request, res: express.Response) => res.json(db.prepare('SELECT * FROM time_off_types').all()));

router.post('/types', requireRole('HR Manager'), (req: AuthRequest, res: express.Response) => {
  const { name, unit, allocation_required, approval_role } = req.body;
  const info = db.prepare('INSERT INTO time_off_types (name, unit, allocation_required, approval_role) VALUES (?,?,?,?)')
    .run(name, unit || 'Days', allocation_required ? 1 : 0, approval_role || 'Manager');
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

// ---- Allocations ----
router.get('/allocations', (_req: express.Request, res: express.Response) => {
  res.json(db.prepare(`
    SELECT a.*, e.name as employee_name, t.name as type_name, t.unit
    FROM time_off_allocations a JOIN employees e ON e.id = a.employee_id
    JOIN time_off_types t ON t.id = a.type_id
  `).all());
});

router.post('/allocations', requireRole('HR Manager'), (req: AuthRequest, res: express.Response) => {
  const { employee_id, type_id, allocated, approver_id } = req.body;
  if (!employee_id || !type_id || allocated == null) return res.status(400).json({ error: 'employee_id, type_id, allocated required' });
  const info = db.prepare(`
    INSERT INTO time_off_allocations (employee_id, type_id, allocated, taken, status, approver_id)
    VALUES (?, ?, ?, 0, 'Approved', ?)
  `).run(employee_id, type_id, allocated, approver_id || null);
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

// ---- Requests ----
router.get('/requests', (_req: express.Request, res: express.Response) => {
  res.json(db.prepare(`
    SELECT r.*, e.name as employee_name, t.name as type_name, t.unit
    FROM time_off_requests r JOIN employees e ON e.id = r.employee_id
    JOIN time_off_types t ON t.id = r.type_id ORDER BY r.created_at DESC
  `).all());
});

router.post('/requests', (req: AuthRequest, res: express.Response) => {
  const { employee_id, type_id, start_date, end_date, reason } = req.body;
  const eid = employee_id || req.user?.employee_id;
  if (!eid || !type_id || !start_date || !end_date) return res.status(400).json({ error: 'Missing required fields' });

  const days = Math.round((new Date(end_date).getTime() - new Date(start_date).getTime()) / 86400000) + 1;
  const alloc = db.prepare('SELECT * FROM time_off_allocations WHERE employee_id = ? AND type_id = ?').get(eid, type_id) as any;
  const type = db.prepare('SELECT * FROM time_off_types WHERE id = ?').get(type_id) as any;
  if (type?.allocation_required && alloc) {
    const remaining = alloc.allocated - alloc.taken;
    if (days > remaining) return res.status(400).json({ error: `Insufficient balance: ${remaining} remaining, requested ${days}` });
  }

  const info = db.prepare(`
    INSERT INTO time_off_requests (employee_id, type_id, start_date, end_date, duration, reason, status)
    VALUES (?, ?, ?, ?, ?, ?, 'To Approve')
  `).run(eid, type_id, start_date, end_date, days, reason || null);
  res.status(201).json({ id: Number(info.lastInsertRowid), duration: days });
});

router.post('/requests/:id/approve', requireRole('HR Manager'), (req: AuthRequest, res: express.Response) => {
  const request = db.prepare('SELECT * FROM time_off_requests WHERE id = ?').get(req.params.id) as any;
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (request.status !== 'To Approve') return res.status(400).json({ error: 'Request already processed' });

  db.prepare("UPDATE time_off_requests SET status = 'Approved' WHERE id = ?").run(request.id);

  const alloc = db.prepare('SELECT * FROM time_off_allocations WHERE employee_id = ? AND type_id = ?')
    .get(request.employee_id, request.type_id) as any;
  if (alloc) {
    db.prepare('UPDATE time_off_allocations SET taken = taken + ? WHERE id = ?').run(request.duration, alloc.id);
  }
  res.json({ ok: true });
});

router.post('/requests/:id/refuse', requireRole('HR Manager'), (req: AuthRequest, res: express.Response) => {
  db.prepare("UPDATE time_off_requests SET status = 'Refused' WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

export default router;
