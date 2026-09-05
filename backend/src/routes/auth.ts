import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db';
import { signToken, authRequired, parseUserRoles, AuthRequest } from '../auth';

const router = express.Router();

router.post('/login', (req: express.Request, res: express.Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as any;
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  if (user.status !== 'Active') return res.status(403).json({ error: 'Account is inactive' });

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

  const employee = user.employee_id
    ? (db.prepare('SELECT * FROM employees WHERE id = ?').get(user.employee_id) as any)
    : null;

  const roles = parseUserRoles(user);
  const token = signToken({ ...user, roles });
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      roles,
      employee_id: user.employee_id,
      employee_name: employee?.name || null,
    },
  });
});

router.get('/me', authRequired, (req: AuthRequest, res: express.Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const user = db.prepare('SELECT id, email, role, employee_id FROM users WHERE id = ?').get(req.user.id) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });
  const employee = user.employee_id ? db.prepare('SELECT * FROM employees WHERE id = ?').get(user.employee_id) : null;
  const roles = parseUserRoles(user);
  res.json({
    id: user.id,
    email: user.email,
    roles,
    employee_id: user.employee_id,
    employee,
  });
});

export default router;
