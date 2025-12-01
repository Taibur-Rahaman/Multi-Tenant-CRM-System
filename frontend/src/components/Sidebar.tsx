import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  MessageSquare, 
  CheckSquare,
  Phone,
  Bug,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/customers', icon: Users, label: 'Customers' },
  { path: '/accounts', icon: Building2, label: 'Accounts' },
  { path: '/interactions', icon: MessageSquare, label: 'Interactions' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { path: '/calls', icon: Phone, label: 'Calls' },
  { path: '/issues', icon: Bug, label: 'Issue Tracking' },
  { path: '/ai-assistant', icon: Sparkles, label: 'AI Assistant' },
  { path: '/integrations', icon: LinkIcon, label: 'Integrations' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={`bg-slate-900 text-white transition-all duration-300 flex flex-col ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
        {!collapsed && (
          <span className="font-bold text-xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            CRM Pro
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={20} />
            {!collapsed && <span className="font-medium">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-700">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4">
            <h4 className="font-semibold text-sm">Upgrade to Pro</h4>
            <p className="text-xs text-blue-100 mt-1">Get AI features & more</p>
            <button className="mt-3 w-full bg-white text-blue-600 font-medium py-1.5 rounded-md text-sm hover:bg-blue-50 transition-colors">
              Upgrade Now
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
