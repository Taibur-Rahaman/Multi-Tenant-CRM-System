/**
 * NeoBit CRM - Customers Page
 * 
 * Displays customer list with:
 * - Search and filtering
 * - Pagination
 * - Customer creation
 * - Quick actions
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { customersApi } from '../api/customers';

// Components
import Modal from '../components/common/Modal';
import CustomerForm from '../components/customers/CustomerForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';

// Icons
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const EmailIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const ChatIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const MoreIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

// Tag colors mapping
const tagColors = {
  vip: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  enterprise: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  new: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  lead: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  inactive: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

// Customer Row Component
function CustomerRow({ customer, onEdit, onDelete }) {
  const [showActions, setShowActions] = useState(false);

  return (
    <tr className="hover:bg-slate-800/50 transition-colors">
      {/* Customer Info */}
      <td className="px-6 py-4">
        <Link to={`/customers/${customer.id}`} className="flex items-center gap-4 group">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
            {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-white group-hover:text-violet-400 transition-colors">
              {customer.name}
            </p>
            {customer.company && (
              <p className="text-sm text-slate-400">{customer.company}</p>
            )}
          </div>
        </Link>
      </td>

      {/* Contact */}
      <td className="px-6 py-4">
        <div className="space-y-1">
          {customer.email && (
            <p className="text-sm text-slate-300 flex items-center gap-2">
              <EmailIcon />
              {customer.email}
            </p>
          )}
          {customer.phone && (
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <PhoneIcon />
              {customer.phone}
            </p>
          )}
        </div>
      </td>

      {/* Tags */}
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {customer.tags?.map((tag) => (
            <span
              key={tag}
              className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
                tagColors[tag] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      </td>

      {/* Assigned To */}
      <td className="px-6 py-4">
        {customer.assignedTo ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-300">
              {customer.assignedTo.name?.[0] || '?'}
            </div>
            <span className="text-sm text-slate-300">{customer.assignedTo.name}</span>
          </div>
        ) : (
          <span className="text-sm text-slate-500">Unassigned</span>
        )}
      </td>

      {/* Last Interaction */}
      <td className="px-6 py-4">
        {customer.lastInteractionAt ? (
          <span className="text-sm text-slate-400">
            {format(new Date(customer.lastInteractionAt), 'MMM d, yyyy')}
          </span>
        ) : (
          <span className="text-sm text-slate-500">No interactions</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          <button
            className="p-2 text-slate-400 hover:text-violet-400 hover:bg-slate-700 rounded-lg transition-colors"
            title="Send Email"
          >
            <EmailIcon />
          </button>
          <button
            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded-lg transition-colors"
            title="Start Call"
          >
            <PhoneIcon />
          </button>
          <button
            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700 rounded-lg transition-colors"
            title="Message"
          >
            <ChatIcon />
          </button>

          {/* More Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <MoreIcon />
            </button>
            
            {showActions && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowActions(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 py-1">
                  <button
                    onClick={() => {
                      onEdit(customer);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    Edit Customer
                  </button>
                  <Link
                    to={`/customers/${customer.id}`}
                    className="block px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    View Details
                  </Link>
                  <Link
                    to={`/interactions?customerId=${customer.id}`}
                    className="block px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    View Interactions
                  </Link>
                  <hr className="my-1 border-slate-700" />
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this customer?')) {
                        onDelete(customer.id);
                      }
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    Delete Customer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function Customers() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Get params from URL
  const page = parseInt(searchParams.get('page') || '0');
  const size = parseInt(searchParams.get('size') || '20');
  const search = searchParams.get('search') || '';
  const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];

  // Fetch customers
  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', { page, size, search, tags }],
    queryFn: () => customersApi.list({ page, size, search, tags: tags.join(',') }),
    keepPreviousData: true,
  });

  // Create customer mutation
  const createMutation = useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      setShowCreateModal(false);
      toast.success('Customer created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create customer');
    },
  });

  // Update customer mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => customersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      setEditingCustomer(null);
      toast.success('Customer updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update customer');
    },
  });

  // Delete customer mutation
  const deleteMutation = useMutation({
    mutationFn: customersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      toast.success('Customer deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete customer');
    },
  });

  // Handle search
  const handleSearch = (value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    params.set('page', '0');
    setSearchParams(params);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  // Handle export
  const handleExport = async () => {
    try {
      const response = await customersApi.export({ format: 'csv', search, tags: tags.join(',') });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      toast.success('Export started');
    } catch (error) {
      toast.error('Failed to export customers');
    }
  };

  // Render loading state
  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load customers</p>
          <button
            onClick={() => queryClient.invalidateQueries(['customers'])}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const customers = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const totalElements = data?.totalElements || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="text-slate-400 mt-1">
            {totalElements} total customers
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 flex items-center gap-2 transition-colors"
          >
            <DownloadIcon />
            Export
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl flex items-center gap-2 transition-colors"
          >
            <PlusIcon />
            Add Customer
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Search customers by name, email, or phone..."
            defaultValue={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-3 border rounded-xl flex items-center gap-2 transition-colors ${
            showFilters || tags.length > 0
              ? 'bg-violet-600 border-violet-500 text-white'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <FilterIcon />
          Filters
          {tags.length > 0 && (
            <span className="w-5 h-5 bg-white/20 rounded-full text-xs flex items-center justify-center">
              {tags.length}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="p-4 bg-slate-800 border border-slate-700 rounded-xl">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-slate-400 mr-2">Tags:</span>
            {['vip', 'enterprise', 'new', 'lead', 'active', 'inactive'].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  const currentTags = params.get('tags')?.split(',').filter(Boolean) || [];
                  if (currentTags.includes(tag)) {
                    const newTags = currentTags.filter((t) => t !== tag);
                    if (newTags.length > 0) {
                      params.set('tags', newTags.join(','));
                    } else {
                      params.delete('tags');
                    }
                  } else {
                    params.set('tags', [...currentTags, tag].join(','));
                  }
                  params.set('page', '0');
                  setSearchParams(params);
                }}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  tags.includes(tag)
                    ? tagColors[tag]
                    : 'bg-slate-700 text-slate-400 border-slate-600 hover:bg-slate-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Customers Table */}
      {customers.length > 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 text-left">
                  <th className="px-6 py-4 text-sm font-semibold text-slate-300">Customer</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-300">Contact</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-300">Tags</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-300">Assigned To</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-300">Last Activity</th>
                  <th className="px-6 py-4 text-sm font-semibold text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {customers.map((customer) => (
                  <CustomerRow
                    key={customer.id}
                    customer={customer}
                    onEdit={setEditingCustomer}
                    onDelete={deleteMutation.mutate}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-700">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          title="No customers found"
          description={search ? `No customers match "${search}"` : 'Get started by adding your first customer'}
          action={
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl flex items-center gap-2 transition-colors"
            >
              <PlusIcon />
              Add Customer
            </button>
          }
        />
      )}

      {/* Create Customer Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Customer"
      >
        <CustomerForm
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setShowCreateModal(false)}
          isLoading={createMutation.isLoading}
        />
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        isOpen={!!editingCustomer}
        onClose={() => setEditingCustomer(null)}
        title="Edit Customer"
      >
        <CustomerForm
          initialData={editingCustomer}
          onSubmit={(data) => updateMutation.mutate({ id: editingCustomer.id, data })}
          onCancel={() => setEditingCustomer(null)}
          isLoading={updateMutation.isLoading}
        />
      </Modal>
    </div>
  );
}

