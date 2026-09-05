const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authRequired, requireRole } = require('../auth');

const router = express.Router();
router.use(authRequired);

router.get('/', requireRole('HR Manager'), (req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.email, u.roles, u.status, e.name as employee_name
    FROM users u LEFT JOIN employees e ON e.id = u.employee_id
    ORDER BY u.id DESC
  `).all();
  res.json(rows.map(r => ({ ...r, roles: r.roles.split(',') })));
});

router.post('/', requireRole('HR Payroll Admin'), (req, res) => {
  const { employee_id, email, password, roles, status } = req.body;
  if (!email || !password || !roles?.length) return res.status(400).json({ error: 'Email, password and at least one role are required' });

  // Prevent self-escalation: a non-admin cannot grant Payroll Admin
  const actingRoles = req.user.rolesArr;
  if (roles.includes('HR Payroll Admin') && !actingRoles.includes('HR Payroll Admin')) {
    return res.status(403).json({ error: 'You cannot grant a role higher than your own' });
  }

  const hash = bcrypt.hashSync(password, 10);
  try {
    const info = db.prepare(`
      INSERT INTO users (employee_id, email, password_hash, roles, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(employee_id || null, email.toLowerCase(), hash, roles.join(','), status || 'Active');
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: 'Email already exists or invalid data' });
  }
});

router.put('/:id', requireRole('HR Payroll Admin'), (req, res) => {
  const { roles, status } = req.body;
  const actingRoles = req.user.rolesArr;
  if (roles?.includes('HR Payroll Admin') && !actingRoles.includes('HR Payroll Admin')) {
    return res.status(403).json({ error: 'You cannot grant a role higher than your own' });
  }
  db.prepare('UPDATE users SET roles = COALESCE(?, roles), status = COALESCE(?, status) WHERE id = ?')
    .run(roles ? roles.join(',') : null, status || null, req.params.id);
  res.json({ ok: true });
});

module.exports = router;
