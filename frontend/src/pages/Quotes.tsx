import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  FileText,
  DollarSign,
  Calendar,
  Eye,
  Edit,
  Send,
  Copy,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Download
} from 'lucide-react';
import type { Quote, QuoteStatus } from '../types';

const demoQuotes: Quote[] = [
  { id: '1', quoteNumber: 'Q-2024-001', name: 'Enterprise License - Acme Corp', status: 'sent', issueDate: '2024-01-15', expiryDate: '2024-02-15', dealName: 'Enterprise License', contactName: 'John Smith', accountName: 'Acme Corporation', ownerName: 'Alex Johnson', subtotal: 125000, discountValue: 0, taxAmount: 0, totalAmount: 125000, currency: 'USD', lineItems: [], viewCount: 3, isExpired: false, createdAt: '2024-01-15T10:00:00Z', updatedAt: '2024-01-18T14:30:00Z' },
  { id: '2', quoteNumber: 'Q-2024-002', name: 'Annual Subscription - TechStart', status: 'pending', issueDate: '2024-01-18', expiryDate: '2024-02-18', dealName: 'Annual Subscription', contactName: 'Sarah Chen', accountName: 'TechStart Inc', ownerName: 'Alex Johnson', subtotal: 85000, discountType: 'percent', discountValue: 10, taxAmount: 0, totalAmount: 76500, currency: 'USD', lineItems: [], viewCount: 0, isExpired: false, createdAt: '2024-01-18T09:00:00Z', updatedAt: '2024-01-18T09:00:00Z' },
  { id: '3', quoteNumber: 'Q-2024-003', name: 'Consulting Package - DataFlow', status: 'draft', issueDate: '2024-01-20', dealName: 'Consulting Package', contactName: 'Mike Johnson', accountName: 'DataFlow Systems', ownerName: 'Emily White', subtotal: 65000, discountValue: 0, taxAmount: 0, totalAmount: 65000, currency: 'USD', lineItems: [], viewCount: 0, isExpired: false, createdAt: '2024-01-20T14:00:00Z', updatedAt: '2024-01-20T14:00:00Z' },
  { id: '4', quoteNumber: 'Q-2024-004', name: 'Support Contract - CloudFirst', status: 'accepted', issueDate: '2024-01-10', expiryDate: '2024-02-10', acceptedAt: '2024-01-14T15:00:00Z', dealName: 'Support Contract', contactName: 'Emma Wilson', accountName: 'CloudFirst', ownerName: 'Alex Johnson', subtotal: 35000, discountValue: 0, taxAmount: 0, totalAmount: 35000, currency: 'USD', lineItems: [], viewCount: 5, isExpired: false, createdAt: '2024-01-10T11:00:00Z', updatedAt: '2024-01-14T15:00:00Z' },
  { id: '5', quoteNumber: 'Q-2023-089', name: 'Platform License - OldCorp', status: 'expired', issueDate: '2023-12-01', expiryDate: '2023-12-31', contactName: 'Tom Brown', accountName: 'OldCorp Inc', ownerName: 'Emily White', subtotal: 45000, discountValue: 0, taxAmount: 0, totalAmount: 45000, currency: 'USD', lineItems: [], viewCount: 1, isExpired: true, createdAt: '2023-12-01T10:00:00Z', updatedAt: '2023-12-01T10:00:00Z' },
];

const statusConfig: Record<QuoteStatus, { label: string; icon: React.ElementType; color: string }> = {
  draft: { label: 'Draft', icon: FileText, color: 'badge-gray' },
  pending: { label: 'Pending', icon: Clock, color: 'badge-yellow' },
  sent: { label: 'Sent', icon: Send, color: 'badge-blue' },
  accepted: { label: 'Accepted', icon: CheckCircle, color: 'badge-green' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'badge-red' },
  expired: { label: 'Expired', icon: Clock, color: 'badge-gray' },
  converted: { label: 'Converted', icon: CheckCircle, color: 'badge-purple' }
};

const Quotes: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>(demoQuotes);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = 
      quote.quoteNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.accountName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalQuotes = quotes.length;
  const pendingValue = quotes.filter(q => q.status === 'sent' || q.status === 'pending').reduce((sum, q) => sum + q.totalAmount, 0);
  const acceptedValue = quotes.filter(q => q.status === 'accepted').reduce((sum, q) => sum + q.totalAmount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-heading-1">Quotes</h1>
          <p className="text-body mt-1">Create and manage sales proposals</p>
        </div>
        <button className="btn btn-primary btn-sm">
          <Plus size={16} />
          Create Quote
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Quotes</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalQuotes}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-100">
              <FileText size={20} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pending Value</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">${(pendingValue / 1000).toFixed(0)}k</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-100">
              <Clock size={20} className="text-amber-600" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Accepted Value</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">${(acceptedValue / 1000).toFixed(0)}k</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-100">
              <CheckCircle size={20} className="text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="card">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search quotes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-with-icon-left"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as QuoteStatus | 'all')}
              className="input input-sm w-auto"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Quote</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Valid Until</th>
                <th>Owner</th>
                <th className="w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotes.map(quote => {
                const StatusIcon = statusConfig[quote.status].icon;
                return (
                  <tr key={quote.id} className="group">
                    <td>
                      <div>
                        <p className="font-medium text-slate-800">{quote.name}</p>
                        <p className="text-xs text-slate-500">{quote.quoteNumber}</p>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="text-slate-700">{quote.accountName}</p>
                        <p className="text-xs text-slate-500">{quote.contactName}</p>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-sm ${statusConfig[quote.status].color}`}>
                        <StatusIcon size={12} />
                        {statusConfig[quote.status].label}
                      </span>
                    </td>
                    <td>
                      <p className="font-semibold text-slate-800">${quote.totalAmount.toLocaleString()}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-400" />
                        <span className={`text-sm ${quote.isExpired ? 'text-red-600' : 'text-slate-600'}`}>
                          {quote.expiryDate 
                            ? new Date(quote.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : '-'
                          }
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="text-slate-600 text-sm">{quote.ownerName}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="btn btn-ghost btn-icon-sm" title="View">
                          <Eye size={16} />
                        </button>
                        <button className="btn btn-ghost btn-icon-sm" title="Edit">
                          <Edit size={16} />
                        </button>
                        <button className="btn btn-ghost btn-icon-sm" title="Download PDF">
                          <Download size={16} />
                        </button>
                        {quote.status === 'draft' && (
                          <button className="btn btn-ghost btn-icon-sm text-blue-600" title="Send">
                            <Send size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Quotes;

