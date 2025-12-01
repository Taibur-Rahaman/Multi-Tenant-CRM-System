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
  User,
  X,
  Loader2,
  Trash2
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

interface InteractionFormData {
  type: InteractionType;
  direction: string;
  subject: string;
  description: string;
  customerName: string;
  tags: string;
}

const Interactions: React.FC = () => {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterType, setFilterType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<InteractionFormData>({
    type: 'CALL' as InteractionType,
    direction: 'OUTBOUND',
    subject: '',
    description: '',
    customerName: '',
    tags: ''
  });
  const [saving, setSaving] = useState(false);

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
        localStorage.setItem('crm_interactions', JSON.stringify(pageData.content));
      }
    } catch (error) {
      console.log('Using local storage for interactions');
      const stored = localStorage.getItem('crm_interactions');
      if (stored) {
        const all = JSON.parse(stored) as Interaction[];
        const filtered = filterType ? all.filter(i => i.type === filterType) : all;
        setInteractions(filtered);
      } else {
        const now = new Date();
        const demoInteractions: Interaction[] = [
          { id: '1', type: 'CALL' as InteractionType, direction: 'OUTBOUND', subject: 'Follow-up call with TechCorp', description: 'Discussed contract renewal options. Customer interested in premium tier.', customerName: 'John Smith', createdAt: new Date(now.getTime() - 3600000).toISOString(), durationSeconds: 720, summary: 'Positive call. Customer considering upgrade to premium plan.', tags: ['renewal', 'upsell'] },
          { id: '2', type: 'EMAIL' as InteractionType, direction: 'INBOUND', subject: 'Re: Pricing Proposal', description: 'Sarah from StartupXYZ requested additional information about enterprise features.', customerName: 'Sarah Johnson', createdAt: new Date(now.getTime() - 7200000).toISOString(), tags: ['pricing', 'enterprise'] },
          { id: '3', type: 'MEETING' as InteractionType, direction: 'OUTBOUND', subject: 'Product Demo - Global Inc', description: 'Presented full product demo to Global Inc team.', customerName: 'Michael Brown', createdAt: new Date(now.getTime() - 86400000).toISOString(), durationSeconds: 2700, summary: 'Demo well received. Next step: pilot program.', tags: ['demo', 'pilot'] },
          { id: '4', type: 'EMAIL' as InteractionType, direction: 'OUTBOUND', subject: 'Contract Sent - Innovate Co', description: 'Sent final contract with agreed terms to Emily Davis.', customerName: 'Emily Davis', createdAt: new Date(now.getTime() - 172800000).toISOString(), tags: ['contract'] },
          { id: '5', type: 'CALL' as InteractionType, direction: 'INBOUND', subject: 'Support inquiry from CloudBase', description: 'James Taylor called about API integration issues.', customerName: 'James Taylor', createdAt: new Date(now.getTime() - 259200000).toISOString(), durationSeconds: 480, tags: ['support', 'api'] },
        ];
        localStorage.setItem('crm_interactions', JSON.stringify(demoInteractions));
        setInteractions(demoInteractions);
      }
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.subject) return;
    setSaving(true);

    const newInteraction: Interaction = {
      id: Date.now().toString(),
      type: formData.type,
      direction: formData.direction,
      subject: formData.subject,
      description: formData.description,
      customerName: formData.customerName,
      createdAt: new Date().toISOString(),
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
    };

    try {
      await interactionsApi.create(newInteraction);
      fetchInteractions();
    } catch (error) {
      const stored = localStorage.getItem('crm_interactions');
      const all = stored ? JSON.parse(stored) as Interaction[] : [];
      const updated = [newInteraction, ...all];
      localStorage.setItem('crm_interactions', JSON.stringify(updated));
      setInteractions(updated);
    }

    setShowModal(false);
    setFormData({ type: 'CALL' as InteractionType, direction: 'OUTBOUND', subject: '', description: '', customerName: '', tags: '' });
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this interaction?')) return;
    try {
      await interactionsApi.delete(id);
      fetchInteractions();
    } catch (error) {
      const stored = localStorage.getItem('crm_interactions');
      if (stored) {
        const all = JSON.parse(stored) as Interaction[];
        const filtered = all.filter(i => i.id !== id);
        localStorage.setItem('crm_interactions', JSON.stringify(filtered));
        setInteractions(prev => prev.filter(i => i.id !== id));
      }
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

  const filteredInteractions = interactions.filter(i =>
    !searchQuery || 
    i.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Interactions</h1>
          <p className="text-slate-500 mt-1">Track all customer interactions</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredInteractions.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500">No interactions found</p>
            <button onClick={() => setShowModal(true)} className="mt-4 text-blue-600 hover:text-blue-700">
              Log your first interaction
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredInteractions.map((interaction) => {
              const Icon = typeIcons[interaction.type] || MessageSquare;
              return (
                <div key={interaction.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${typeColors[interaction.type]}`}>
                      <Icon size={20} />
                    </div>
                    
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
                          <button
                            onClick={() => handleDelete(interaction.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
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

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Log New Interaction</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as InteractionType})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  >
                    <option value="CALL">Call</option>
                    <option value="EMAIL">Email</option>
                    <option value="MEETING">Meeting</option>
                    <option value="MESSAGE">Message</option>
                    <option value="COMPLAINT">Complaint</option>
                    <option value="NOTE">Note</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Direction</label>
                  <select
                    value={formData.direction}
                    onChange={(e) => setFormData({...formData, direction: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  >
                    <option value="OUTBOUND">Outbound</option>
                    <option value="INBOUND">Inbound</option>
                    <option value="INTERNAL">Internal</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Subject *</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="Interaction subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="Details of the interaction..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="Customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="tag1, tag2, tag3 (comma separated)"
                />
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
                onClick={handleCreate}
                disabled={saving || !formData.subject}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {saving && <Loader2 className="animate-spin" size={16} />}
                Log Interaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Interactions;
