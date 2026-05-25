import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { campaignsApi, smsApi } from '../api';
import StatsCard from '../components/StatsCard';
import PageHeader from '../components/PageHeader';
import { format } from 'date-fns';

function statusBadge(status) {
  const map = {
    sent: 'badge-success',
    scheduled: 'badge-scheduled',
    failed: 'badge-failed',
    sending: 'badge-pending',
  };
  return <span className={map[status] || 'badge-pending'}>{status}</span>;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([campaignsApi.stats(), smsApi.balance()])
      .then(([s, b]) => { setStats(s.data); setBalance(b.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="p-4 sm:p-8">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your SMS campaigns"
        action={
          <Link to="/send" className="btn-primary">
            + New Campaign
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Total Campaigns" value={stats?.total} icon="📣" color="blue" />
        <StatsCard label="Messages Sent" value={stats?.totalMessages} icon="✉️" color="green" />
        <StatsCard label="Delivered" value={stats?.delivered} icon="✅" color="green" />
        <StatsCard label="Scheduled" value={stats?.scheduled} icon="🕐" color="yellow" />
      </div>

      {balance && (
        <div className="card mb-8 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white border-0">
          <div>
            <p className="text-primary-100 text-sm font-medium">Arkesel Account Balance</p>
            <p className="text-3xl font-bold mt-1">{balance?.balance ?? '—'} SMS Credits</p>
            {balance?.user && <p className="text-primary-100 text-xs mt-1">{balance.user} · {balance.country}</p>}
          </div>
          <Link to="/send" className="bg-white text-primary-700 font-semibold px-4 py-2 rounded-lg hover:bg-primary-50 transition-all">
            Send Now →
          </Link>
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Campaigns</h2>
          <Link to="/history" className="text-primary-600 text-sm font-medium hover:underline">View all</Link>
        </div>
        {!stats?.recentCampaigns?.length ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-medium">No campaigns yet</p>
            <p className="text-sm mt-1">
              <Link to="/send" className="text-primary-600 hover:underline">Send your first campaign</Link>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100">
                  <th className="text-left pb-3 font-medium">Campaign</th>
                  <th className="text-left pb-3 font-medium">Recipients</th>
                  <th className="text-left pb-3 font-medium">Status</th>
                  <th className="text-left pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentCampaigns.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="py-3 text-gray-600">{c.total_recipients}</td>
                    <td className="py-3">{statusBadge(c.status)}</td>
                    <td className="py-3 text-gray-400">
                      {c.sent_at ? format(new Date(c.sent_at), 'MMM d, h:mm a') : c.scheduled_at ? format(new Date(c.scheduled_at), 'MMM d, h:mm a') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
