const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken, authRequired } = require('../auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  if (user.status !== 'Active') return res.status(403).json({ error: 'Account is inactive' });

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

  const employee = user.employee_id
    ? db.prepare('SELECT * FROM employees WHERE id = ?').get(user.employee_id)
    : null;

  const token = signToken(user);
  res.json({
    token,
    user: {
      id: user.id, email: user.email, roles: user.roles.split(','),
      employee_id: user.employee_id, employee_name: employee?.name || null,
    },
  });
});

router.get('/me', authRequired, (req, res) => {
  const user = db.prepare('SELECT id, email, roles, employee_id FROM users WHERE id = ?').get(req.user.id);
  const employee = user.employee_id ? db.prepare('SELECT * FROM employees WHERE id = ?').get(user.employee_id) : null;
  res.json({ ...user, roles: user.roles.split(','), employee });
});

module.exports = router;
