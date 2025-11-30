import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  AlertCircle,
  FileText,
  Clock,
  User
} from 'lucide-react';
import { interactionsApi } from '../services/api';
import type { Interaction, PageResponse, InteractionType } from '../types';

const typeIcons: Record<InteractionType, React.ElementType> = {
  CALL: Phone,
  EMAIL: Mail,
  MEETING: Calendar,
  MESSAGE: MessageSquare,
  COMPLAINT: AlertCircle,
  NOTE: FileText,
  TASK: Clock,
};

const typeColors: Record<InteractionType, string> = {
  CALL: 'bg-blue-100 text-blue-700',
  EMAIL: 'bg-green-100 text-green-700',
  MEETING: 'bg-purple-100 text-purple-700',
  MESSAGE: 'bg-yellow-100 text-yellow-700',
  COMPLAINT: 'bg-red-100 text-red-700',
  NOTE: 'bg-slate-100 text-slate-700',
  TASK: 'bg-amber-100 text-amber-700',
};

const directionBadge: Record<string, string> = {
  INBOUND: 'bg-emerald-100 text-emerald-700',
  OUTBOUND: 'bg-blue-100 text-blue-700',
  INTERNAL: 'bg-slate-100 text-slate-700',
};

const Interactions: React.FC = () => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterType, setFilterType] = useState<string>('');

  useEffect(() => {
    fetchInteractions();
  }, [currentPage, filterType]);

  const fetchInteractions = async () => {
    try {
      setLoading(true);
      const response = filterType 
        ? await interactionsApi.getByType(filterType, { page: currentPage, size: 10 })
        : await interactionsApi.getAll({ page: currentPage, size: 10 });
      
      if (response.data.success) {
        const pageData = response.data.data as PageResponse<Interaction>;
        setInteractions(pageData.content);
        setTotalPages(pageData.totalPages);
      }
    } catch (error) {
      console.error('Error fetching interactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Interactions</h1>
          <p className="text-slate-500 mt-1">Track all customer interactions</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={20} />
          <span>Log Interaction</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search interactions..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setCurrentPage(0); }}
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
          >
            <option value="">All Types</option>
            <option value="CALL">Calls</option>
            <option value="EMAIL">Emails</option>
            <option value="MEETING">Meetings</option>
            <option value="MESSAGE">Messages</option>
            <option value="COMPLAINT">Complaints</option>
            <option value="NOTE">Notes</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <Filter size={20} />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : interactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No interactions found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {interactions.map((interaction) => {
              const Icon = typeIcons[interaction.type] || MessageSquare;
              return (
                <div key={interaction.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${typeColors[interaction.type]}`}>
                      <Icon size={20} />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-medium text-slate-800">
                            {interaction.subject || `${interaction.type} interaction`}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                            {interaction.customerName && (
                              <span className="flex items-center gap-1">
                                <User size={14} />
                                {interaction.customerName}
                              </span>
                            )}
                            <span>{formatDate(interaction.createdAt)}</span>
                            {interaction.durationSeconds && (
                              <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {formatDuration(interaction.durationSeconds)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${directionBadge[interaction.direction]}`}>
                            {interaction.direction}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[interaction.type]}`}>
                            {interaction.type}
                          </span>
                        </div>
                      </div>
                      
                      {interaction.description && (
                        <p className="mt-2 text-slate-600 text-sm line-clamp-2">
                          {interaction.description}
                        </p>
                      )}
                      
                      {interaction.summary && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>AI Summary:</strong> {interaction.summary}
                          </p>
                        </div>
                      )}
                      
                      {interaction.tags && interaction.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {interaction.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
    </div>
  );
};

export default Interactions;

