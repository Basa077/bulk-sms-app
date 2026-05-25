import { NavLink } from 'react-router-dom';

const nav = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/send', icon: '📤', label: 'Send SMS' },
  { to: '/contacts', icon: '👥', label: 'Contacts' },
  { to: '/groups', icon: '📋', label: 'Groups' },
  { to: '/history', icon: '📜', label: 'History' },
  { to: '/reports', icon: '📊', label: 'Reports' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 flex flex-col h-screen shrink-0 transition-transform duration-200
        md:static md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="px-6 py-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">S</div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">BulkSMS Pro</p>
            <p className="text-gray-400 text-xs">Powered by Arkesel</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-gray-800">
        <p className="text-gray-500 text-xs text-center">© 2026 BulkSMS Pro</p>
      </div>
    </aside>
  );
}
