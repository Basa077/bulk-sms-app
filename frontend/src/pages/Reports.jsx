import { useEffect, useState } from 'react';
import { webhooksApi, campaignsApi } from '../api';
import PageHeader from '../components/PageHeader';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b'];

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    webhooksApi.reports().then(r => setReports(r.data)).catch(() => {});
    campaignsApi.list().then(r => setCampaigns(r.data)).catch(() => {});
  }, []);

  const statusCounts = campaigns.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  const barData = campaigns.slice(0, 10).reverse().map(c => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + '…' : c.name,
    sent: c.total_recipients,
    delivered: c.delivered,
    failed: c.failed,
  }));

  return (
    <div className="p-8">
      <PageHeader title="Reports & Analytics" subtitle="Visualise your SMS campaign performance" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Campaign Status Distribution</h3>
          {pieData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-10">No data yet</p>}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Campaigns Performance</h3>
          {barData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="sent" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Total" />
                <Bar dataKey="delivered" fill="#22c55e" radius={[3, 3, 0, 0]} name="Delivered" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-10">No data yet</p>}
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Delivery Reports (Webhook Logs)</h3>
        {!reports.length ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-3">📡</p>
            <p className="font-medium">No delivery reports yet</p>
            <p className="text-sm mt-1">Reports arrive via Arkesel webhook after messages are delivered</p>
            <p className="text-xs text-gray-300 mt-2">Configure your webhook URL in Arkesel dashboard: <code className="bg-gray-100 px-1 rounded">/api/webhooks/delivery</code></p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100">
                  <th className="text-left pb-3 font-medium">Phone</th>
                  <th className="text-left pb-3 font-medium">Status</th>
                  <th className="text-left pb-3 font-medium">Reference</th>
                  <th className="text-left pb-3 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reports.slice(0, 100).map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="py-3 font-mono text-gray-700">{r.phone}</td>
                    <td className="py-3">
                      <span className={r.status === 'delivered' ? 'badge-success' : r.status === 'failed' ? 'badge-failed' : 'badge-pending'}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-gray-400 text-xs">{r.arkesel_ref || '—'}</td>
                    <td className="py-3 text-gray-400 text-xs">{format(new Date(r.timestamp), 'MMM d, h:mm:ss a')}</td>
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
