import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  Circle,
  X,
  Loader2,
  RefreshCw,
  Trash2,
  Edit
} from 'lucide-react';

interface Issue {
  id: string;
  externalKey: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  provider: 'jira' | 'linear' | 'internal';
  url: string;
  customerName?: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  'todo': 'bg-slate-100 text-slate-700',
  'in_progress': 'bg-amber-100 text-amber-700',
  'done': 'bg-green-100 text-green-700',
  'cancelled': 'bg-red-100 text-red-700',
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  'highest': { color: 'text-red-600', label: '🔴 Highest' },
  'high': { color: 'text-orange-600', label: '🟠 High' },
  'medium': { color: 'text-yellow-600', label: '🟡 Medium' },
  'low': { color: 'text-green-600', label: '🟢 Low' },
  'lowest': { color: 'text-slate-500', label: '⚪ Lowest' },
};

const providerConfig: Record<string, { bg: string; icon: string }> = {
  'jira': { bg: 'bg-blue-600 text-white', icon: '🔷' },
  'linear': { bg: 'bg-violet-600 text-white', icon: '💜' },
  'internal': { bg: 'bg-slate-600 text-white', icon: '📋' },
};

const statusIcons: Record<string, React.ElementType> = {
  'todo': Circle,
  'in_progress': Clock,
  'done': CheckCircle2,
  'cancelled': AlertCircle,
};

// Demo Jira issues that will be "synced"
const JIRA_DEMO_ISSUES: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { externalKey: 'CRM-101', title: 'Customer data export not working', description: 'Users report that CSV export times out for large datasets', status: 'in_progress', priority: 'high', assignee: 'Backend Team', provider: 'jira', url: 'https://your-company.atlassian.net/browse/CRM-101', customerName: 'TechCorp Inc', labels: ['bug', 'export'] },
  { externalKey: 'CRM-102', title: 'Add bulk email feature', description: 'Feature request to send bulk emails to customer segments', status: 'todo', priority: 'medium', assignee: 'Product Team', provider: 'jira', url: 'https://your-company.atlassian.net/browse/CRM-102', labels: ['feature', 'email'] },
  { externalKey: 'CRM-103', title: 'Dashboard charts not loading', description: 'Charts show loading spinner indefinitely on Safari', status: 'todo', priority: 'highest', assignee: 'Frontend Team', provider: 'jira', url: 'https://your-company.atlassian.net/browse/CRM-103', labels: ['bug', 'ui', 'safari'] },
  { externalKey: 'CRM-104', title: 'Improve search performance', description: 'Search takes too long for accounts with 10k+ customers', status: 'in_progress', priority: 'high', assignee: 'Backend Team', provider: 'jira', url: 'https://your-company.atlassian.net/browse/CRM-104', labels: ['performance'] },
  { externalKey: 'CRM-105', title: 'Add Slack integration', description: 'Notify sales team on Slack when new lead is created', status: 'done', priority: 'medium', assignee: 'Integration Team', provider: 'jira', url: 'https://your-company.atlassian.net/browse/CRM-105', labels: ['feature', 'integration'] },
];

// Demo Linear issues that will be "synced"
const LINEAR_DEMO_ISSUES: Omit<Issue, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { externalKey: 'NEO-42', title: 'Mobile app crashes on login', description: 'Android users experiencing crashes when using Google OAuth', status: 'in_progress', priority: 'highest', assignee: 'Mobile Team', provider: 'linear', url: 'https://linear.app/neobit/issue/NEO-42', labels: ['bug', 'mobile', 'critical'] },
  { externalKey: 'NEO-43', title: 'Implement dark mode', description: 'Add dark mode theme option for all pages', status: 'todo', priority: 'low', assignee: 'Design Team', provider: 'linear', url: 'https://linear.app/neobit/issue/NEO-43', labels: ['feature', 'ui'] },
  { externalKey: 'NEO-44', title: 'API rate limiting', description: 'Add rate limiting to prevent API abuse', status: 'done', priority: 'high', assignee: 'Security Team', provider: 'linear', url: 'https://linear.app/neobit/issue/NEO-44', labels: ['security', 'api'] },
  { externalKey: 'NEO-45', title: 'Add webhook support', description: 'Allow customers to configure webhooks for events', status: 'todo', priority: 'medium', assignee: 'Backend Team', provider: 'linear', url: 'https://linear.app/neobit/issue/NEO-45', labels: ['feature', 'api'] },
  { externalKey: 'NEO-46', title: 'Fix timezone issues in reports', description: 'Reports show wrong dates for users in different timezones', status: 'in_progress', priority: 'medium', assignee: 'Backend Team', provider: 'linear', url: 'https://linear.app/neobit/issue/NEO-46', customerName: 'Global Corp', labels: ['bug', 'reports'] },
];

const Issues: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProvider, setFilterProvider] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [syncing, setSyncing] = useState<string | null>(null);
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
    loadIssues();
  }, []);

  const loadIssues = () => {
    setLoading(true);
    const stored = localStorage.getItem('crm_issues');
    if (stored) {
      setIssues(JSON.parse(stored));
    } else {
      // Start with a few internal issues
      const initialIssues: Issue[] = [
        {
          id: '1',
          externalKey: 'INT-001',
          title: 'Setup project documentation',
          description: 'Create comprehensive documentation for the CRM system',
          status: 'done',
          priority: 'medium',
          assignee: 'Documentation Team',
          provider: 'internal',
          url: '',
          labels: ['docs'],
          createdAt: new Date(Date.now() - 604800000).toISOString(),
          updatedAt: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: '2',
          externalKey: 'INT-002',
          title: 'Customer onboarding workflow',
          description: 'Design and implement customer onboarding process',
          status: 'in_progress',
          priority: 'high',
          assignee: 'Product Team',
          provider: 'internal',
          url: '',
          customerName: 'New Customers',
          labels: ['workflow', 'onboarding'],
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      setIssues(initialIssues);
      localStorage.setItem('crm_issues', JSON.stringify(initialIssues));
    }
    setLoading(false);
  };

  const saveIssues = (newIssues: Issue[]) => {
    setIssues(newIssues);
    localStorage.setItem('crm_issues', JSON.stringify(newIssues));
  };

  const handleSyncJira = async () => {
    setSyncing('jira');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Get existing Jira issue keys to avoid duplicates
    const existingKeys = new Set(issues.filter(i => i.provider === 'jira').map(i => i.externalKey));
    
    // Add new issues that don't exist yet
    const newIssues: Issue[] = JIRA_DEMO_ISSUES
      .filter(issue => !existingKeys.has(issue.externalKey))
      .map(issue => ({
        ...issue,
        id: `jira-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(Date.now() - Math.random() * 604800000).toISOString(),
        updatedAt: new Date().toISOString()
      }));
    
    if (newIssues.length > 0) {
      const updated = [...newIssues, ...issues];
      saveIssues(updated);
      alert(`✅ Synced ${newIssues.length} issues from Jira!`);
    } else {
      alert('ℹ️ All Jira issues are already synced.');
    }
    
    setSyncing(null);
  };

  const handleSyncLinear = async () => {
    setSyncing('linear');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Get existing Linear issue keys to avoid duplicates
    const existingKeys = new Set(issues.filter(i => i.provider === 'linear').map(i => i.externalKey));
    
    // Add new issues that don't exist yet
    const newIssues: Issue[] = LINEAR_DEMO_ISSUES
      .filter(issue => !existingKeys.has(issue.externalKey))
      .map(issue => ({
        ...issue,
        id: `linear-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(Date.now() - Math.random() * 604800000).toISOString(),
        updatedAt: new Date().toISOString()
      }));
    
    if (newIssues.length > 0) {
      const updated = [...newIssues, ...issues];
      saveIssues(updated);
      alert(`✅ Synced ${newIssues.length} issues from Linear!`);
    } else {
      alert('ℹ️ All Linear issues are already synced.');
    }
    
    setSyncing(null);
  };

  const handleSyncAll = async () => {
    setSyncing('all');
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSyncing('jira');
    await handleSyncJira();
    setSyncing('linear');
    await handleSyncLinear();
    setSyncing(null);
  };

  const openCreateModal = () => {
    setEditingIssue(null);
    setFormData({ title: '', description: '', priority: 'medium', assignee: '', customerName: '', labels: '' });
    setShowModal(true);
  };

  const openEditModal = (issue: Issue) => {
    setEditingIssue(issue);
    setFormData({
      title: issue.title,
      description: issue.description || '',
      priority: issue.priority,
      assignee: issue.assignee || '',
      customerName: issue.customerName || '',
      labels: issue.labels.join(', ')
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    if (editingIssue) {
      // Update existing issue
      const updated = issues.map(issue => 
        issue.id === editingIssue.id 
          ? {
              ...issue,
              title: formData.title,
              description: formData.description,
              priority: formData.priority,
              assignee: formData.assignee || 'Unassigned',
              customerName: formData.customerName,
              labels: formData.labels.split(',').map(l => l.trim()).filter(Boolean),
              updatedAt: new Date().toISOString()
            }
          : issue
      );
      saveIssues(updated);
    } else {
      // Create new issue
      const issueCount = issues.filter(i => i.provider === 'internal').length + 1;
      const newIssue: Issue = {
        id: `internal-${Date.now()}`,
        externalKey: `INT-${String(issueCount).padStart(3, '0')}`,
        title: formData.title,
        description: formData.description,
        status: 'todo',
        priority: formData.priority,
        assignee: formData.assignee || 'Unassigned',
        provider: 'internal',
        url: '',
        customerName: formData.customerName,
        labels: formData.labels.split(',').map(l => l.trim()).filter(Boolean),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveIssues([newIssue, ...issues]);
    }

    setShowModal(false);
    setSaving(false);
  };

  const handleStatusChange = (issueId: string, newStatus: string) => {
    const updated = issues.map(issue => 
      issue.id === issueId 
        ? { ...issue, status: newStatus, updatedAt: new Date().toISOString() }
        : issue
    );
    saveIssues(updated);
  };

  const handleDelete = (issueId: string) => {
    if (!confirm('Are you sure you want to delete this issue?')) return;
    const updated = issues.filter(issue => issue.id !== issueId);
    saveIssues(updated);
  };

  const filteredIssues = issues.filter(issue => {
    if (filterStatus && issue.status !== filterStatus) return false;
    if (filterProvider && issue.provider !== filterProvider) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return issue.title.toLowerCase().includes(query) ||
             issue.externalKey.toLowerCase().includes(query) ||
             issue.description?.toLowerCase().includes(query);
    }
    return true;
  });

  const stats = {
    total: issues.length,
    jira: issues.filter(i => i.provider === 'jira').length,
    linear: issues.filter(i => i.provider === 'linear').length,
    internal: issues.filter(i => i.provider === 'internal').length,
    todo: issues.filter(i => i.status === 'todo').length,
    inProgress: issues.filter(i => i.status === 'in_progress').length,
    done: issues.filter(i => i.status === 'done').length,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Issue Tracking</h1>
          <p className="text-slate-500 mt-1">Sync and manage issues from Jira & Linear</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSyncAll}
            disabled={syncing !== null}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Syncing...' : 'Sync All'}</span>
          </button>
          <button 
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={20} />
            <span>New Issue</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 text-center">
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          <p className="text-xs text-slate-500">Total</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-200 text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-lg">🔷</span>
            <p className="text-2xl font-bold text-blue-600">{stats.jira}</p>
          </div>
          <p className="text-xs text-slate-500">Jira</p>
          <button 
            onClick={handleSyncJira}
            disabled={syncing !== null}
            className="mt-2 text-xs text-blue-600 hover:underline disabled:opacity-50"
          >
            {syncing === 'jira' ? 'Syncing...' : 'Sync'}
          </button>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-violet-200 text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-lg">💜</span>
            <p className="text-2xl font-bold text-violet-600">{stats.linear}</p>
          </div>
          <p className="text-xs text-slate-500">Linear</p>
          <button 
            onClick={handleSyncLinear}
            disabled={syncing !== null}
            className="mt-2 text-xs text-violet-600 hover:underline disabled:opacity-50"
          >
            {syncing === 'linear' ? 'Syncing...' : 'Sync'}
          </button>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 text-center">
          <div className="flex items-center justify-center gap-1">
            <span className="text-lg">📋</span>
            <p className="text-2xl font-bold text-slate-600">{stats.internal}</p>
          </div>
          <p className="text-xs text-slate-500">Internal</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 text-center">
          <p className="text-2xl font-bold text-slate-600">{stats.todo}</p>
          <p className="text-xs text-slate-500">To Do</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-200 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.inProgress}</p>
          <p className="text-xs text-slate-500">In Progress</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.done}</p>
          <p className="text-xs text-slate-500">Done</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search issues by title, key, or description..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 outline-none text-sm"
          >
            <option value="">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 outline-none text-sm"
          >
            <option value="">All Sources</option>
            <option value="jira">🔷 Jira</option>
            <option value="linear">💜 Linear</option>
            <option value="internal">📋 Internal</option>
          </select>
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 font-medium">No issues found</p>
            <p className="text-sm text-slate-400 mt-1">Click "Sync" to import issues from Jira or Linear</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Issue</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Priority</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Assignee</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Updated</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIssues.map((issue) => {
                  const StatusIcon = statusIcons[issue.status] || Circle;
                  const priorityInfo = priorityConfig[issue.priority] || priorityConfig.medium;
                  const providerInfo = providerConfig[issue.provider];
                  
                  return (
                    <tr key={issue.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${providerInfo.bg}`}>
                            {providerInfo.icon} {issue.externalKey}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 truncate max-w-md">{issue.title}</p>
                            {issue.labels.length > 0 && (
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {issue.labels.slice(0, 3).map((label, idx) => (
                                  <span key={idx} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                                    {label}
                                  </span>
                                ))}
                                {issue.labels.length > 3 && (
                                  <span className="text-xs text-slate-400">+{issue.labels.length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={issue.status}
                          onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${statusColors[issue.status]}`}
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${priorityInfo.color}`}>
                          {priorityInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-600">{issue.assignee}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-500">{formatDate(issue.updatedAt)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(issue)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          {issue.url && (
                            <a
                              href={issue.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title={`Open in ${issue.provider}`}
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                          <button
                            onClick={() => handleDelete(issue.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">
                {editingIssue ? `Edit Issue: ${editingIssue.externalKey}` : 'Create New Issue'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="What needs to be done?"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                  placeholder="Add more details..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
                  >
                    <option value="highest">🔴 Highest</option>
                    <option value="high">🟠 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                    <option value="lowest">⚪ Lowest</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assignee</label>
                  <input
                    type="text"
                    value={formData.assignee}
                    onChange={(e) => setFormData({...formData, assignee: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
                  placeholder="Customer name (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Labels</label>
                <input
                  type="text"
                  value={formData.labels}
                  onChange={(e) => setFormData({...formData, labels: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
                  placeholder="bug, feature, urgent (comma separated)"
                />
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.title.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {saving && <Loader2 className="animate-spin" size={16} />}
                {editingIssue ? 'Update' : 'Create'} Issue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Issues;
