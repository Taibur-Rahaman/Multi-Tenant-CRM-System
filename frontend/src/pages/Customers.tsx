import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Mail,
  Phone,
  Building2,
  Edit,
  Trash2,
  Eye,
  X,
  Loader2
} from 'lucide-react';
import { customersApi } from '../services/api';
import type { Customer, PageResponse } from '../types';

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-green-100 text-green-700',
  converted: 'bg-purple-100 text-purple-700',
  lost: 'bg-red-100 text-red-700',
};

interface CustomerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  company: string;
  leadStatus: string;
}

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>({
    firstName: '', lastName: '', email: '', phone: '', jobTitle: '', company: '', leadStatus: 'new'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [currentPage]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customersApi.getAll({ page: currentPage, size: 10 });
      if (response.data.success) {
        const pageData = response.data.data as PageResponse<Customer>;
        setCustomers(pageData.content);
        setTotalPages(pageData.totalPages);
        // Store in localStorage for offline/demo mode
        localStorage.setItem('crm_customers', JSON.stringify(pageData.content));
      }
    } catch (error) {
      console.log('Using local storage data');
      // Load from localStorage or use demo data
      const stored = localStorage.getItem('crm_customers');
      if (stored) {
        setCustomers(JSON.parse(stored));
      } else {
        const demoCustomers: Customer[] = [
          { id: '1', firstName: 'John', lastName: 'Smith', fullName: 'John Smith', email: 'john.smith@techcorp.com', phone: '+1 555-0101', jobTitle: 'CTO', accountName: 'TechCorp Inc', leadStatus: 'qualified', ownerName: 'Admin User' },
          { id: '2', firstName: 'Sarah', lastName: 'Johnson', fullName: 'Sarah Johnson', email: 'sarah.j@startupxyz.io', phone: '+1 555-0102', jobTitle: 'CEO', accountName: 'StartupXYZ', leadStatus: 'new', ownerName: 'Admin User' },
          { id: '3', firstName: 'Michael', lastName: 'Brown', fullName: 'Michael Brown', email: 'mbrown@globalinc.com', phone: '+1 555-0103', jobTitle: 'VP Sales', accountName: 'Global Inc', leadStatus: 'contacted', ownerName: 'Admin User' },
          { id: '4', firstName: 'Emily', lastName: 'Davis', fullName: 'Emily Davis', email: 'emily.davis@innovate.co', phone: '+1 555-0104', jobTitle: 'Director', accountName: 'Innovate Co', leadStatus: 'converted', ownerName: 'Admin User' },
          { id: '5', firstName: 'David', lastName: 'Wilson', fullName: 'David Wilson', email: 'dwilson@enterprise.net', phone: '+1 555-0105', jobTitle: 'Manager', accountName: 'Enterprise Net', leadStatus: 'qualified', ownerName: 'Admin User' },
        ];
        setCustomers(demoCustomers);
        localStorage.setItem('crm_customers', JSON.stringify(demoCustomers));
      }
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchCustomers();
      return;
    }
    setLoading(true);
    try {
      const response = await customersApi.search(searchQuery, { page: 0, size: 10 });
      if (response.data.success) {
        const pageData = response.data.data as PageResponse<Customer>;
        setCustomers(pageData.content);
        setTotalPages(pageData.totalPages);
      }
    } catch (error) {
      // Local search
      const stored = localStorage.getItem('crm_customers');
      if (stored) {
        const all = JSON.parse(stored) as Customer[];
        const filtered = all.filter(c => 
          c.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.accountName?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setCustomers(filtered);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      await customersApi.delete(id);
      fetchCustomers();
    } catch (error) {
      // Delete from local storage
      const stored = localStorage.getItem('crm_customers');
      if (stored) {
        const all = JSON.parse(stored) as Customer[];
        const filtered = all.filter(c => c.id !== id);
        localStorage.setItem('crm_customers', JSON.stringify(filtered));
        setCustomers(filtered);
      }
    }
  };

  const openCreateModal = () => {
    setSelectedCustomer(null);
    setFormData({ firstName: '', lastName: '', email: '', phone: '', jobTitle: '', company: '', leadStatus: 'new' });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      email: customer.email || '',
      phone: customer.phone || '',
      jobTitle: customer.jobTitle || '',
      company: customer.accountName || '',
      leadStatus: customer.leadStatus || 'new'
    });
    setError('');
    setShowModal(true);
  };

  const openViewModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
  };

  const handleSave = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (selectedCustomer) {
        await customersApi.update(selectedCustomer.id, formData);
      } else {
        await customersApi.create(formData);
      }
      fetchCustomers();
      setShowModal(false);
    } catch (error) {
      // Save to local storage
      const stored = localStorage.getItem('crm_customers');
      const all = stored ? JSON.parse(stored) as Customer[] : [];

      if (selectedCustomer) {
        const updated = all.map(c => 
          c.id === selectedCustomer.id 
            ? { ...c, ...formData, fullName: `${formData.firstName} ${formData.lastName}`, accountName: formData.company }
            : c
        );
        localStorage.setItem('crm_customers', JSON.stringify(updated));
        setCustomers(updated);
      } else {
        const newCustomer: Customer = {
          id: Date.now().toString(),
          firstName: formData.firstName,
          lastName: formData.lastName,
          fullName: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          jobTitle: formData.jobTitle,
          accountName: formData.company,
          leadStatus: formData.leadStatus,
          ownerName: 'Admin User'
        };
        const updated = [newCustomer, ...all];
        localStorage.setItem('crm_customers', JSON.stringify(updated));
        setCustomers(updated);
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
          <p className="text-slate-500 mt-1">Manage your customers and leads</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search customers..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
            />
          </div>
          <button 
            onClick={handleSearch}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <Filter size={20} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No customers found</p>
            <button onClick={openCreateModal} className="mt-4 text-blue-600 hover:text-blue-700">
              Add your first customer
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Customer</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Contact</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Account</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Owner</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {customer.firstName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{customer.fullName}</p>
                          <p className="text-sm text-slate-500">{customer.jobTitle || 'No title'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail size={14} />
                            <span>{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone size={14} />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {customer.accountName ? (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Building2 size={14} />
                          <span>{customer.accountName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[customer.leadStatus] || 'bg-slate-100 text-slate-700'}`}>
                        {customer.leadStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{customer.ownerName || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openViewModal(customer)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => openEditModal(customer)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(customer.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Page {currentPage + 1} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">
                {selectedCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="john.doe@company.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="+1 555-0100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    placeholder="Manager"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    placeholder="Acme Inc"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Lead Status</label>
                <select
                  value={formData.leadStatus}
                  onChange={(e) => setFormData({...formData, leadStatus: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {saving && <Loader2 className="animate-spin" size={16} />}
                {saving ? 'Saving...' : (selectedCustomer ? 'Update Customer' : 'Create Customer')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Customer Details</h2>
              <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {selectedCustomer.firstName?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-800">{selectedCustomer.fullName}</h3>
                  <p className="text-slate-500">{selectedCustomer.jobTitle || 'No title'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Mail className="text-slate-400" size={20} />
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="text-slate-800">{selectedCustomer.email || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Phone className="text-slate-400" size={20} />
                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="text-slate-800">{selectedCustomer.phone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Building2 className="text-slate-400" size={20} />
                  <div>
                    <p className="text-xs text-slate-500">Company</p>
                    <p className="text-slate-800">{selectedCustomer.accountName || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-500">Status</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedCustomer.leadStatus] || 'bg-slate-100 text-slate-700'}`}>
                    {selectedCustomer.leadStatus}
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => { setShowViewModal(false); openEditModal(selectedCustomer); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Edit size={16} />
                Edit Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
