import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

export const smsApi = {
  send: (data) => api.post('/sms/send', data),
  schedule: (data) => api.post('/sms/schedule', data),
  balance: () => api.get('/sms/balance'),
  parseCSV: (file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/sms/parse-csv', form);
  },
};

export const contactsApi = {
  list: () => api.get('/contacts'),
  create: (data) => api.post('/contacts', data),
  update: (id, data) => api.put(`/contacts/${id}`, data),
  remove: (id) => api.delete(`/contacts/${id}`),
  bulkImport: (contacts) => api.post('/contacts/bulk-import', { contacts }),
};

export const groupsApi = {
  list: () => api.get('/groups'),
  create: (data) => api.post('/groups', data),
  update: (id, data) => api.put(`/groups/${id}`, data),
  remove: (id) => api.delete(`/groups/${id}`),
  phones: (id) => api.get(`/groups/${id}/phones`),
};

export const campaignsApi = {
  list: () => api.get('/campaigns'),
  get: (id) => api.get(`/campaigns/${id}`),
  remove: (id) => api.delete(`/campaigns/${id}`),
  stats: () => api.get('/campaigns/stats/overview'),
};

export const webhooksApi = {
  reports: () => api.get('/webhooks/delivery'),
};

export default api;
