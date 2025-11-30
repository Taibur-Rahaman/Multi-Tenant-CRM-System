import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  Settings, 
  LogOut, 
  User,
  ChevronDown,
  Mic
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Topbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleVoiceSearch = () => {
    // Voice search functionality would go here
    console.log('Voice search activated');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers, accounts, interactions..."
            className="w-full pl-10 pr-12 py-2.5 bg-slate-100 border border-transparent rounded-lg focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
          />
          <button 
            onClick={handleVoiceSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors"
          >
            <Mic size={20} />
          </button>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4 ml-6">
        {/* Notifications */}
        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Settings */}
        <button 
          onClick={() => navigate('/settings')}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Settings size={20} />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.firstName?.charAt(0) || 'U'}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-slate-700">{user?.fullName || 'User'}</p>
              <p className="text-xs text-slate-500">{user?.role}</p>
            </div>
            <ChevronDown size={16} className="text-slate-400" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="font-medium text-slate-700">{user?.fullName}</p>
                <p className="text-sm text-slate-500">{user?.email}</p>
              </div>
              <button
                onClick={() => { navigate('/profile'); setShowDropdown(false); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <User size={18} />
                <span>Profile</span>
              </button>
              <button
                onClick={() => { navigate('/settings'); setShowDropdown(false); }}
                className="w-full flex items-center gap-3 px-4 py-2 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Settings size={18} />
                <span>Settings</span>
              </button>
              <hr className="my-2 border-slate-100" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
