import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Kanban,
  Target,
  Package,
  FileText,
  CalendarDays,
  CheckSquare,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Link as LinkIcon,
  AlertCircle,
  Phone,
  HelpCircle,
  Bell
} from 'lucide-react';

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/pipeline', icon: Kanban, label: 'Pipeline' },
    ]
  },
  {
    title: 'Sales',
    items: [
      { path: '/deals', icon: Target, label: 'Deals' },
      { path: '/contacts', icon: Users, label: 'Contacts' },
      { path: '/accounts', icon: Building2, label: 'Accounts' },
      { path: '/products', icon: Package, label: 'Products' },
      { path: '/quotes', icon: FileText, label: 'Quotes' },
    ]
  },
  {
    title: 'Activities',
    items: [
      { path: '/activities', icon: CalendarDays, label: 'Activities' },
      { path: '/tasks', icon: CheckSquare, label: 'Tasks', badge: 5 },
      { path: '/calls', icon: Phone, label: 'Calls' },
    ]
  },
  {
    title: 'Support',
    items: [
      { path: '/issues', icon: AlertCircle, label: 'Issues' },
    ]
  },
  {
    title: 'Insights',
    items: [
      { path: '/reports', icon: BarChart3, label: 'Reports' },
      { path: '/ai-assistant', icon: Sparkles, label: 'AI Assistant' },
    ]
  },
  {
    title: 'Settings',
    items: [
      { path: '/integrations', icon: LinkIcon, label: 'Integrations' },
      { path: '/settings', icon: Settings, label: 'Settings' },
    ]
  }
];

const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside 
      className={`sidebar transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="sidebar-header justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Target size={18} className="text-white" />
            </div>
            <span className="sidebar-logo">NeoBit CRM</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mx-auto">
            <Target size={18} className="text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white ${collapsed ? 'hidden' : ''}`}
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav overflow-y-auto scrollbar-hide">
        {navSections.map((section, idx) => (
          <div key={section.title} className={idx > 0 ? 'sidebar-section' : ''}>
            {!collapsed && (
              <div className="sidebar-section-title mb-2">{section.title}</div>
            )}
            <div className="space-y-1">
              {section.items.map(({ path, icon: Icon, label, badge }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'sidebar-link-active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
                  }
                  title={collapsed ? label : undefined}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{label}</span>
                      {badge && (
                        <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={() => setCollapsed(false)}
            className="w-full p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white flex items-center justify-center"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Footer - Upgrade Card */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-800">
          <div className="bg-gradient-to-br from-blue-600 via-violet-600 to-purple-600 rounded-xl p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-yellow-300" />
                <span className="text-xs font-semibold text-white/90">PRO FEATURES</span>
              </div>
              <p className="text-xs text-white/70 mb-3">Unlock AI insights, advanced analytics & more</p>
              <button className="w-full bg-white text-violet-600 font-semibold py-2 px-3 rounded-lg text-sm hover:bg-white/90 transition-colors">
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
