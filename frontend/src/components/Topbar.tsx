import React from 'react';

export default function Topbar(){
  return (
    <header className="flex items-center justify-between px-4 h-14 border-b bg-white dark:bg-slate-900">
      <div className="flex items-center space-x-4">
        <select className="p-1 rounded border">
          <option>Tenant A</option>
          <option>Tenant B</option>
        </select>
        <div className="relative">
          <input placeholder="Search..." className="px-3 py-1 rounded border" />
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <button className="p-2 rounded-full">🔔</button>
        <div className="w-8 h-8 rounded-full bg-gray-300" />
      </div>
    </header>
  )
}
