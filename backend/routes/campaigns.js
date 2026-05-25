const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const campaigns = db.prepare(`
    SELECT * FROM campaigns ORDER BY created_at DESC LIMIT 100
  `).all();
  res.json(campaigns.map(c => ({ ...c, recipients: JSON.parse(c.recipients || '[]') })));
});

router.get('/:id', (req, res) => {
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id=?').get(req.params.id);
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  const logs = db.prepare('SELECT * FROM sms_logs WHERE campaign_id=? ORDER BY sent_at DESC').all(req.params.id);
  res.json({ ...campaign, recipients: JSON.parse(campaign.recipients || '[]'), logs });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM sms_logs WHERE campaign_id=?').run(req.params.id);
  db.prepare('DELETE FROM campaigns WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

// Dashboard stats
router.get('/stats/overview', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM campaigns').get();
  const sent = db.prepare("SELECT COUNT(*) as count FROM campaigns WHERE status='sent'").get();
  const scheduled = db.prepare("SELECT COUNT(*) as count FROM campaigns WHERE status='scheduled'").get();
  const totalMessages = db.prepare('SELECT SUM(total_recipients) as count FROM campaigns').get();
  const delivered = db.prepare('SELECT SUM(delivered) as count FROM campaigns').get();
  const recentCampaigns = db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC LIMIT 5').all();
  res.json({
    total: total.count,
    sent: sent.count,
    scheduled: scheduled.count,
    totalMessages: totalMessages.count || 0,
    delivered: delivered.count || 0,
    recentCampaigns: recentCampaigns.map(c => ({ ...c, recipients: JSON.parse(c.recipients || '[]') })),
  });
});

module.exports = router;
