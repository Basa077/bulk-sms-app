import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { contactsApi, groupsApi } from '../api';
import PageHeader from '../components/PageHeader';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', group_id: '' });
  const [editId, setEditId] = useState(null);

  const load = () => {
    contactsApi.list().then(r => setContacts(r.data)).catch(() => {});
    groupsApi.list().then(r => setGroups(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!form.name || !form.phone) return toast.error('Name and phone are required');
    try {
      if (editId) {
        await contactsApi.update(editId, form);
        toast.success('Contact updated');
      } else {
        await contactsApi.create(form);
        toast.success('Contact added');
      }
      setForm({ name: '', phone: '', email: '', group_id: '' });
      setShowForm(false); setEditId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save contact');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this contact?')) return;
    await contactsApi.remove(id);
    toast.success('Deleted');
    load();
  };

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div className="p-4 sm:p-8">
      <PageHeader
        title="Contacts"
        subtitle={`${contacts.length} total contacts`}
        action={
          <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', phone: '', email: '', group_id: '' }); }} className="btn-primary">
            + Add Contact
          </button>
        }
      />

      {showForm && (
        <div className="card mb-6 border-primary-200 bg-primary-50">
          <h3 className="font-semibold text-gray-900 mb-4">{editId ? 'Edit Contact' : 'New Contact'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
              <input className="input" placeholder="233XXXXXXXXX" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Group</label>
              <select className="input" value={form.group_id} onChange={e => setForm(f => ({ ...f, group_id: e.target.value }))}>
                <option value="">No group</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSubmit} className="btn-primary">Save</button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="mb-4">
          <input className="input max-w-sm" placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {!filtered.length ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">👥</p>
            <p className="font-medium">{search ? 'No results found' : 'No contacts yet'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100">
                  <th className="text-left pb-3 font-medium">Name</th>
                  <th className="text-left pb-3 font-medium">Phone</th>
                  <th className="text-left pb-3 font-medium">Email</th>
                  <th className="text-left pb-3 font-medium">Group</th>
                  <th className="text-left pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="py-3 text-gray-600 font-mono">{c.phone}</td>
                    <td className="py-3 text-gray-500">{c.email || '—'}</td>
                    <td className="py-3">{c.group_name ? <span className="badge-scheduled">{c.group_name}</span> : <span className="text-gray-400">—</span>}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditId(c.id); setForm({ name: c.name, phone: c.phone, email: c.email || '', group_id: c.group_id || '' }); setShowForm(true); }} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                        <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                      </div>
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
