require('dotenv').config();
const db = require('./database');
const { v4: uuid } = require('uuid');

async function seed() {
  await db.initDb();

  // Groups
  db.prepare("INSERT OR IGNORE INTO groups (name, description) VALUES (?, ?)").run('VIP Customers', 'Top-tier loyal customers');
  db.prepare("INSERT OR IGNORE INTO groups (name, description) VALUES (?, ?)").run('New Subscribers', 'Joined in the last 30 days');
  db.prepare("INSERT OR IGNORE INTO groups (name, description) VALUES (?, ?)").run('Promo List', 'Opted in for promotional messages');

  const groupIds = db.prepare("SELECT id FROM groups LIMIT 3").all().map(r => r.id);

  // Contacts
  const contacts = [
    { name: 'Kwame Asante',    phone: '233244100001', email: 'kwame@demo.com',  gid: groupIds[0] },
    { name: 'Ama Boateng',     phone: '233501200002', email: 'ama@demo.com',    gid: groupIds[0] },
    { name: 'Kofi Mensah',     phone: '233209300003', email: 'kofi@demo.com',   gid: groupIds[1] },
    { name: 'Abena Owusu',     phone: '233244400004', email: 'abena@demo.com',  gid: groupIds[1] },
    { name: 'Yaw Darko',       phone: '233277500005', email: 'yaw@demo.com',    gid: groupIds[2] },
    { name: 'Efua Sarpong',    phone: '233200600006', email: 'efua@demo.com',   gid: groupIds[2] },
    { name: 'Nana Acheampong', phone: '233540700007', email: null,              gid: groupIds[0] },
    { name: 'Adjoa Asare',     phone: '233246800008', email: null,              gid: groupIds[2] },
  ];
  const ins = db.prepare("INSERT OR IGNORE INTO contacts (name, phone, email, group_id) VALUES (?, ?, ?, ?)");
  for (const c of contacts) ins.run(c.name, c.phone, c.email, c.gid);

  // Campaigns
  const campaigns = [
    { name: 'June Promo Blast',   msg: 'Hi! Get 20% off all products this week. Use code JUNE20. Shop now!',         status: 'sent',      total: 150, delivered: 143, failed: 7 },
    { name: 'Welcome New Subs',   msg: 'Welcome to our family! Enjoy your first purchase with FREE shipping.',       status: 'sent',      total: 42,  delivered: 42,  failed: 0 },
    { name: 'Flash Sale Alert',   msg: 'FLASH SALE! 50% off for the next 3 hours only. Hurry!',                      status: 'sent',      total: 320, delivered: 308, failed: 12 },
    { name: 'VIP Loyalty Reward', msg: 'Dear VIP, your exclusive reward is ready. Visit us to claim it today.',     status: 'scheduled', total: 87,  delivered: 0,   failed: 0 },
    { name: 'Payment Reminder',   msg: 'Friendly reminder: your invoice #4521 is due tomorrow.',                    status: 'sent',      total: 25,  delivered: 24,  failed: 1 },
  ];
  const insC = db.prepare("INSERT OR IGNORE INTO campaigns (id, name, message, sender_id, recipients, total_recipients, delivered, failed, status, sent_at, scheduled_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  for (const c of campaigns) {
    const id = uuid();
    const phones = Array.from({ length: Math.min(c.total, 10) }, (_, i) => `23324${String(i).padStart(7, '0')}`);
    const sentAt = c.status === 'sent' ? new Date(Date.now() - Math.random() * 7 * 86400000).toISOString() : null;
    const schedAt = c.status === 'scheduled' ? new Date(Date.now() + 2 * 86400000).toISOString() : null;
    insC.run(id, c.name, c.msg, 'MyBrand', JSON.stringify(phones), c.total, c.delivered, c.failed, c.status, sentAt, schedAt);
    if (c.status === 'sent') {
      const logIns = db.prepare("INSERT INTO sms_logs (campaign_id, phone, message, sender_id, status) VALUES (?, ?, ?, ?, ?)");
      const insertAll = db.transaction((ps) => {
        for (const p of ps) logIns.run(id, p, c.msg, 'MyBrand', Math.random() > 0.08 ? 'sent' : 'failed');
      });
      insertAll(phones);
    }
  }
  console.log('Demo data seeded!');
}

seed().catch(console.error);
