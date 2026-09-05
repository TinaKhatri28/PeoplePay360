const express = require('express');
const db = require('../db');
const { authRequired, requireRole } = require('../auth');

const router = express.Router();
router.use(authRequired);

function totalHours(scheduleJson) {
  const days = JSON.parse(scheduleJson || '[]');
  return days.reduce((sum, d) => {
    const start = new Date(`2000-01-01T${d.start}`);
    const end = new Date(`2000-01-01T${d.end}`);
    const hrs = (end - start) / 3600000 - (d.breakHours || 0);
    return sum + hrs;
  }, 0);
}

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM working_schedules').all();
  res.json(rows.map(r => ({ ...r, total_hours: +totalHours(r.schedule_json).toFixed(1), days: JSON.parse(r.schedule_json || '[]') })));
});

router.get('/:id', (req, res) => {
  const r = db.prepare('SELECT * FROM working_schedules WHERE id = ?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  res.json({ ...r, total_hours: +totalHours(r.schedule_json).toFixed(1), days: JSON.parse(r.schedule_json || '[]') });
});

router.post('/', requireRole('HR Manager'), (req, res) => {
  const { name, company, days } = req.body;
  const info = db.prepare('INSERT INTO working_schedules (name, company, days_per_week, schedule_json) VALUES (?,?,?,?)')
    .run(name, company || 'My Company', (days || []).length, JSON.stringify(days || []));
  res.status(201).json({ id: info.lastInsertRowid });
});

module.exports = router;
