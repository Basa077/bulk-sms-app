// Converts any Ghana phone number into Arkesel's required
// international format (233XXXXXXXXX — no plus, no leading zero).
function normalizePhone(raw) {
  let p = String(raw || '').trim().replace(/\s+/g, '').replace(/^\+/, '');
  if (!/^\d+$/.test(p)) return null;

  if (p.startsWith('00')) p = p.slice(2);          // 00233... → 233...
  if (p.startsWith('0')) p = '233' + p.slice(1);   // 0558080417 → 233558080417
  else if (p.length === 9) p = '233' + p;          // 558080417 → 233558080417

  // valid international number: 10–15 digits
  if (!/^\d{10,15}$/.test(p)) return null;
  return p;
}

module.exports = { normalizePhone };
