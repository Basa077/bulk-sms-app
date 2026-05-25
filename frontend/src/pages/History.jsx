import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { campaignsApi } from '../api';
import PageHeader from '../components/PageHeader';
import { format } from 'date-fns';

function StatusBadge({ status }) {
  const map = { sent: 'badge-success', scheduled: 'badge-scheduled', failed: 'badge-failed', sending: 'badge-pending', schedule_failed: 'badge-failed' };
  return <span className={map[status] || 'badge-pending'}>{status?.replace('_', ' ')}</span>;
}

export default function History() {
  const [campaigns, setCampaigns] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    campaignsApi.list().then(r => setCampaigns(r.data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this campaign and all its logs?')) return;
    await campaignsApi.remove(id);
    toast.success('Campaign deleted');
    if (selected?.id === id) setSelected(null);
    load();
  };

  const viewDetails = async (id) => {
    const res = await campaignsApi.get(id);
    setSelected(res.data);
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" /></div>;

  return (
    <div className="p-4 sm:p-8">
      <PageHeader title="Campaign History" subtitle="All your past and scheduled campaigns" />
      <div className={`${selected ? 'grid grid-cols-5 gap-6' : ''}`}>
        <div className={selected ? 'col-span-3' : ''}>
          <div className="card">
            {!campaigns.length ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-3">📜</p>
                <p className="font-medium">No campaigns yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-100">
                      <th className="text-left pb-3 font-medium">Name</th>
                      <th className="text-left pb-3 font-medium">Recipients</th>
                      <th className="text-left pb-3 font-medium">Status</th>
                      <th className="text-left pb-3 font-medium">Date</th>
                      <th className="text-left pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {campaigns.map(c => (
                      <tr key={c.id} className={`hover:bg-gray-50 cursor-pointer ${selected?.id === c.id ? 'bg-primary-50' : ''}`} onClick={() => viewDetails(c.id)}>
                        <td className="py-3 font-medium text-gray-900 max-w-[140px] truncate">{c.name}</td>
                        <td className="py-3 text-gray-600">{c.total_recipients}</td>
                        <td className="py-3"><StatusBadge status={c.status} /></td>
                        <td className="py-3 text-gray-400 text-xs">
                          {c.sent_at ? format(new Date(c.sent_at), 'MMM d, h:mm a') : c.scheduled_at ? '🕐 ' + format(new Date(c.scheduled_at), 'MMM d, h:mm a') : '—'}
                        </td>
                        <td className="py-3">
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} className="text-red-400 hover:text-red-600 text-xs font-medium">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {selected && (
          <div className="col-span-2">
            <div className="card sticky top-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{selected.name}</h3>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
              </div>
              <div className="space-y-3 text-sm mb-4">
                <div className="flex justify-between"><span className="text-gray-500">Status</span><StatusBadge status={selected.status} /></div>
                <div className="flex justify-between"><span className="text-gray-500">Sender</span><span className="font-medium">{selected.sender_id}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Recipients</span><span className="font-medium">{selected.total_recipients}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Delivered</span><span className="font-medium text-green-600">{selected.delivered}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Failed</span><span className="font-medium text-red-500">{selected.failed}</span></div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 mb-4">
                <p className="text-xs font-medium text-gray-500 mb-1">Message</p>
                <p className="text-sm text-gray-800">{selected.message}</p>
              </div>
              {selected.logs?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Delivery Logs ({selected.logs.length})</p>
                  <div className="max-h-48 overflow-y-auto space-y-1.5">
                    {selected.logs.map(l => (
                      <div key={l.id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                        <span className="font-mono text-gray-600">{l.phone}</span>
                        <StatusBadge status={l.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
