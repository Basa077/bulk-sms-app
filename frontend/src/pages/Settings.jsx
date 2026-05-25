import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { smsApi } from '../api';
import PageHeader from '../components/PageHeader';

const STORAGE_KEY = 'bulksms_settings';

export default function Settings() {
  const [settings, setSettings] = useState({ apiKey: '', senderId: '' });
  const [balance, setBalance] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    toast.success('Settings saved locally');
  };

  const checkBalance = async () => {
    setChecking(true);
    try {
      const res = await smsApi.balance();
      setBalance(res.data?.balance ?? JSON.stringify(res.data));
      toast.success('Connected! Balance fetched');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fetch balance. Check your API key in .env');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl">
      <PageHeader title="Settings" subtitle="Configure your Arkesel integration" />

      <div className="space-y-6">
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Arkesel API Configuration</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">How to get your API key:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700">
              <li>Go to <strong>arkesel.com</strong> and create an account</li>
              <li>Log in to your <strong>Arkesel Dashboard</strong></li>
              <li>Navigate to <strong>API Keys</strong> section</li>
              <li>Click <strong>Generate API Key</strong> and copy it</li>
              <li>Paste it in the <code className="bg-blue-100 px-1 rounded">.env</code> file in the <code className="bg-blue-100 px-1 rounded">backend/</code> folder</li>
            </ol>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ARKESEL_API_KEY</label>
            <input
              type="password"
              className="input"
              placeholder="Paste in backend/.env file"
              value={settings.apiKey}
              onChange={e => setSettings(s => ({ ...s, apiKey: e.target.value }))}
            />
            <p className="text-xs text-gray-400 mt-1">For security, the API key is stored in <code>backend/.env</code> — not in the browser</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Sender ID</label>
            <input
              className="input"
              placeholder="YourBrandName (max 11 chars)"
              maxLength={11}
              value={settings.senderId}
              onChange={e => setSettings(s => ({ ...s, senderId: e.target.value }))}
            />
            <p className="text-xs text-gray-400 mt-1">Also set <code>ARKESEL_SENDER_ID</code> in <code>backend/.env</code></p>
          </div>

          <div className="flex gap-3">
            <button onClick={save} className="btn-primary">Save Settings</button>
            <button onClick={checkBalance} disabled={checking} className="btn-secondary">
              {checking ? 'Checking...' : 'Test Connection & Check Balance'}
            </button>
          </div>

          {balance !== null && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-800 font-medium">Account Balance: <span className="font-bold">{balance} SMS credits</span></p>
            </div>
          )}
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold text-gray-900">Webhook Configuration</h2>
          <p className="text-sm text-gray-600">To receive delivery reports, configure this webhook URL in your Arkesel dashboard:</p>
          <div className="bg-gray-50 rounded-xl p-3 font-mono text-sm text-gray-700 select-all">
            http://YOUR_SERVER_IP:5000/api/webhooks/delivery
          </div>
          <p className="text-xs text-gray-400">Replace <code>YOUR_SERVER_IP</code> with your server's public IP or domain. For local testing use <a href="https://ngrok.com" target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">ngrok</a>.</p>
        </div>

        <div className="card space-y-2">
          <h2 className="font-semibold text-gray-900">Environment File</h2>
          <p className="text-sm text-gray-600">Edit <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">backend/.env</code> with your values:</p>
          <pre className="bg-gray-900 text-green-400 rounded-xl p-4 text-xs overflow-x-auto">{`ARKESEL_API_KEY=your_actual_api_key
ARKESEL_SENDER_ID=YourBrandName
PORT=5000`}</pre>
        </div>
      </div>
    </div>
  );
}
