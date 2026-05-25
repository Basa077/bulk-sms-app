const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const contacts = db.prepare(`
    SELECT c.*, g.name as group_name
    FROM contacts c
    LEFT JOIN groups g ON c.group_id = g.id
    ORDER BY c.created_at DESC
  `).all();
  res.json(contacts);
});

router.post('/', (req, res) => {
  const { name, phone, email, group_id } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required' });
  const clean = phone.trim().replace(/\s/g, '').replace(/^\+/, '');
  try {
    const result = db.prepare(
      'INSERT INTO contacts (name, phone, email, group_id) VALUES (?, ?, ?, ?)'
    ).run(name, clean, email || null, group_id || null);
    res.json({ id: result.lastInsertRowid, name, phone: clean, email, group_id });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Phone number already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', (req, res) => {
  const { name, phone, email, group_id } = req.body;
  const clean = phone ? phone.trim().replace(/\s/g, '').replace(/^\+/, '') : undefined;
  try {
    db.prepare(`
      UPDATE contacts SET name=COALESCE(?,name), phone=COALESCE(?,phone),
      email=COALESCE(?,email), group_id=? WHERE id=?
    `).run(name || null, clean || null, email || null, group_id || null, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM contacts WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// Bulk import contacts from array
router.post('/bulk-import', (req, res) => {
  const { contacts } = req.body;
  if (!Array.isArray(contacts)) return res.status(400).json({ error: 'contacts array required' });
  const insert = db.prepare('INSERT OR IGNORE INTO contacts (name, phone, email, group_id) VALUES (?, ?, ?, ?)');
  const importAll = db.transaction((list) => {
    let imported = 0;
    for (const c of list) {
      const clean = (c.phone || '').trim().replace(/\s/g, '').replace(/^\+/, '');
      if (clean) { insert.run(c.name || clean, clean, c.email || null, c.group_id || null); imported++; }
    }
    return imported;
  });
  const count = importAll(contacts);
  res.json({ imported: count });
});

module.exports = router;
