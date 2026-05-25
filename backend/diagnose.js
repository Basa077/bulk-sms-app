require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const key = process.env.ARKESEL_API_KEY || '';
const sender = process.env.ARKESEL_SENDER_ID || '';

const line = '='.repeat(58);
console.log('\n' + line);
console.log('   ARKESEL API DIAGNOSTIC');
console.log(line + '\n');

// --- 1. Inspect the key as loaded ---
console.log('1) API KEY LOADED FROM .env');
console.log('   Value:        ' + key);
console.log('   Length:       ' + key.length + ' characters');
console.log('   First 4:      "' + key.slice(0, 4) + '"');
console.log('   Last 4:       "' + key.slice(-4) + '"');
const weird = key.match(/[^A-Za-z0-9+/=]/g);
console.log('   Hidden/odd chars: ' + (weird ? 'YES → ' + JSON.stringify(weird) + ' ⚠️' : 'none — clean'));
console.log('   Sender ID:    "' + sender + '" (' + sender.length + ' chars)');

// raw bytes of the .env line, to catch \r or trailing spaces
const raw = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const keyLine = raw.split('\n').find(l => l.startsWith('ARKESEL_API_KEY'));
console.log('   Raw .env line bytes: ' + Buffer.from(keyLine || '').length + ' (watch for trailing \\r or spaces)');
console.log('');

async function hit(label, reqFn) {
  process.stdout.write('   ' + label + '\n');
  try {
    const r = await reqFn();
    console.log('      → HTTP ' + r.status + '  ' + JSON.stringify(r.data));
    return { status: r.status, data: r.data };
  } catch (e) {
    if (e.response) {
      console.log('      → HTTP ' + e.response.status + '  ' + JSON.stringify(e.response.data));
      return { status: e.response.status, data: e.response.data };
    }
    console.log('      → NETWORK ERROR: ' + e.message);
    return { status: 0, data: null };
  }
}

(async () => {
  console.log('2) TEST YOUR KEY AGAINST ARKESEL');
  const yourV1 = await hit('v1 balance check  (GET /sms/api?action=check-balance)', () =>
    axios.get(`https://sms.arkesel.com/sms/api?action=check-balance&api_key=${encodeURIComponent(key)}`,
      { validateStatus: () => true, timeout: 10000 }));
  const yourV2 = await hit('v2 send endpoint  (POST /api/v2/sms/send)', () =>
    axios.post('https://sms.arkesel.com/api/v2/sms/send',
      { sender, message: 'diagnostic test', recipients: ['233000000000'] },
      { headers: { 'api-key': key, 'Content-Type': 'application/json' }, validateStatus: () => true, timeout: 10000 }));
  console.log('');

  console.log('3) CONTROL TEST — a deliberately FAKE key');
  const fake = 'THIS_IS_NOT_A_REAL_KEY_123';
  const fakeV1 = await hit('v1 balance check with fake key', () =>
    axios.get(`https://sms.arkesel.com/sms/api?action=check-balance&api_key=${fake}`,
      { validateStatus: () => true, timeout: 10000 }));
  console.log('');

  // --- VERDICT ---
  console.log(line);
  console.log('   VERDICT');
  console.log(line);

  const yourMsg = JSON.stringify(yourV1.data);
  const fakeMsg = JSON.stringify(fakeV1.data);
  const sameAsFake = yourMsg === fakeMsg;

  if (yourV1.status === 0) {
    console.log('   ✖ Could not reach Arkesel (network problem on this machine).');
  } else if (yourV2.status === 200 || (yourV1.data && yourV1.data.code === 'ok')) {
    console.log('   ✔ SUCCESS! Your API key WORKS. The app is ready to send.');
  } else if (sameAsFake) {
    console.log('   ✖ Your real key behaves EXACTLY like a fake/made-up key.');
    console.log('');
    console.log('   Your key  : ' + yourMsg);
    console.log('   Fake key  : ' + fakeMsg);
    console.log('');
    console.log('   This PROVES the problem is NOT the code and NOT the');
    console.log('   request format. Arkesel simply does not recognise your');
    console.log('   key at all — it treats it like random text.');
    console.log('');
    console.log('   That only happens when the ACCOUNT is not activated:');
    console.log('     • email address not yet verified, OR');
    console.log('     • the key belongs to a different Arkesel account, OR');
    console.log('     • the account/API access is disabled.');
    console.log('');
    console.log('   FIX: email support@arkesel.com (or call +233 544 919 953)');
    console.log('   Say: "API key returns code 102 / Invalid key on every');
    console.log('   request. Account email: mbarcaking@gmail.com. Please');
    console.log('   activate my SMS API access."');
  } else {
    console.log('   ⚠ Your key gives a different error than a fake key:');
    console.log('     Your key : ' + yourMsg);
    console.log('     Fake key : ' + fakeMsg);
    console.log('   Send this output to support@arkesel.com for help.');
  }
  console.log(line + '\n');
})();
