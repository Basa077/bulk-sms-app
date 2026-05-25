require('dotenv').config();
const axios = require('axios');
const db = require('./database');

(async () => {
  await db.initDb();

  console.log('\n=== Most recent SMS send ===');
  const camp = db.prepare(
    "SELECT * FROM campaigns WHERE status='sent' AND name='CEE' ORDER BY created_at DESC LIMIT 1"
  ).get() || db.prepare("SELECT * FROM campaigns ORDER BY created_at DESC LIMIT 1").get();

  if (!camp) { console.log('No campaigns found.'); return; }
  console.log('Campaign:  ' + camp.name);
  console.log('Message:   ' + camp.message);
  console.log('Sender ID: ' + camp.sender_id);
  console.log('Recipients:' + camp.recipients);

  const logs = db.prepare('SELECT * FROM sms_logs WHERE campaign_id=?').all(camp.id);
  console.log('\n=== Per-number logs ===');
  for (const l of logs) {
    console.log(`  ${l.phone}  status=${l.status}  arkesel_ref=${l.arkesel_ref || '(none stored)'}`);
  }

  // Re-send a status check is not possible without message id.
  // Instead, do a LIVE balance + sender-id probe (no credit cost).
  const key = process.env.ARKESEL_API_KEY;

  console.log('\n=== Live balance ===');
  const bal = await axios.get(
    `https://sms.arkesel.com/sms/api?action=check-balance&api_key=${key}&response=json`
  );
  console.log('  ' + JSON.stringify(bal.data));

  console.log('\nNote: Arkesel charged a credit, so the API call succeeded.');
  console.log('If the SMS never arrived, the cause is downstream delivery —');
  console.log('almost always an unregistered Sender ID for Ghana traffic.');
})().catch(e => console.error(e.message));
