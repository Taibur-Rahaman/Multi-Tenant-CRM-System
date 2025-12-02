import React, { useEffect, useState, useCallback } from 'react';
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
  Edit,
  Settings,
  Link2
} from 'lucide-react';
import { issuesApi, integrationsApi, IntegrationStatus } from '../services/api';

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

const Issues: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showJiraModal, setShowJiraModal] = useState(false);
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
    labels: '',
    createInJira: false,
    jiraProjectKey: ''
  });
  const [saving, setSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    jiraConfigured: boolean;
    linearConfigured: boolean;
    totalIssues: number;
    jiraIssues: number;
    linearIssues: number;
    internalIssues: number;
  } | null>(null);
  
  // Jira config form
  const [jiraConfig, setJiraConfig] = useState({
    baseUrl: '',
    email: '',
    apiToken: '',
    defaultProjectKey: ''
  });
  const [jiraConnectionStatus, setJiraConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [jiraError, setJiraError] = useState('');

  const loadIssues = useCallback(async () => {
    try {
      setLoading(true);
      const response = await issuesApi.getAll({ page: 0, size: 100 });
      if (response.data?.data?.content) {
        const mapped = response.data.data.content.map((issue: any) => ({
          id: issue.id,
          externalKey: issue.externalKey || issue.id.substring(0, 8),
          title: issue.title,
          description: issue.description || '',
          status: issue.status,
          priority: issue.priority || 'medium',
          assignee: issue.assignee || 'Unassigned',
          provider: issue.provider || 'internal',
          url: issue.url || '',
          customerName: issue.customerName,
          labels: issue.labels || [],
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt
        }));
        setIssues(mapped);
      }
    } catch (error) {
      console.error('Failed to load issues:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSyncStatus = useCallback(async () => {
    try {
      const response = await issuesApi.getSyncStatus();
      if (response.data?.data) {
        setSyncStatus(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  }, []);

  const loadJiraStatus = useCallback(async () => {
    try {
      const response = await integrationsApi.getStatus('jira');
      if (response.data?.data?.isConfigured && response.data.data.config) {
        const config = response.data.data.config;
        setJiraConfig(prev => ({
          ...prev,
          baseUrl: (config.baseUrl as string) || '',
          defaultProjectKey: (config.defaultProjectKey as string) || ''
        }));
        if (response.data.data.isEnabled) {
          setJiraConnectionStatus('connected');
        }
      }
    } catch (error) {
      console.error('Failed to load Jira status:', error);
    }
  }, []);

  useEffect(() => {
    loadIssues();
    loadSyncStatus();
    loadJiraStatus();
  }, [loadIssues, loadSyncStatus, loadJiraStatus]);

  const handleSyncJira = async () => {
    if (!syncStatus?.jiraConfigured) {
      setShowJiraModal(true);
      return;
    }
    
    setSyncing('jira');
    try {
      const response = await issuesApi.syncFromJira();
      if (response.data?.data) {
        const count = response.data.data.syncedCount || 0;
        alert(`✅ Synced ${count} issues from Jira!`);
        loadIssues();
        loadSyncStatus();
      }
    } catch (error: any) {
      console.error('Jira sync failed:', error);
      alert('Failed to sync from Jira: ' + (error.response?.data?.message || error.message));
    } finally {
      setSyncing(null);
    }
  };

  const handleSyncLinear = async () => {
    setSyncing('linear');
    try {
      const response = await issuesApi.syncFromLinear();
      if (response.data?.data) {
        const count = response.data.data.syncedCount || 0;
        alert(`✅ Synced ${count} issues from Linear!`);
        loadIssues();
        loadSyncStatus();
      }
    } catch (error: any) {
      console.error('Linear sync failed:', error);
      alert('Failed to sync from Linear: ' + (error.response?.data?.message || error.message));
    } finally {
      setSyncing(null);
    }
  };

  const handleSyncAll = async () => {
    setSyncing('all');
    try {
      const response = await issuesApi.syncAll();
      if (response.data?.data) {
        const { jiraSynced, linearSynced, totalSynced } = response.data.data;
        alert(`✅ Sync complete!\n- Jira: ${jiraSynced} issues\n- Linear: ${linearSynced} issues\n- Total: ${totalSynced} issues`);
        loadIssues();
        loadSyncStatus();
      }
    } catch (error: any) {
      console.error('Sync failed:', error);
      alert('Failed to sync: ' + (error.response?.data?.message || error.message));
    } finally {
      setSyncing(null);
    }
  };

  const openCreateModal = () => {
    setEditingIssue(null);
    setFormData({ 
      title: '', 
      description: '', 
      priority: 'medium', 
      assignee: '', 
      customerName: '', 
      labels: '',
      createInJira: false,
      jiraProjectKey: ''
    });
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
      labels: issue.labels.join(', '),
      createInJira: false,
      jiraProjectKey: ''
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    if (formData.createInJira && !formData.jiraProjectKey.trim()) {
      alert('Please enter a Jira project key');
      return;
    }
    
    setSaving(true);
    try {
      // If creating in Jira, use the Jira API first
      if (formData.createInJira && !editingIssue) {
        const jiraPayload = {
          projectKey: formData.jiraProjectKey.toUpperCase(),
          summary: formData.title,
          description: formData.description || undefined,
          issueType: 'Task',
          priority: mapPriorityToJira(formData.priority),
          labels: formData.labels.split(',').map(l => l.trim()).filter(Boolean)
        };
        
        await integrationsApi.jira.createIssue(jiraPayload);
        
        // Sync to get the new issue
        await issuesApi.syncFromJira();
        
        setShowModal(false);
        loadIssues();
        loadSyncStatus();
        return;
      }
      
      // Otherwise create/update internally
      const payload = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        assignee: formData.assignee || 'Unassigned',
        customerName: formData.customerName,
        labels: formData.labels.split(',').map(l => l.trim()).filter(Boolean)
      };

      if (editingIssue) {
        await issuesApi.update(editingIssue.id, payload);
      } else {
        await issuesApi.create(payload);
      }

      setShowModal(false);
      loadIssues();
    } catch (error: any) {
      console.error('Failed to save issue:', error);
      alert('Failed to save issue: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };
  
  const mapPriorityToJira = (priority: string): string => {
    const map: Record<string, string> = {
      'highest': 'Highest',
      'high': 'High',
      'medium': 'Medium',
      'low': 'Low',
      'lowest': 'Lowest'
    };
    return map[priority] || 'Medium';
  };

  const handleStatusChange = async (issueId: string, newStatus: string) => {
    try {
      await issuesApi.updateStatus(issueId, newStatus);
      setIssues(prev => prev.map(issue => 
        issue.id === issueId 
          ? { ...issue, status: newStatus, updatedAt: new Date().toISOString() }
          : issue
      ));
    } catch (error: any) {
      console.error('Failed to update status:', error);
      alert('Failed to update status: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (issueId: string) => {
    if (!confirm('Are you sure you want to delete this issue?')) return;
    
    try {
      await issuesApi.delete(issueId);
      setIssues(prev => prev.filter(issue => issue.id !== issueId));
    } catch (error: any) {
      console.error('Failed to delete issue:', error);
      alert('Failed to delete issue: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSaveJiraConfig = async () => {
    if (!jiraConfig.baseUrl || !jiraConfig.email || !jiraConfig.apiToken) {
      setJiraError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setJiraError('');
    try {
      const response = await integrationsApi.saveJiraConfig(jiraConfig);
      if (response.data?.success) {
        // Test the connection
        setJiraConnectionStatus('testing');
        const testResponse = await integrationsApi.testJiraConnection();
        if (testResponse.data?.data?.connected) {
          setJiraConnectionStatus('connected');
          setShowJiraModal(false);
          loadSyncStatus();
          alert('✅ Jira connected successfully! You can now sync issues.');
        } else {
          setJiraConnectionStatus('error');
          setJiraError(testResponse.data?.data?.error || 'Connection test failed');
        }
      }
    } catch (error: any) {
      console.error('Failed to save Jira config:', error);
      setJiraError(error.response?.data?.message || 'Failed to save configuration');
      setJiraConnectionStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestJiraConnection = async () => {
    setJiraConnectionStatus('testing');
    setJiraError('');
    try {
      const response = await integrationsApi.testJiraConnection();
      if (response.data?.data?.connected) {
        setJiraConnectionStatus('connected');
      } else {
        setJiraConnectionStatus('error');
        setJiraError(response.data?.data?.error || 'Connection test failed');
      }
    } catch (error: any) {
      setJiraConnectionStatus('error');
      setJiraError(error.response?.data?.message || 'Connection test failed');
    }
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
            onClick={() => setShowJiraModal(true)}
            className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Configure Jira"
          >
            <Settings size={18} />
          </button>
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
        <div className={`bg-white rounded-xl p-4 shadow-sm border ${syncStatus?.jiraConfigured ? 'border-blue-200' : 'border-slate-200'} text-center`}>
          <div className="flex items-center justify-center gap-1">
            <span className="text-lg">🔷</span>
            <p className="text-2xl font-bold text-blue-600">{stats.jira}</p>
          </div>
          <p className="text-xs text-slate-500">Jira</p>
          {syncStatus?.jiraConfigured ? (
            <button 
              onClick={handleSyncJira}
              disabled={syncing !== null}
              className="mt-2 text-xs text-blue-600 hover:underline disabled:opacity-50"
            >
              {syncing === 'jira' ? 'Syncing...' : 'Sync'}
            </button>
          ) : (
            <button 
              onClick={() => setShowJiraModal(true)}
              className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1 justify-center"
            >
              <Link2 size={12} /> Connect
            </button>
          )}
        </div>
        <div className={`bg-white rounded-xl p-4 shadow-sm border ${syncStatus?.linearConfigured ? 'border-violet-200' : 'border-slate-200'} text-center`}>
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
            <p className="text-sm text-slate-400 mt-1">
              {!syncStatus?.jiraConfigured 
                ? 'Connect Jira to import your issues'
                : 'Click "Sync" to import issues from Jira or Linear'}
            </p>
            {!syncStatus?.jiraConfigured && (
              <button
                onClick={() => setShowJiraModal(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Link2 size={16} />
                Connect Jira
              </button>
            )}
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
                  const providerInfo = providerConfig[issue.provider] || providerConfig.internal;
                  
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
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${statusColors[issue.status] || statusColors.todo}`}
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

      {/* Create/Edit Issue Modal */}
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
              
              {/* Create in Jira option - only for new issues */}
              {!editingIssue && syncStatus?.jiraConfigured && (
                <div className="pt-4 border-t border-slate-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.createInJira}
                      onChange={(e) => setFormData({...formData, createInJira: e.target.checked})}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔷</span>
                      <span className="text-sm font-medium text-slate-700">Also create in Jira</span>
                    </div>
                  </label>
                  
                  {formData.createInJira && (
                    <div className="mt-3 ml-7">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Jira Project Key *
                      </label>
                      <input
                        type="text"
                        value={formData.jiraProjectKey}
                        onChange={(e) => setFormData({...formData, jiraProjectKey: e.target.value.toUpperCase()})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 outline-none font-mono uppercase"
                        placeholder="CRM"
                      />
                      <p className="text-xs text-slate-400 mt-1">The project key where the issue will be created</p>
                    </div>
                  )}
                </div>
              )}
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

      {/* Jira Configuration Modal */}
      {showJiraModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <span className="text-xl">🔷</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Connect Jira</h2>
                  <p className="text-sm text-slate-500">Sync your Jira issues</p>
                </div>
              </div>
              <button onClick={() => setShowJiraModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {jiraConnectionStatus === 'connected' && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                  <CheckCircle2 size={18} />
                  <span className="text-sm font-medium">Connected to Jira</span>
                </div>
              )}
              
              {jiraError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle size={18} />
                  <span className="text-sm">{jiraError}</span>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Jira URL *
                </label>
                <input
                  type="url"
                  value={jiraConfig.baseUrl}
                  onChange={(e) => setJiraConfig({...jiraConfig, baseUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="https://your-company.atlassian.net"
                />
                <p className="text-xs text-slate-400 mt-1">Your Atlassian instance URL</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={jiraConfig.email}
                  onChange={(e) => setJiraConfig({...jiraConfig, email: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="you@company.com"
                />
                <p className="text-xs text-slate-400 mt-1">Your Atlassian account email</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  API Token *
                </label>
                <input
                  type="password"
                  value={jiraConfig.apiToken}
                  onChange={(e) => setJiraConfig({...jiraConfig, apiToken: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="••••••••••••••••"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Create an API token at{' '}
                  <a 
                    href="https://id.atlassian.com/manage-profile/security/api-tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Atlassian Account Settings
                  </a>
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Default Project Key (Optional)
                </label>
                <input
                  type="text"
                  value={jiraConfig.defaultProjectKey}
                  onChange={(e) => setJiraConfig({...jiraConfig, defaultProjectKey: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="CRM"
                />
                <p className="text-xs text-slate-400 mt-1">Project key to sync issues from</p>
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 flex justify-between gap-3">
              <button
                onClick={handleTestJiraConnection}
                disabled={saving || jiraConnectionStatus === 'testing' || !jiraConfig.baseUrl || !jiraConfig.email || !jiraConfig.apiToken}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {jiraConnectionStatus === 'testing' && <Loader2 className="animate-spin" size={16} />}
                Test Connection
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowJiraModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveJiraConfig}
                  disabled={saving || !jiraConfig.baseUrl || !jiraConfig.email || !jiraConfig.apiToken}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {saving && <Loader2 className="animate-spin" size={16} />}
                  Save & Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Issues;
