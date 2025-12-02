import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  Plus,
  ChevronDown,
  User,
  Settings,
  LogOut,
  HelpCircle,
  Command
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Topbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const notifications = [
    { id: 1, title: 'Deal moved to Negotiation', message: 'Acme Corp - $50,000', time: '2m ago', unread: true },
    { id: 2, title: 'New task assigned', message: 'Follow up with John Smith', time: '1h ago', unread: true },
    { id: 3, title: 'Quote accepted', message: 'Global Industries approved your quote', time: '3h ago', unread: false },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'SUPER_ADMIN': 'Super Admin',
      'TENANT_ADMIN': 'Admin',
      'SALES_MANAGER': 'Sales Manager',
      'SALES_REP': 'Sales Rep',
      'SUPPORT_AGENT': 'Support',
      'MARKETING': 'Marketing',
      'FINANCE': 'Finance',
      'VIEWER': 'Viewer',
      'ADMIN': 'Admin',
      'AGENT': 'Agent'
    };
    return labels[role] || role;
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search deals, contacts, accounts..."
            className="input input-with-icon-left pr-20 bg-gray-50 border-gray-100 focus:bg-white"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
              <Command size={12} />K
            </kbd>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-4">
        {/* Quick Add */}
        <button className="btn btn-primary btn-sm gap-1.5">
          <Plus size={16} />
          <span className="hidden sm:inline">Quick Add</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="btn btn-ghost btn-icon relative"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {showNotifications && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowNotifications(false)}
              />
              <div className="dropdown-menu right-0 w-80 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">Notifications</h3>
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      Mark all read
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-2 ${
                        notif.unread ? 'border-blue-500 bg-blue-50/30' : 'border-transparent'
                      }`}
                    >
                      <p className="text-sm font-medium text-slate-800">{notif.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{notif.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{notif.time}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-gray-100">
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium w-full text-center">
                    View all notifications
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Help */}
        <button className="btn btn-ghost btn-icon hidden sm:flex">
          <HelpCircle size={20} />
        </button>

        {/* User Menu */}
        <div className="relative ml-2">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="avatar avatar-sm">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <span>{getInitials(user?.fullName || 'U')}</span>
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-slate-800">{user?.fullName}</p>
              <p className="text-xs text-slate-500">{getRoleLabel(user?.role || '')}</p>
            </div>
            <ChevronDown size={16} className="text-slate-400 hidden md:block" />
          </button>

          {showUserMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowUserMenu(false)}
              />
              <div className="dropdown-menu right-0 z-50 w-56">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-slate-800">{user?.fullName}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <div className="py-1">
                  <button className="dropdown-item w-full">
                    <User size={16} />
                    <span>My Profile</span>
                  </button>
                  <button className="dropdown-item w-full">
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>
                </div>
                <div className="dropdown-divider" />
                <div className="py-1">
                  <button 
                    onClick={handleLogout}
                    className="dropdown-item w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
