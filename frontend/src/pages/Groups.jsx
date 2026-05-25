import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { groupsApi, smsApi } from '../api';
import PageHeader from '../components/PageHeader';
import { useNavigate } from 'react-router-dom';

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editId, setEditId] = useState(null);
  const navigate = useNavigate();

  const load = () => groupsApi.list().then(r => setGroups(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!form.name) return toast.error('Group name is required');
    try {
      if (editId) {
        await groupsApi.update(editId, form);
        toast.success('Group updated');
      } else {
        await groupsApi.create(form);
        toast.success('Group created');
      }
      setForm({ name: '', description: '' }); setShowForm(false); setEditId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save group');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this group? Contacts will not be deleted.')) return;
    await groupsApi.remove(id);
    toast.success('Group deleted');
    load();
  };

  const sendToGroup = async (group) => {
    const res = await groupsApi.phones(group.id);
    if (!res.data.length) return toast.error('No contacts in this group');
    navigate('/send', { state: { phones: res.data.map(c => c.phone), groupName: group.name } });
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Groups"
        subtitle="Organise contacts into groups for targeted campaigns"
        action={
          <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', description: '' }); }} className="btn-primary">
            + New Group
          </button>
        }
      />

      {showForm && (
        <div className="card mb-6 border-primary-200 bg-primary-50">
          <h3 className="font-semibold text-gray-900 mb-4">{editId ? 'Edit Group' : 'New Group'}</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Group Name *</label>
              <input className="input" placeholder="e.g. VIP Customers" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSubmit} className="btn-primary">Save</button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {!groups.length ? (
        <div className="card text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium">No groups yet</p>
          <p className="text-sm mt-1">Create a group to organise your contacts</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(g => (
            <div key={g.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600 font-bold text-lg">
                  {g.name[0].toUpperCase()}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditId(g.id); setForm({ name: g.name, description: g.description || '' }); setShowForm(true); }} className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50">✏️</button>
                  <button onClick={() => handleDelete(g.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50">🗑️</button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900">{g.name}</h3>
              {g.description && <p className="text-sm text-gray-500 mt-0.5">{g.description}</p>}
              <p className="text-sm text-gray-400 mt-2">{g.contact_count} contact{g.contact_count !== 1 ? 's' : ''}</p>
              <button
                onClick={() => sendToGroup(g)}
                disabled={!g.contact_count}
                className="btn-primary w-full mt-4 text-sm py-2"
              >
                Send SMS to Group
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
