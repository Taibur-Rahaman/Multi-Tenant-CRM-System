import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  Circle,
  X,
  Loader2,
  Link2
} from 'lucide-react';

interface Issue {
  id: string;
  externalId: string;
  externalKey: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  provider: 'jira' | 'linear';
  url: string;
  customerName?: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  'todo': 'bg-slate-100 text-slate-700',
  'open': 'bg-blue-100 text-blue-700',
  'in_progress': 'bg-yellow-100 text-yellow-700',
  'in progress': 'bg-yellow-100 text-yellow-700',
  'done': 'bg-green-100 text-green-700',
  'closed': 'bg-green-100 text-green-700',
  'cancelled': 'bg-red-100 text-red-700',
};

const priorityColors: Record<string, string> = {
  'highest': 'text-red-600',
  'high': 'text-orange-600',
  'medium': 'text-yellow-600',
  'low': 'text-green-600',
  'lowest': 'text-slate-600',
};

const statusIcons: Record<string, React.ElementType> = {
  'todo': Circle,
  'open': Circle,
  'in_progress': Clock,
  'in progress': Clock,
  'done': CheckCircle2,
  'closed': CheckCircle2,
  'cancelled': AlertCircle,
};

const Issues: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignee: '',
    customerName: '',
    labels: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      // Try to fetch from backend
      const response = await fetch('/api/issues');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIssues(data.data);
          localStorage.setItem('crm_issues', JSON.stringify(data.data));
        }
      }
    } catch (error) {
      console.log('Using local storage for issues');
      // Load from localStorage or use demo data
      const stored = localStorage.getItem('crm_issues');
      if (stored) {
        setIssues(JSON.parse(stored));
      } else {
        const demoIssues: Issue[] = [
          { id: '1', externalId: 'CRM-101', externalKey: 'CRM-101', title: 'API integration failing for TechCorp', description: 'Customer reported API sync issues with their system', status: 'in_progress', priority: 'high', assignee: 'Developer Team', provider: 'jira', url: 'https://jira.example.com/CRM-101', customerName: 'John Smith', labels: ['bug', 'integration'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: '2', externalId: 'CRM-102', externalKey: 'CRM-102', title: 'Feature request: Export to CSV', description: 'StartupXYZ requested CSV export functionality', status: 'todo', priority: 'medium', assignee: 'Product Team', provider: 'jira', url: 'https://jira.example.com/CRM-102', customerName: 'Sarah Johnson', labels: ['feature', 'export'], createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString() },
          { id: '3', externalId: 'CRM-103', externalKey: 'CRM-103', title: 'Dashboard loading slowly', description: 'Performance issue reported by multiple customers', status: 'in_progress', priority: 'highest', assignee: 'Backend Team', provider: 'linear', url: 'https://linear.app/CRM-103', labels: ['performance', 'urgent'], createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date().toISOString() },
          { id: '4', externalId: 'CRM-104', externalKey: 'CRM-104', title: 'Add dark mode support', description: 'Multiple requests for dark mode theme', status: 'todo', priority: 'low', assignee: 'Frontend Team', provider: 'linear', url: 'https://linear.app/CRM-104', labels: ['feature', 'ui'], createdAt: new Date(Date.now() - 259200000).toISOString(), updatedAt: new Date().toISOString() },
          { id: '5', externalId: 'CRM-100', externalKey: 'CRM-100', title: 'Initial setup documentation', description: 'Create getting started guide for new customers', status: 'done', priority: 'medium', assignee: 'Documentation Team', provider: 'jira', url: 'https://jira.example.com/CRM-100', labels: ['docs'], createdAt: new Date(Date.now() - 604800000).toISOString(), updatedAt: new Date().toISOString() },
        ];
        setIssues(demoIssues);
        localStorage.setItem('crm_issues', JSON.stringify(demoIssues));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIssue = async () => {
    if (!formData.title) return;
    setSaving(true);

    const newIssue: Issue = {
      id: Date.now().toString(),
      externalId: `CRM-${Math.floor(Math.random() * 1000)}`,
      externalKey: `CRM-${Math.floor(Math.random() * 1000)}`,
      title: formData.title,
      description: formData.description,
      status: 'todo',
      priority: formData.priority,
      assignee: formData.assignee || 'Unassigned',
      provider: 'jira',
      url: '#',
      customerName: formData.customerName,
      labels: formData.labels.split(',').map(l => l.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // Try to create via backend
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIssue)
      });
      if (response.ok) {
        fetchIssues();
      } else {
        throw new Error('Backend not available');
      }
    } catch (error) {
      // Save to local storage
      const updated = [newIssue, ...issues];
      localStorage.setItem('crm_issues', JSON.stringify(updated));
      setIssues(updated);
    }

    setShowModal(false);
    setFormData({ title: '', description: '', priority: 'medium', assignee: '', customerName: '', labels: '' });
    setSaving(false);
  };

  const updateStatus = async (issueId: string, newStatus: string) => {
    const updated = issues.map(issue => 
      issue.id === issueId ? { ...issue, status: newStatus, updatedAt: new Date().toISOString() } : issue
    );
    setIssues(updated);
    localStorage.setItem('crm_issues', JSON.stringify(updated));
  };

  const filteredIssues = issues.filter(issue => {
    if (filterStatus && issue.status !== filterStatus) return false;
    if (searchQuery && !issue.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Issue Tracking</h1>
          <p className="text-slate-500 mt-1">Manage issues synced from Jira and Linear</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>Create Issue</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Circle className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{issues.filter(i => i.status === 'todo' || i.status === 'open').length}</p>
              <p className="text-sm text-slate-500">Open</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="text-yellow-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{issues.filter(i => i.status === 'in_progress' || i.status === 'in progress').length}</p>
              <p className="text-sm text-slate-500">In Progress</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{issues.filter(i => i.status === 'done' || i.status === 'closed').length}</p>
              <p className="text-sm text-slate-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{issues.filter(i => i.priority === 'highest' || i.priority === 'high').length}</p>
              <p className="text-sm text-slate-500">High Priority</p>
            </div>
          </div>
        </div>
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
              placeholder="Search issues..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
          >
            <option value="">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>

      {/* Issues List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500">No issues found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredIssues.map((issue) => {
              const StatusIcon = statusIcons[issue.status.toLowerCase()] || Circle;
              return (
                <div key={issue.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 ${statusColors[issue.status.toLowerCase()] || 'bg-slate-100 text-slate-700'} p-2 rounded-lg`}>
                      <StatusIcon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-slate-500">{issue.externalKey}</span>
                            <span className={`text-sm font-medium ${priorityColors[issue.priority] || 'text-slate-600'}`}>
                              ● {issue.priority}
                            </span>
                            {issue.provider && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded capitalize">
                                {issue.provider}
                              </span>
                            )}
                          </div>
                          <h3 className="font-medium text-slate-800 mt-1">{issue.title}</h3>
                          {issue.description && (
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{issue.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                            <span>Assignee: {issue.assignee}</span>
                            {issue.customerName && <span>Customer: {issue.customerName}</span>}
                            <span>Created: {formatDate(issue.createdAt)}</span>
                          </div>
                          {issue.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {issue.labels.map((label, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                                  {label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={issue.status}
                            onChange={(e) => updateStatus(issue.id, e.target.value)}
                            className="text-sm px-2 py-1 border border-slate-200 rounded-lg"
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="done">Done</option>
                          </select>
                          {issue.url && issue.url !== '#' && (
                            <a
                              href={issue.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <ExternalLink size={18} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">Create New Issue</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="Issue title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="Describe the issue..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  >
                    <option value="lowest">Lowest</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="highest">Highest</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assignee</label>
                  <input
                    type="text"
                    value={formData.assignee}
                    onChange={(e) => setFormData({...formData, assignee: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    placeholder="Team or person"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Related Customer</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="Customer name (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Labels</label>
                <input
                  type="text"
                  value={formData.labels}
                  onChange={(e) => setFormData({...formData, labels: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="bug, feature, urgent (comma separated)"
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
                onClick={handleCreateIssue}
                disabled={saving || !formData.title}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {saving && <Loader2 className="animate-spin" size={16} />}
                Create Issue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Issues;

