const axios = require('axios');

const V2 = 'https://sms.arkesel.com/api/v2';
const V1 = 'https://sms.arkesel.com/sms/api';

function key() { return process.env.ARKESEL_API_KEY; }
function headers() {
  return { 'api-key': key(), 'Content-Type': 'application/json' };
}

async function sendSMS({ sender, message, recipients }) {
  const response = await axios.post(
    `${V2}/sms/send`,
    { sender, message, recipients },
    { headers: headers() }
  );
  return response.data;
}

async function scheduleSMS({ sender, message, recipients, scheduledDate }) {
  const response = await axios.post(
    `${V2}/sms/send`,
    { sender, message, recipients, scheduled_date: scheduledDate },
    { headers: headers() }
  );
  return response.data;
}

async function getBalance() {
  const k = key();
  if (!k || k === 'your_arkesel_api_key_here') {
    return { balance: 'DEMO — add your API key in backend/.env' };
  }
  const response = await axios.get(
    `${V1}?action=check-balance&api_key=${encodeURIComponent(k)}&response=json`
  );
  return response.data;
}

module.exports = { sendSMS, scheduleSMS, getBalance };
