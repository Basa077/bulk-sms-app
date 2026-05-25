const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const groups = db.prepare(`
    SELECT g.*, COUNT(c.id) as contact_count
    FROM groups g
    LEFT JOIN contacts c ON c.group_id = g.id
    GROUP BY g.id ORDER BY g.created_at DESC
  `).all();
  res.json(groups);
});

router.post('/', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Group name is required' });
  try {
    const result = db.prepare('INSERT INTO groups (name, description) VALUES (?, ?)').run(name, description || null);
    res.json({ id: result.lastInsertRowid, name, description });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Group name already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, description } = req.body;
  db.prepare('UPDATE groups SET name=COALESCE(?,name), description=COALESCE(?,description) WHERE id=?')
    .run(name || null, description || null, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('UPDATE contacts SET group_id=NULL WHERE group_id=?').run(req.params.id);
  db.prepare('DELETE FROM groups WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// Get all phone numbers for a group
router.get('/:id/phones', (req, res) => {
  const contacts = db.prepare('SELECT phone, name FROM contacts WHERE group_id=?').all(req.params.id);
  res.json(contacts);
});

module.exports = router;
