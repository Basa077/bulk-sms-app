const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { sendSMS, scheduleSMS, getBalance } = require('../arkesel');
const { normalizePhone } = require('../utils');
const db = require('../database');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Get account balance
router.get('/balance', async (req, res) => {
  try {
    const data = await getBalance();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Decide if Arkesel's response means success
function arkeselOk(result) {
  if (!result) return false;
  const s = (result.status || result.code || '').toString().toLowerCase();
  return s === 'success' || s === 'ok';
}

// Send bulk SMS immediately
router.post('/send', async (req, res) => {
  const { name, message, recipients, sender_id } = req.body;
  if (!message || !recipients?.length) {
    return res.status(400).json({ error: 'Message and recipients are required' });
  }

  const cleanRecipients = [...new Set(recipients.map(normalizePhone).filter(Boolean))];
  if (!cleanRecipients.length) {
    return res.status(400).json({ error: 'No valid phone numbers after formatting' });
  }

  const campaignId = uuidv4();
  const sender = sender_id || process.env.ARKESEL_SENDER_ID;

  db.prepare(`
    INSERT INTO campaigns (id, name, message, sender_id, recipients, total_recipients, status, sent_at)
    VALUES (?, ?, ?, ?, ?, ?, 'sending', CURRENT_TIMESTAMP)
  `).run(campaignId, name || 'Campaign ' + campaignId.slice(0, 8), message, sender,
    JSON.stringify(cleanRecipients), cleanRecipients.length);

  try {
    const result = await sendSMS({ sender, message, recipients: cleanRecipients });
    const ok = arkeselOk(result);

    const logInsert = db.prepare(`
      INSERT INTO sms_logs (campaign_id, phone, message, sender_id, status, error_message)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const insertMany = db.transaction((phones) => {
      for (const phone of phones) {
        logInsert.run(campaignId, phone, message, sender, ok ? 'sent' : 'failed',
          ok ? null : JSON.stringify(result));
      }
    });
    insertMany(cleanRecipients);

    db.prepare(`UPDATE campaigns SET status=?, delivered=?, failed=? WHERE id=?`)
      .run(ok ? 'sent' : 'failed', ok ? cleanRecipients.length : 0,
        ok ? 0 : cleanRecipients.length, campaignId);

    res.json({ success: ok, campaignId, arkeselResponse: result });
  } catch (err) {
    const detail = err.response?.data || err.message;
    db.prepare(`UPDATE campaigns SET status='failed' WHERE id=?`).run(campaignId);
    res.status(500).json({ error: typeof detail === 'string' ? detail : JSON.stringify(detail), campaignId });
  }
});

// Schedule SMS for later
router.post('/schedule', async (req, res) => {
  const { name, message, recipients, sender_id, scheduled_at } = req.body;
  if (!message || !recipients?.length || !scheduled_at) {
    return res.status(400).json({ error: 'Message, recipients, and scheduled_at are required' });
  }

  const cleanRecipients = [...new Set(recipients.map(normalizePhone).filter(Boolean))];
  if (!cleanRecipients.length) {
    return res.status(400).json({ error: 'No valid phone numbers after formatting' });
  }

  const campaignId = uuidv4();
  const sender = sender_id || process.env.ARKESEL_SENDER_ID;

  db.prepare(`
    INSERT INTO campaigns (id, name, message, sender_id, recipients, total_recipients, status, scheduled_at)
    VALUES (?, ?, ?, ?, ?, ?, 'scheduled', ?)
  `).run(campaignId, name || 'Scheduled ' + campaignId.slice(0, 8), message, sender,
    JSON.stringify(cleanRecipients), cleanRecipients.length, scheduled_at);

  try {
    const formattedDate = new Date(scheduled_at).toISOString().replace('T', ' ').slice(0, 19);
    const result = await scheduleSMS({ sender, message, recipients: cleanRecipients, scheduledDate: formattedDate });
    res.json({ success: true, campaignId, arkeselResponse: result });
  } catch (err) {
    const detail = err.response?.data || err.message;
    db.prepare(`UPDATE campaigns SET status='schedule_failed' WHERE id=?`).run(campaignId);
    res.status(500).json({ error: typeof detail === 'string' ? detail : JSON.stringify(detail), campaignId });
  }
});

// Parse CSV upload and return extracted numbers
router.post('/parse-csv', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const content = req.file.buffer.toString('utf8');
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const phones = [];
  for (const line of lines) {
    for (const col of line.split(/[,;\t]/)) {
      const normalized = normalizePhone(col);
      if (normalized) phones.push(normalized);
    }
  }
  res.json({ phones: [...new Set(phones)], count: phones.length });
});

module.exports = router;
