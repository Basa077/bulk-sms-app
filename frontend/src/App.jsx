import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import SendSMS from './pages/SendSMS';
import Contacts from './pages/Contacts';
import Groups from './pages/Groups';
import History from './pages/History';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/send" element={<SendSMS />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/history" element={<History />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  );
}
