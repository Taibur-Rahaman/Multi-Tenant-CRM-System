import React from 'react';
import { Link } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gray-50 dark:bg-slate-800 h-full border-r">
      <div className="p-4 text-lg font-semibold">NeoBit CRM</div>
      <nav className="p-2">
        <ul className="space-y-2">
          <li><Link to="/dashboard" className="block p-2 rounded hover:bg-gray-100">Dashboard</Link></li>
          <li><Link to="/tasks" className="block p-2 rounded hover:bg-gray-100">Tasks</Link></li>
          <li><Link to="/issues" className="block p-2 rounded hover:bg-gray-100">Issues</Link></li>
          <li><Link to="/contacts" className="block p-2 rounded hover:bg-gray-100">Contacts</Link></li>
          <li><Link to="/calls" className="block p-2 rounded hover:bg-gray-100">Calls</Link></li>
          <li><Link to="/settings" className="block p-2 rounded hover:bg-gray-100">Settings</Link></li>
        </ul>
      </nav>
    </aside>
  )
}
