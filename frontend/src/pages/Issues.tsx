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
  Bug,
  Lightbulb,
  FileText,
  ArrowUpCircle,
  User,
  Calendar,
  Tag
} from 'lucide-react';

interface Issue {
  id: string;
  key: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'bug' | 'feature' | 'task' | 'improvement';
  assignee: string;
  reporter: string;
  customerName?: string;
  createdAt: string;
  updatedAt: string;
  labels: string[];
  provider: 'jira' | 'linear' | 'internal';
  externalUrl?: string;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  open: { icon: Circle, color: 'text-blue-600', bg: 'bg-blue-100' },
  in_progress: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  resolved: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
  closed: { icon: CheckCircle2, color: 'text-slate-600', bg: 'bg-slate-100' },
};

const priorityConfig: Record<string, { color: string; bg: string }> = {
  low: { color: 'text-slate-600', bg: 'bg-slate-100' },
  medium: { color: 'text-blue-600', bg: 'bg-blue-100' },
  high: { color: 'text-orange-600', bg: 'bg-orange-100' },
  critical: { color: 'text-red-600', bg: 'bg-red-100' },
};

const typeIcons: Record<string, React.ElementType> = {
  bug: Bug,
  feature: Lightbulb,
  task: FileText,
  improvement: ArrowUpCircle,
};

const Issues: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchIssues();
  }, [filterStatus, filterPriority]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      // Try to fetch from backend
      const response = await fetch('/api/issues');
      if (response.ok) {
        const data = await response.json();
        setIssues(data.data || []);
      } else {
        throw new Error('Backend not available');
      }
    } catch (error) {
      // Demo data
      const demoIssues: Issue[] = [
        {
          id: '1', key: 'CRM-101', title: 'Dashboard loading slow for large datasets',
          description: 'When there are more than 1000 customers, the dashboard takes 5+ seconds to load',
          status: 'in_progress', priority: 'high', type: 'bug',
          assignee: 'Nazim Uddin', reporter: 'Taibur Rahaman', customerName: 'TechCorp',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date().toISOString(),
          labels: ['performance', 'dashboard'], provider: 'jira',
          externalUrl: 'https://neobit.atlassian.net/browse/CRM-101'
        },
        {
          id: '2', key: 'CRM-102', title: 'Add export to CSV feature for customers',
          description: 'Users should be able to export customer list to CSV format',
          status: 'open', priority: 'medium', type: 'feature',
          assignee: 'Bushra Mahin', reporter: 'Sarah Johnson',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
          labels: ['export', 'customers'], provider: 'jira',
          externalUrl: 'https://neobit.atlassian.net/browse/CRM-102'
        },
        {
          id: '3', key: 'CRM-103', title: 'Email sync fails for Gmail accounts',
          description: 'Gmail integration not syncing emails for some accounts. OAuth token refresh issue.',
          status: 'open', priority: 'critical', type: 'bug',
          assignee: 'Nazim Uddin', reporter: 'Michael Brown', customerName: 'Global Inc',
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          updatedAt: new Date(Date.now() - 172800000).toISOString(),
          labels: ['gmail', 'integration', 'oauth'], provider: 'jira',
          externalUrl: 'https://neobit.atlassian.net/browse/CRM-103'
        },
        {
          id: '4', key: 'CRM-104', title: 'Implement voice command for Android app',
          description: 'Add voice command feature to Android app for hands-free CRM updates',
          status: 'in_progress', priority: 'medium', type: 'feature',
          assignee: 'Samita Chowdhury', reporter: 'Taibur Rahaman',
          createdAt: new Date(Date.now() - 345600000).toISOString(),
          updatedAt: new Date().toISOString(),
          labels: ['android', 'voice', 'phase2'], provider: 'linear'
        },
        {
          id: '5', key: 'CRM-105', title: 'Improve AI response accuracy',
          description: 'AI assistant sometimes gives incorrect customer counts. Need to improve data retrieval.',
          status: 'open', priority: 'high', type: 'improvement',
          assignee: 'Nazim Uddin', reporter: 'Admin User',
          createdAt: new Date(Date.now() - 432000000).toISOString(),
          updatedAt: new Date(Date.now() - 259200000).toISOString(),
          labels: ['ai', 'accuracy'], provider: 'internal'
        },
        {
          id: '6', key: 'CRM-106', title: 'Add Telegram bot notifications',
          description: 'Send notifications to Telegram when new leads are created',
          status: 'resolved', priority: 'low', type: 'feature',
          assignee: 'Bushra Mahin', reporter: 'Lisa Anderson', customerName: 'Digital First',
          createdAt: new Date(Date.now() - 518400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
          labels: ['telegram', 'notifications'], provider: 'jira',
          externalUrl: 'https://neobit.atlassian.net/browse/CRM-106'
        },
        {
          id: '7', key: 'CRM-107', title: 'Task reminder notifications not working',
          description: 'Users are not receiving task reminder notifications before due date',
          status: 'closed', priority: 'high', type: 'bug',
          assignee: 'Samita Chowdhury', reporter: 'James Taylor', customerName: 'CloudBase',
          createdAt: new Date(Date.now() - 604800000).toISOString(),
          updatedAt: new Date(Date.now() - 172800000).toISOString(),
          labels: ['notifications', 'tasks'], provider: 'internal'
        },
        {
          id: '8', key: 'CRM-108', title: 'Create admin user management panel',
          description: 'Admin should be able to manage users, roles, and permissions',
          status: 'in_progress', priority: 'high', type: 'task',
          assignee: 'Taibur Rahaman', reporter: 'Taibur Rahaman',
          createdAt: new Date(Date.now() - 691200000).toISOString(),
          updatedAt: new Date().toISOString(),
          labels: ['admin', 'users', 'security'], provider: 'linear'
        },
      ];
      
      let filtered = demoIssues;
      if (filterStatus) filtered = filtered.filter(i => i.status === filterStatus);
      if (filterPriority) filtered = filtered.filter(i => i.priority === filterPriority);
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(i => 
          i.title.toLowerCase().includes(q) || 
          i.key.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q)
        );
      }
      setIssues(filtered);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchIssues();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Issue Tracking</h1>
          <p className="text-slate-500 mt-1">Track bugs, features, and tasks (Jira/Linear integration)</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
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
              <p className="text-2xl font-bold text-slate-800">{issues.filter(i => i.status === 'open').length}</p>
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
              <p className="text-2xl font-bold text-slate-800">{issues.filter(i => i.status === 'in_progress').length}</p>
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
              <p className="text-2xl font-bold text-slate-800">{issues.filter(i => i.status === 'resolved').length}</p>
              <p className="text-sm text-slate-500">Resolved</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertCircle className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{issues.filter(i => i.priority === 'critical').length}</p>
              <p className="text-sm text-slate-500">Critical</p>
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
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search issues..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:border-blue-500 outline-none"
          >
            <option value="">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Issues List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500">No issues found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {issues.map((issue) => {
              const StatusIcon = statusConfig[issue.status]?.icon || Circle;
              const TypeIcon = typeIcons[issue.type] || FileText;
              return (
                <div key={issue.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Type Icon */}
                    <div className={`flex-shrink-0 p-2 rounded-lg ${priorityConfig[issue.priority]?.bg}`}>
                      <TypeIcon className={priorityConfig[issue.priority]?.color} size={20} />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-slate-500">{issue.key}</span>
                            <h3 className="font-medium text-slate-800">{issue.title}</h3>
                            {issue.externalUrl && (
                              <a 
                                href={issue.externalUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-600"
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-1">{issue.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <User size={12} />
                              {issue.assignee}
                            </span>
                            {issue.customerName && (
                              <span className="text-blue-600">@ {issue.customerName}</span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {formatDate(issue.createdAt)}
                            </span>
                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 uppercase text-[10px]">
                              {issue.provider}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[issue.status]?.bg} ${statusConfig[issue.status]?.color}`}>
                            {issue.status.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityConfig[issue.priority]?.bg} ${priorityConfig[issue.priority]?.color}`}>
                            {issue.priority}
                          </span>
                        </div>
                      </div>
                      {/* Labels */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {issue.labels.map((label, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-purple-50 text-purple-600 text-xs rounded-full flex items-center gap-1">
                            <Tag size={10} />
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Issues;

