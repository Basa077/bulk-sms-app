require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { sendSMS } = require('./arkesel');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/sms', require('./routes/sms'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/webhooks', require('./routes/webhooks'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Scheduled SMS processor — runs every minute
cron.schedule('* * * * *', async () => {
  const now = new Date().toISOString();
  const due = db.prepare(`
    SELECT * FROM campaigns
    WHERE status='scheduled' AND scheduled_at <= ?
  `).all(now);

  for (const campaign of due) {
    const recipients = JSON.parse(campaign.recipients || '[]');
    try {
      await sendSMS({ sender: campaign.sender_id, message: campaign.message, recipients });
      db.prepare("UPDATE campaigns SET status='sent', sent_at=CURRENT_TIMESTAMP, delivered=? WHERE id=?")
        .run(recipients.length, campaign.id);
      const logInsert = db.prepare(
        'INSERT INTO sms_logs (campaign_id, phone, message, sender_id, status) VALUES (?, ?, ?, ?, ?)'
      );
      const insertAll = db.transaction((phones) => {
        for (const phone of phones) logInsert.run(campaign.id, phone, campaign.message, campaign.sender_id, 'sent');
      });
      insertAll(recipients);
    } catch (err) {
      db.prepare("UPDATE campaigns SET status='failed' WHERE id=?").run(campaign.id);
    }
  }
});

const PORT = process.env.PORT || 5000;
db.initDb().then(() => {
  app.listen(PORT, () => console.log(`\n  Backend ready → http://localhost:${PORT}\n`));
}).catch(err => { console.error('DB init failed:', err); process.exit(1); });
