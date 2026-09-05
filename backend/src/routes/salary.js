const express = require('express');
const db = require('../db');
const { authRequired, requireRole } = require('../auth');

const router = express.Router();
router.use(authRequired);

router.get('/structures', (req, res) => {
  const structures = db.prepare('SELECT * FROM salary_structures').all();
  res.json(structures.map(s => ({
    ...s,
    rules: db.prepare('SELECT * FROM salary_rules WHERE structure_id = ? ORDER BY sequence').all(s.id),
  })));
});

router.post('/structures', requireRole('HR Payroll Admin'), (req, res) => {
  const info = db.prepare('INSERT INTO salary_structures (name) VALUES (?)').run(req.body.name);
  res.status(201).json({ id: info.lastInsertRowid });
});

router.get('/rules', (req, res) => {
  const { structure_id } = req.query;
  if (structure_id) {
    return res.json(db.prepare('SELECT * FROM salary_rules WHERE structure_id = ? ORDER BY sequence').all(structure_id));
  }
  res.json(db.prepare('SELECT * FROM salary_rules ORDER BY structure_id, sequence').all());
});

router.post('/rules', requireRole('HR Payroll Admin'), (req, res) => {
  const b = req.body;
  if (!b.structure_id || !b.name || !b.compute_method) {
    return res.status(400).json({ error: 'structure_id, name, compute_method are required' });
  }
  const info = db.prepare(`
    INSERT INTO salary_rules (structure_id, name, category, compute_method, amount, percentage, percentage_of, formula_key, sequence)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(b.structure_id, b.name, b.category || 'Allowance', b.compute_method, b.amount || null,
         b.percentage || null, b.percentage_of || null, b.formula_key || null, b.sequence || 10);
  res.status(201).json({ id: info.lastInsertRowid });
});

router.put('/rules/:id', requireRole('HR Payroll Admin'), (req, res) => {
  const b = req.body;
  db.prepare(`
    UPDATE salary_rules SET name=COALESCE(?,name), category=COALESCE(?,category), compute_method=COALESCE(?,compute_method),
      amount=?, percentage=?, percentage_of=?, formula_key=?, sequence=COALESCE(?,sequence)
    WHERE id = ?
  `).run(b.name, b.category, b.compute_method, b.amount ?? null, b.percentage ?? null,
         b.percentage_of ?? null, b.formula_key ?? null, b.sequence, req.params.id);
  res.json({ ok: true });
});

router.delete('/rules/:id', requireRole('HR Payroll Admin'), (req, res) => {
  db.prepare('DELETE FROM salary_rules WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
