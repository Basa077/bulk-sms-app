import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { smsApi, groupsApi } from '../api';
import PageHeader from '../components/PageHeader';

const MAX_SMS_CHARS = 160;

export default function SendSMS() {
  const [mode, setMode] = useState('immediate'); // immediate | scheduled
  const [recipients, setRecipients] = useState('');
  const [message, setMessage] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [senderId, setSenderId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [loading, setLoading] = useState(false);
  const [csvPhones, setCsvPhones] = useState([]);

  useEffect(() => {
    groupsApi.list().then(r => setGroups(r.data)).catch(() => {});
  }, []);

  const loadGroupPhones = async (groupId) => {
    if (!groupId) return;
    const res = await groupsApi.phones(groupId);
    const phones = res.data.map(c => c.phone).join('\n');
    setRecipients(phones);
    toast.success(`Loaded ${res.data.length} contacts from group`);
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await smsApi.parseCSV(file);
      setCsvPhones(res.data.phones);
      setRecipients(res.data.phones.join('\n'));
      toast.success(`Extracted ${res.data.count} phone numbers from CSV`);
    } catch {
      toast.error('Failed to parse CSV file');
    }
  };

  const normalizePhone = (raw) => {
    let p = String(raw || '').trim().replace(/\s+/g, '').replace(/^\+/, '');
    if (!/^\d+$/.test(p)) return null;
    if (p.startsWith('00')) p = p.slice(2);
    if (p.startsWith('0')) p = '233' + p.slice(1);
    else if (p.length === 9) p = '233' + p;
    if (!/^\d{10,15}$/.test(p)) return null;
    return p;
  };

  const parseRecipients = () => {
    return [...new Set(
      recipients.split(/[\n,;]+/).map(normalizePhone).filter(Boolean)
    )];
  };

  const handleSend = async () => {
    const phones = parseRecipients();
    if (!phones.length) return toast.error('Enter at least one valid phone number');
    if (!message.trim()) return toast.error('Message cannot be empty');

    setLoading(true);
    try {
      if (mode === 'immediate') {
        await smsApi.send({ name: campaignName, message, recipients: phones, sender_id: senderId });
        toast.success(`Campaign sent to ${phones.length} recipients!`);
      } else {
        if (!scheduledAt) return toast.error('Select a scheduled date and time');
        await smsApi.schedule({ name: campaignName, message, recipients: phones, sender_id: senderId, scheduled_at: scheduledAt });
        toast.success(`Campaign scheduled for ${new Date(scheduledAt).toLocaleString()}`);
      }
      setMessage(''); setRecipients(''); setCampaignName(''); setScheduledAt('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send campaign');
    } finally {
      setLoading(false);
    }
  };

  const phoneCount = parseRecipients().length;
  const msgParts = Math.ceil(message.length / MAX_SMS_CHARS) || 1;

  return (
    <div className="p-4 sm:p-8">
      <PageHeader title="Send SMS" subtitle="Create and send a bulk SMS campaign" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900">Campaign Details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name (optional)</label>
              <input className="input" placeholder="e.g. June Promo" value={campaignName} onChange={e => setCampaignName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sender ID</label>
              <input className="input" placeholder="YourBrand (max 11 chars)" maxLength={11} value={senderId} onChange={e => setSenderId(e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">Leave blank to use default sender ID from settings</p>
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900">Recipients</h2>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Import from Group</label>
                <select className="input" value={selectedGroup} onChange={e => { setSelectedGroup(e.target.value); loadGroupPhones(e.target.value); }}>
                  <option value="">Select a group...</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.contact_count})</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload CSV File</label>
                <input type="file" accept=".csv,.txt" className="input text-xs" onChange={handleCSVUpload} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Numbers <span className="text-gray-400 font-normal">(one per line or comma-separated)</span>
              </label>
              <textarea
                className="input h-32 resize-none font-mono text-xs"
                placeholder={"233244123456\n233501234567\n233209876543"}
                value={recipients}
                onChange={e => setRecipients(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                {phoneCount > 0
                  ? <span className="text-green-600 font-medium">{phoneCount} valid recipient{phoneCount > 1 ? 's' : ''} — local numbers auto-converted to 233 format</span>
                  : 'Enter Ghana numbers — e.g. 0558080417 or 233558080417'}
              </p>
            </div>
          </div>

          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Message</h2>
              <span className="text-xs text-gray-400">{message.length} chars · {msgParts} SMS part{msgParts > 1 ? 's' : ''}</span>
            </div>
            <textarea
              className="input h-32 resize-none"
              placeholder="Type your message here..."
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
            {message.length > MAX_SMS_CHARS && (
              <p className="text-xs text-yellow-600">Message exceeds 160 characters — will be split into {msgParts} parts and charged accordingly.</p>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-900">Send Options</h2>
            <div className="flex rounded-xl overflow-hidden border border-gray-200">
              <button
                onClick={() => setMode('immediate')}
                className={`flex-1 py-2.5 text-sm font-medium transition-all ${mode === 'immediate' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                Send Now
              </button>
              <button
                onClick={() => setMode('scheduled')}
                className={`flex-1 py-2.5 text-sm font-medium transition-all ${mode === 'scheduled' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                Schedule
              </button>
            </div>

            {mode === 'scheduled' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Send Date & Time</label>
                <input type="datetime-local" className="input" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} min={new Date().toISOString().slice(0, 16)} />
              </div>
            )}
          </div>

          <div className="card bg-gray-50 border-gray-100 space-y-3">
            <h3 className="font-semibold text-gray-700 text-sm">Campaign Summary</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Recipients</span><span className="font-medium">{phoneCount}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Message parts</span><span className="font-medium">{msgParts}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total SMS credits</span><span className="font-bold text-primary-700">{phoneCount * msgParts}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Mode</span><span className="font-medium capitalize">{mode}</span></div>
            </div>
          </div>

          <button
            onClick={handleSend}
            disabled={loading || !phoneCount || !message.trim()}
            className="btn-primary w-full py-3 text-base"
          >
            {loading ? 'Sending...' : mode === 'immediate' ? `Send to ${phoneCount} Recipients` : 'Schedule Campaign'}
          </button>
        </div>
      </div>
    </div>
  );
}
