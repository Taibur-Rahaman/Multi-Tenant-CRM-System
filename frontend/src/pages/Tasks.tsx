import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  User,
  X,
  Loader2,
  Trash2
} from 'lucide-react';
import { tasksApi } from '../services/api';
import type { Task, PageResponse } from '../types';

const priorityColors: Record<string, string> = {
  high: 'text-red-600 bg-red-50',
  medium: 'text-yellow-600 bg-yellow-50',
  low: 'text-green-600 bg-green-50',
};

const statusIcons: Record<string, React.ElementType> = {
  pending: Circle,
  in_progress: Clock,
  completed: CheckCircle2,
};

interface TaskFormData {
  title: string;
  description: string;
  priority: string;
  dueDate: string;
  customerName: string;
}

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '', description: '', priority: 'medium', dueDate: '', customerName: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [currentPage, filterStatus]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = filterStatus
        ? await tasksApi.getByStatus(filterStatus, { page: currentPage, size: 20 })
        : await tasksApi.getAll({ page: currentPage, size: 20 });
      
      if (response.data.success) {
        const pageData = response.data.data as PageResponse<Task>;
        setTasks(pageData.content);
        setTotalPages(pageData.totalPages);
        localStorage.setItem('crm_tasks', JSON.stringify(pageData.content));
      }
    } catch (error) {
      console.log('Using local storage for tasks');
      const stored = localStorage.getItem('crm_tasks');
      if (stored) {
        const all = JSON.parse(stored) as Task[];
        const filtered = filterStatus ? all.filter(t => t.status === filterStatus) : all;
        setTasks(filtered);
      } else {
        const today = new Date();
        const demoTasks: Task[] = [
          { id: '1', title: 'Follow up with TechCorp on renewal', description: 'Contact John Smith about contract renewal', status: 'pending', priority: 'high', dueDate: today.toISOString(), customerName: 'John Smith', assignedToName: 'Admin User' },
          { id: '2', title: 'Send proposal to StartupXYZ', description: 'Prepare pricing proposal for premium plan', status: 'in_progress', priority: 'high', dueDate: new Date(today.getTime() + 86400000).toISOString(), customerName: 'Sarah Johnson', assignedToName: 'Admin User' },
          { id: '3', title: 'Schedule demo with Global Inc', description: 'Michael Brown requested a product demo', status: 'pending', priority: 'medium', dueDate: new Date(today.getTime() + 172800000).toISOString(), customerName: 'Michael Brown', assignedToName: 'Admin User' },
          { id: '4', title: 'Review contract for Innovate Co', description: 'Legal review needed before signing', status: 'pending', priority: 'medium', dueDate: new Date(today.getTime() + 259200000).toISOString(), customerName: 'Emily Davis', assignedToName: 'Admin User' },
          { id: '5', title: 'Prepare quarterly report', description: 'Compile Q4 sales metrics', status: 'in_progress', priority: 'low', dueDate: new Date(today.getTime() + 432000000).toISOString(), assignedToName: 'Admin User' },
        ];
        localStorage.setItem('crm_tasks', JSON.stringify(demoTasks));
        setTasks(demoTasks);
      }
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (taskId: string) => {
    try {
      await tasksApi.complete(taskId);
      fetchTasks();
    } catch (error) {
      // Update in local storage
      const stored = localStorage.getItem('crm_tasks');
      if (stored) {
        const all = JSON.parse(stored) as Task[];
        const updated = all.map(t => t.id === taskId ? { ...t, status: 'completed' } : t);
        localStorage.setItem('crm_tasks', JSON.stringify(updated));
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
      }
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await tasksApi.delete(taskId);
      fetchTasks();
    } catch (error) {
      const stored = localStorage.getItem('crm_tasks');
      if (stored) {
        const all = JSON.parse(stored) as Task[];
        const filtered = all.filter(t => t.id !== taskId);
        localStorage.setItem('crm_tasks', JSON.stringify(filtered));
        setTasks(prev => prev.filter(t => t.id !== taskId));
      }
    }
  };

  const handleCreate = async () => {
    if (!formData.title) return;
    setSaving(true);

    const newTask: Task = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      status: 'pending',
      priority: formData.priority,
      dueDate: formData.dueDate || new Date().toISOString(),
      customerName: formData.customerName,
      assignedToName: 'Admin User'
    };

    try {
      await tasksApi.create(newTask);
      fetchTasks();
    } catch (error) {
      const stored = localStorage.getItem('crm_tasks');
      const all = stored ? JSON.parse(stored) as Task[] : [];
      const updated = [newTask, ...all];
      localStorage.setItem('crm_tasks', JSON.stringify(updated));
      setTasks(updated);
    }

    setShowModal(false);
    setFormData({ title: '', description: '', priority: 'medium', dueDate: '', customerName: '' });
    setSaving(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return <span className="text-red-600">Overdue</span>;
    if (diffDays === 0) return <span className="text-amber-600">Due today</span>;
    if (diffDays === 1) return <span className="text-amber-600">Due tomorrow</span>;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const filteredTasks = tasks.filter(t => 
    !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tasks</h1>
          <p className="text-slate-500 mt-1">Manage your tasks and follow-ups</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>Add Task</span>
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
              placeholder="Search tasks..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(0); }}
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500">No tasks found</p>
            <button onClick={() => setShowModal(true)} className="mt-4 text-blue-600 hover:text-blue-700">
              Create your first task
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTasks.map((task) => {
              const StatusIcon = statusIcons[task.status] || Circle;
              return (
                <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => task.status !== 'completed' && handleComplete(task.id)}
                      className={`mt-1 flex-shrink-0 ${
                        task.status === 'completed' 
                          ? 'text-green-500' 
                          : 'text-slate-400 hover:text-blue-500'
                      }`}
                    >
                      <StatusIcon size={20} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className={`font-medium ${
                            task.status === 'completed' 
                              ? 'text-slate-400 line-through' 
                              : 'text-slate-800'
                          }`}>
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                            {task.customerName && (
                              <span className="flex items-center gap-1">
                                <User size={14} />
                                {task.customerName}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              {formatDate(task.dueDate)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority] || 'bg-slate-100 text-slate-700'}`}>
                            {task.priority}
                          </span>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
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
              <h2 className="text-xl font-bold text-slate-800">Create New Task</h2>
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
                  placeholder="Task title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  placeholder="Task description..."
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
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
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
                disabled={saving || !formData.title}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {saving && <Loader2 className="animate-spin" size={16} />}
                Create Task
              </button>
            </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default Tasks;
