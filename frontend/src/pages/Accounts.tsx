import React, { useEffect, useState } from 'react';
import { Plus, Search, Filter, Building2, Globe, Phone, Edit, Trash2, Eye, Users } from 'lucide-react';
import { accountsApi } from '../services/api';
import type { Account, PageResponse } from '../types';

const Accounts: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchAccounts();
  }, [currentPage]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await accountsApi.getAll({ page: currentPage, size: 10 });
      if (response.data.success) {
        const pageData = response.data.data as PageResponse<Account>;
        setAccounts(pageData.content);
        setTotalPages(pageData.totalPages);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;
    try {
      await accountsApi.delete(id);
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Accounts</h1>
          <p className="text-slate-500 mt-1">Manage your company accounts</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={20} />
          <span>Add Account</span>
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search accounts..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <Filter size={20} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-slate-500">No accounts found</p>
          </div>
        ) : (
          accounts.map((account) => (
            <div key={account.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Building2 className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{account.name}</h3>
                    <p className="text-sm text-slate-500">{account.industry || 'No industry'}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                {account.website && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Globe size={14} />
                    <a href={account.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                      {account.website}
                    </a>
                  </div>
                )}
                {account.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={14} />
                    <span>{account.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Users size={14} />
                  <span>{account.customerCount} contacts</span>
                </div>
              </div>
              
              {account.tags && account.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {account.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Eye size={18} />
                </button>
                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(account.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Accounts;

