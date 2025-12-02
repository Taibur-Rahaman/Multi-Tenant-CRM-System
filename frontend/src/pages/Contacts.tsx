import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Building2,
  MapPin,
  Star,
  StarOff,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  UserPlus,
  Users
} from 'lucide-react';
import type { Contact, LeadStatus } from '../types';

// Demo contacts data
const demoContacts: Contact[] = [
  { id: '1', firstName: 'John', lastName: 'Smith', fullName: 'John Smith', email: 'john.smith@acme.com', phone: '+1 (555) 123-4567', mobile: '+1 (555) 987-6543', jobTitle: 'CTO', department: 'Technology', accountId: '1', accountName: 'Acme Corporation', city: 'San Francisco', state: 'CA', country: 'USA', leadSource: 'Website', leadStatus: 'qualified', leadScore: 85, isLead: false, ownerName: 'Alex Johnson', tags: ['decision-maker', 'tech'], customFields: {}, lastContactedAt: '2024-01-20T14:30:00Z', interactionCount: 12, dealsCount: 2, totalDealsValue: 170000, createdAt: '2023-06-15T10:00:00Z', updatedAt: '2024-01-20T14:30:00Z' },
  { id: '2', firstName: 'Sarah', lastName: 'Chen', fullName: 'Sarah Chen', email: 'sarah.chen@techstart.io', phone: '+1 (555) 234-5678', jobTitle: 'VP Engineering', department: 'Engineering', accountId: '2', accountName: 'TechStart Inc', city: 'Austin', state: 'TX', country: 'USA', leadSource: 'Referral', leadStatus: 'contacted', leadScore: 72, isLead: false, ownerName: 'Alex Johnson', tags: ['influencer'], customFields: {}, lastContactedAt: '2024-01-18T11:20:00Z', interactionCount: 8, dealsCount: 1, totalDealsValue: 85000, createdAt: '2023-09-20T09:00:00Z', updatedAt: '2024-01-18T11:20:00Z' },
  { id: '3', firstName: 'Mike', lastName: 'Johnson', fullName: 'Mike Johnson', email: 'mike.j@dataflow.com', phone: '+1 (555) 345-6789', jobTitle: 'Director of IT', department: 'IT', accountId: '3', accountName: 'DataFlow Systems', city: 'Seattle', state: 'WA', country: 'USA', leadSource: 'Trade Show', leadStatus: 'qualified', leadScore: 68, isLead: false, ownerName: 'Emily White', tags: ['technical'], customFields: {}, lastContactedAt: '2024-01-19T16:45:00Z', interactionCount: 6, dealsCount: 1, totalDealsValue: 65000, createdAt: '2023-11-05T14:00:00Z', updatedAt: '2024-01-19T16:45:00Z' },
  { id: '4', firstName: 'Lisa', lastName: 'Park', fullName: 'Lisa Park', email: 'lisa.park@globalind.com', phone: '+1 (555) 456-7890', jobTitle: 'Procurement Manager', department: 'Procurement', accountId: '4', accountName: 'Global Industries', city: 'Chicago', state: 'IL', country: 'USA', leadSource: 'Cold Call', leadStatus: 'contacted', leadScore: 55, isLead: true, ownerName: 'Alex Johnson', tags: ['procurement'], customFields: {}, lastContactedAt: '2024-01-15T09:30:00Z', interactionCount: 10, dealsCount: 1, totalDealsValue: 95000, createdAt: '2023-08-12T11:00:00Z', updatedAt: '2024-01-15T09:30:00Z' },
  { id: '5', firstName: 'David', lastName: 'Kim', fullName: 'David Kim', email: 'david@innovatetech.co', phone: '+1 (555) 567-8901', jobTitle: 'CEO', department: 'Executive', accountId: '5', accountName: 'InnovateTech', city: 'Boston', state: 'MA', country: 'USA', leadSource: 'LinkedIn', leadStatus: 'new', leadScore: 45, isLead: true, ownerName: 'Emily White', tags: ['executive', 'new'], customFields: {}, interactionCount: 3, dealsCount: 1, totalDealsValue: 45000, createdAt: '2024-01-18T10:00:00Z', updatedAt: '2024-01-20T10:00:00Z' },
  { id: '6', firstName: 'Emma', lastName: 'Wilson', fullName: 'Emma Wilson', email: 'emma.w@cloudfirst.io', phone: '+1 (555) 678-9012', jobTitle: 'Head of Operations', department: 'Operations', accountId: '6', accountName: 'CloudFirst', city: 'Denver', state: 'CO', country: 'USA', leadSource: 'Website', leadStatus: 'converted', leadScore: 92, isLead: false, ownerName: 'Alex Johnson', tags: ['customer', 'ops'], customFields: {}, lastContactedAt: '2024-01-14T15:00:00Z', interactionCount: 15, dealsCount: 1, totalDealsValue: 35000, createdAt: '2023-05-08T09:00:00Z', updatedAt: '2024-01-14T15:00:00Z' },
];

const leadStatusColors: Record<LeadStatus, { bg: string; text: string }> = {
  new: { bg: 'bg-blue-50', text: 'text-blue-700' },
  contacted: { bg: 'bg-amber-50', text: 'text-amber-700' },
  qualified: { bg: 'bg-violet-50', text: 'text-violet-700' },
  unqualified: { bg: 'bg-slate-100', text: 'text-slate-600' },
  converted: { bg: 'bg-emerald-50', text: 'text-emerald-700' }
};

const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>(demoContacts);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'leads' | 'customers'>('all');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.accountName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesView = 
      viewMode === 'all' || 
      (viewMode === 'leads' && contact.isLead) ||
      (viewMode === 'customers' && !contact.isLead);
    
    return matchesSearch && matchesView;
  });

  const totalContacts = contacts.length;
  const totalLeads = contacts.filter(c => c.isLead).length;
  const totalCustomers = contacts.filter(c => !c.isLead).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-heading-1">Contacts</h1>
          <p className="text-body mt-1">Manage your leads and customers</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary btn-sm">
            <Upload size={16} />
            Import
          </button>
          <button className="btn btn-secondary btn-sm">
            <Download size={16} />
            Export
          </button>
          <button className="btn btn-primary btn-sm">
            <UserPlus size={16} />
            Add Contact
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button 
          onClick={() => setViewMode('all')}
          className={`card p-4 text-left transition-all ${viewMode === 'all' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">All Contacts</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalContacts}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100">
              <Users size={20} className="text-slate-600" />
            </div>
          </div>
        </button>
        <button 
          onClick={() => setViewMode('leads')}
          className={`card p-4 text-left transition-all ${viewMode === 'leads' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Leads</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{totalLeads}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-100">
              <Star size={20} className="text-amber-600" />
            </div>
          </div>
        </button>
        <button 
          onClick={() => setViewMode('customers')}
          className={`card p-4 text-left transition-all ${viewMode === 'customers' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Customers</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{totalCustomers}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-100">
              <Building2 size={20} className="text-emerald-600" />
            </div>
          </div>
        </button>
      </div>

      {/* Contacts Table */}
      <div className="card">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-with-icon-left"
            />
          </div>
          <div className="flex items-center gap-3">
            <select className="input input-sm w-auto">
              <option>All Sources</option>
              <option>Website</option>
              <option>Referral</option>
              <option>LinkedIn</option>
              <option>Trade Show</option>
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
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th>Contact</th>
                <th>Company</th>
                <th>Status</th>
                <th>Lead Score</th>
                <th>Last Contact</th>
                <th>Owner</th>
                <th className="w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map(contact => (
                <tr key={contact.id} className="group">
                  <td>
                    <input 
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar avatar-sm">
                        <span>{contact.firstName.charAt(0)}{contact.lastName?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{contact.fullName}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {contact.email && (
                            <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600">
                              <Mail size={12} />
                              {contact.email}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <p className="text-slate-700">{contact.accountName}</p>
                      <p className="text-xs text-slate-500">{contact.jobTitle}</p>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-sm ${leadStatusColors[contact.leadStatus].bg} ${leadStatusColors[contact.leadStatus].text}`}>
                      {contact.leadStatus}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            contact.leadScore >= 70 ? 'bg-emerald-500' : 
                            contact.leadScore >= 40 ? 'bg-amber-500' : 'bg-slate-300'
                          }`}
                          style={{ width: `${contact.leadScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-600">{contact.leadScore}</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-slate-600 text-sm">
                      {contact.lastContactedAt 
                        ? new Date(contact.lastContactedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : 'Never'
                      }
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar avatar-xs">
                        <span>{contact.ownerName?.charAt(0)}</span>
                      </div>
                      <span className="text-slate-600 text-sm">{contact.ownerName}</span>
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
                      <button className="btn btn-ghost btn-icon-sm" title="Call">
                        <Phone size={16} />
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
            Showing <span className="font-medium">{filteredContacts.length}</span> of <span className="font-medium">{contacts.length}</span> contacts
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

export default Contacts;

