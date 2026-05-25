const express = require('express');
const router = express.Router();
const db = require('../database');

// Arkesel delivery report webhook
router.post('/delivery', (req, res) => {
  const { message_id, phone, status } = req.body;
  if (message_id && phone) {
    db.prepare('INSERT INTO delivery_reports (arkesel_ref, phone, status) VALUES (?, ?, ?)')
      .run(message_id, phone, status || 'unknown');
    // Update sms_logs if we have a match
    db.prepare("UPDATE sms_logs SET status=? WHERE arkesel_ref=? AND phone=?")
      .run(status, message_id, phone);
  }
  res.json({ received: true });
});

router.get('/delivery', (req, res) => {
  const reports = db.prepare('SELECT * FROM delivery_reports ORDER BY timestamp DESC LIMIT 200').all();
  res.json(reports);
});

module.exports = router;
