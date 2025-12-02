import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  ChevronDown,
  Building2,
  User,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Edit,
  Trash2,
  Download
} from 'lucide-react';
import type { Deal, DealStatus } from '../types';

// Demo deals data
const demoDeals: Deal[] = [
  { id: '1', pipelineId: '1', pipelineName: 'Sales Pipeline', stageId: '4', stageName: 'Negotiation', stageColor: '#d946ef', name: 'Enterprise License - Acme Corp', description: 'Annual enterprise license', dealNumber: 'D-2024-001', amount: 125000, currency: 'USD', weightedValue: 93750, probability: 75, expectedCloseDate: '2024-02-15', status: 'open', contactName: 'John Smith', accountName: 'Acme Corporation', ownerName: 'Alex Johnson', daysInStage: 5, isRotting: false, stageEnteredAt: '', tags: ['enterprise'], customFields: {}, activitiesCount: 12, notesCount: 5, createdAt: '2024-01-05T10:00:00Z', updatedAt: '2024-01-20T14:30:00Z' },
  { id: '2', pipelineId: '1', pipelineName: 'Sales Pipeline', stageId: '3', stageName: 'Proposal', stageColor: '#a855f7', name: 'Annual Subscription - TechStart', description: 'Annual subscription deal', dealNumber: 'D-2024-002', amount: 85000, currency: 'USD', weightedValue: 42500, probability: 50, expectedCloseDate: '2024-02-28', status: 'open', contactName: 'Sarah Chen', accountName: 'TechStart Inc', ownerName: 'Alex Johnson', daysInStage: 8, isRotting: false, stageEnteredAt: '', tags: ['subscription'], customFields: {}, activitiesCount: 8, notesCount: 3, createdAt: '2024-01-10T09:00:00Z', updatedAt: '2024-01-18T11:20:00Z' },
  { id: '3', pipelineId: '1', pipelineName: 'Sales Pipeline', stageId: '3', stageName: 'Proposal', stageColor: '#a855f7', name: 'Consulting Package - DataFlow', description: 'Implementation consulting', dealNumber: 'D-2024-003', amount: 65000, currency: 'USD', weightedValue: 32500, probability: 50, expectedCloseDate: '2024-03-01', status: 'open', contactName: 'Mike Johnson', accountName: 'DataFlow Systems', ownerName: 'Emily White', daysInStage: 4, isRotting: false, stageEnteredAt: '', tags: ['consulting'], customFields: {}, activitiesCount: 6, notesCount: 2, createdAt: '2024-01-08T14:00:00Z', updatedAt: '2024-01-19T16:45:00Z' },
  { id: '4', pipelineId: '1', pipelineName: 'Sales Pipeline', stageId: '2', stageName: 'Needs Analysis', stageColor: '#8b5cf6', name: 'Platform Upgrade - Global Ind', description: 'Platform modernization', dealNumber: 'D-2024-004', amount: 95000, currency: 'USD', weightedValue: 23750, probability: 25, expectedCloseDate: '2024-03-15', status: 'open', contactName: 'Lisa Park', accountName: 'Global Industries', ownerName: 'Alex Johnson', daysInStage: 12, isRotting: true, stageEnteredAt: '', tags: ['upgrade'], customFields: {}, activitiesCount: 10, notesCount: 4, createdAt: '2024-01-02T11:00:00Z', updatedAt: '2024-01-15T09:30:00Z' },
  { id: '5', pipelineId: '1', pipelineName: 'Sales Pipeline', stageId: '1', stageName: 'Qualification', stageColor: '#6366f1', name: 'New Business - InnovateTech', description: 'New customer acquisition', dealNumber: 'D-2024-005', amount: 45000, currency: 'USD', weightedValue: 4500, probability: 10, expectedCloseDate: '2024-04-01', status: 'open', contactName: 'David Kim', accountName: 'InnovateTech', ownerName: 'Emily White', daysInStage: 3, isRotting: false, stageEnteredAt: '', tags: ['new-business'], customFields: {}, activitiesCount: 3, notesCount: 1, createdAt: '2024-01-18T10:00:00Z', updatedAt: '2024-01-20T10:00:00Z' },
  { id: '6', pipelineId: '1', pipelineName: 'Sales Pipeline', stageId: '5', stageName: 'Closed Won', stageColor: '#22c55e', name: 'Support Contract - CloudFirst', description: 'Annual support contract', dealNumber: 'D-2024-006', amount: 35000, currency: 'USD', weightedValue: 35000, probability: 100, expectedCloseDate: '2024-01-15', actualCloseDate: '2024-01-14', status: 'won', contactName: 'Emma Wilson', accountName: 'CloudFirst', ownerName: 'Alex Johnson', daysInStage: 0, isRotting: false, stageEnteredAt: '', tags: ['support'], customFields: {}, activitiesCount: 15, notesCount: 6, createdAt: '2023-12-01T09:00:00Z', updatedAt: '2024-01-14T15:00:00Z' },
];

const statusColors: Record<DealStatus, string> = {
  open: 'badge-blue',
  won: 'badge-green',
  lost: 'badge-red',
  abandoned: 'badge-gray'
};

const Deals: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>(demoDeals);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DealStatus | 'all'>('all');
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.accountName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.dealNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || deal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalValue = filteredDeals.reduce((sum, d) => sum + d.amount, 0);
  const openValue = filteredDeals.filter(d => d.status === 'open').reduce((sum, d) => sum + d.amount, 0);
  const wonValue = filteredDeals.filter(d => d.status === 'won').reduce((sum, d) => sum + d.amount, 0);

  const toggleSelectAll = () => {
    if (selectedDeals.length === filteredDeals.length) {
      setSelectedDeals([]);
    } else {
      setSelectedDeals(filteredDeals.map(d => d.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedDeals(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-heading-1">Deals</h1>
          <p className="text-body mt-1">Manage your sales opportunities</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary btn-sm">
            <Download size={16} />
            Export
          </button>
          <button className="btn btn-primary btn-sm">
            <Plus size={16} />
            New Deal
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Pipeline</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">${(totalValue / 1000).toFixed(0)}k</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-100">
              <DollarSign size={20} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Open Deals</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">${(openValue / 1000).toFixed(0)}k</p>
            </div>
            <div className="p-2.5 rounded-xl bg-violet-100">
              <TrendingUp size={20} className="text-violet-600" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Won This Month</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">${(wonValue / 1000).toFixed(0)}k</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-100">
              <ArrowUpRight size={20} className="text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-with-icon-left"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DealStatus | 'all')}
              className="input input-sm w-auto"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="abandoned">Abandoned</option>
            </select>
            <button className="btn btn-secondary btn-sm">
              <Filter size={16} />
              More Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="w-12">
                  <input 
                    type="checkbox" 
                    checked={selectedDeals.length === filteredDeals.length && filteredDeals.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th>Deal</th>
                <th>Account</th>
                <th>Stage</th>
                <th>Value</th>
                <th>Close Date</th>
                <th>Owner</th>
                <th className="w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeals.map(deal => (
                <tr key={deal.id} className="group">
                  <td>
                    <input 
                      type="checkbox"
                      checked={selectedDeals.includes(deal.id)}
                      onChange={() => toggleSelect(deal.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td>
                    <div>
                      <p className="font-medium text-slate-800">{deal.name}</p>
                      <p className="text-xs text-slate-500">{deal.dealNumber}</p>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar avatar-xs bg-slate-200">
                        <span className="text-slate-600">{deal.accountName?.charAt(0)}</span>
                      </div>
                      <span className="text-slate-700">{deal.accountName}</span>
                    </div>
                  </td>
                  <td>
                    <span 
                      className="badge badge-sm"
                      style={{ 
                        backgroundColor: `${deal.stageColor}15`, 
                        color: deal.stageColor,
                        borderColor: `${deal.stageColor}30`
                      }}
                    >
                      {deal.stageName}
                    </span>
                  </td>
                  <td>
                    <div>
                      <p className="font-semibold text-slate-800">${deal.amount.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{deal.probability}% prob.</p>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-400" />
                      <span className="text-slate-600">
                        {deal.expectedCloseDate 
                          ? new Date(deal.expectedCloseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : '-'
                        }
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar avatar-xs">
                        <span>{deal.ownerName?.charAt(0)}</span>
                      </div>
                      <span className="text-slate-600 text-sm">{deal.ownerName}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="btn btn-ghost btn-icon-sm" title="View">
                        <Eye size={16} />
                      </button>
                      <button className="btn btn-ghost btn-icon-sm" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button className="btn btn-ghost btn-icon-sm text-red-600 hover:bg-red-50" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing <span className="font-medium">{filteredDeals.length}</span> of <span className="font-medium">{deals.length}</span> deals
          </p>
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary btn-sm" disabled>Previous</button>
            <button className="btn btn-secondary btn-sm" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Deals;

