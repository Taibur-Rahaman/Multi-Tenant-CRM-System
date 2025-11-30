import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  User
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

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('');

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
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (taskId: string) => {
    try {
      await tasksApi.complete(taskId);
      fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
    }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tasks</h1>
          <p className="text-slate-500 mt-1">Manage your tasks and follow-ups</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
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
          <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <Filter size={20} />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500">No tasks found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tasks.map((task) => {
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
                            {task.assignedToName && (
                              <span>Assigned to: {task.assignedToName}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority] || 'bg-slate-100 text-slate-700'}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

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

export default Tasks;
