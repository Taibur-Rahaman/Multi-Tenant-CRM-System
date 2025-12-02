import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  Target,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Phone,
  Mail,
  Video,
  MoreHorizontal,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../services/api';
import type { DashboardStats, Deal, Activity, Task } from '../types';

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, value, change, changeLabel, icon: Icon, iconBg, iconColor 
}) => (
  <div className="card p-5 hover:shadow-md transition-all duration-200">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{value}</p>
        {change !== undefined && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
              change >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {Math.abs(change)}%
            </span>
            <span className="text-xs text-slate-400">{changeLabel || 'vs last month'}</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${iconBg}`}>
        <Icon size={22} className={iconColor} />
      </div>
    </div>
  </div>
);

// Pipeline Stage Card
interface StageCardProps {
  name: string;
  count: number;
  value: number;
  color: string;
  percentage: number;
}

const StageCard: React.FC<StageCardProps> = ({ name, count, value, color, percentage }) => (
  <div className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer group">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
      <span className="text-sm font-medium text-slate-700">{name}</span>
    </div>
    <p className="text-xl font-bold text-slate-900">${(value / 1000).toFixed(0)}k</p>
    <div className="flex items-center justify-between mt-2">
      <span className="text-xs text-slate-500">{count} deals</span>
      <span className="text-xs font-medium text-slate-600">{percentage}%</span>
    </div>
    <div className="progress-bar mt-2">
      <div className="progress-fill" style={{ width: `${percentage}%`, backgroundColor: color }}></div>
    </div>
  </div>
);

// Activity Item
interface ActivityItemProps {
  type: 'call' | 'email' | 'meeting';
  title: string;
  contact: string;
  time: string;
  status: 'completed' | 'scheduled' | 'overdue';
}

const ActivityItem: React.FC<ActivityItemProps> = ({ type, title, contact, time, status }) => {
  const icons = {
    call: Phone,
    email: Mail,
    meeting: Video
  };
  const Icon = icons[type];
  
  const statusColors = {
    completed: 'text-emerald-600 bg-emerald-50',
    scheduled: 'text-blue-600 bg-blue-50',
    overdue: 'text-red-600 bg-red-50'
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
      <div className={`p-2.5 rounded-lg ${type === 'call' ? 'bg-green-100 text-green-600' : type === 'email' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{title}</p>
        <p className="text-xs text-slate-500 truncate">{contact}</p>
      </div>
      <div className="text-right">
        <span className={`badge badge-sm ${statusColors[status]}`}>
          {status}
        </span>
        <p className="text-xs text-slate-400 mt-1">{time}</p>
      </div>
    </div>
  );
};

// Task Item
interface TaskItemProps {
  title: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  assignee: string;
}

const TaskItem: React.FC<TaskItemProps> = ({ title, dueDate, priority, assignee }) => {
  const priorityColors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-slate-100 text-slate-600'
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`badge badge-sm ${priorityColors[priority]}`}>{priority}</span>
          <span className="text-xs text-slate-400">Due {dueDate}</span>
        </div>
      </div>
      <div className="avatar avatar-xs" title={assignee}>
        <span>{assignee.charAt(0)}</span>
      </div>
    </div>
  );
};

// Top Deal Card
interface TopDealProps {
  name: string;
  company: string;
  value: number;
  stage: string;
  stageColor: string;
  probability: number;
  daysInStage: number;
}

const TopDealCard: React.FC<TopDealProps> = ({ name, company, value, stage, stageColor, probability, daysInStage }) => (
  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
    <div className="avatar avatar-md bg-gradient-to-br from-blue-500 to-violet-500">
      <span>{company.charAt(0)}</span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-slate-800 truncate">{name}</p>
      <p className="text-xs text-slate-500 truncate">{company}</p>
    </div>
    <div className="text-right">
      <p className="text-sm font-bold text-slate-900">${value.toLocaleString()}</p>
      <div className="flex items-center gap-1 mt-0.5 justify-end">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stageColor }}></div>
        <span className="text-xs text-slate-500">{stage}</span>
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardApi.getStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Using demo data - backend not connected');
      // Demo data for professional presentation
      setStats({
        totalContacts: 1247,
        totalLeads: 342,
        totalAccounts: 89,
        totalDeals: 156,
        openDeals: 43,
        openDealsValue: 1250000,
        weightedPipelineValue: 687500,
        dealsWonThisMonth: 12,
        dealsWonValue: 485000,
        dealsLostThisMonth: 4,
        winRate: 68,
        averageDealSize: 28500,
        averageSalesCycle: 32,
        activitiesThisWeek: 78,
        pendingTasks: 15,
        overdueActivities: 3,
        interactionsByType: {
          'CALL': 145,
          'EMAIL': 278,
          'MEETING': 56,
          'MESSAGE': 89
        },
        dealsByStage: [
          { stageId: '1', stageName: 'Qualification', stageColor: '#6366f1', count: 12, value: 180000 },
          { stageId: '2', stageName: 'Needs Analysis', stageColor: '#8b5cf6', count: 8, value: 240000 },
          { stageId: '3', stageName: 'Proposal', stageColor: '#a855f7', count: 15, value: 450000 },
          { stageId: '4', stageName: 'Negotiation', stageColor: '#d946ef', count: 8, value: 380000 },
        ],
        revenueByMonth: [],
        dealsTrend: [],
        totalCustomers: 1247,
        totalInteractions: 568,
        totalTasks: 45,
        recentInteractions: 34
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const pipelineStages = stats?.dealsByStage || [];
  const totalPipelineValue = pipelineStages.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-heading-1">Dashboard</h1>
          <p className="text-body mt-1">Here's what's happening with your sales today.</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="input input-sm w-auto">
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Quarter</option>
            <option>This Year</option>
          </select>
          <button className="btn btn-primary btn-sm">
            <Zap size={16} />
            Generate Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Open Pipeline"
          value={`$${((stats?.openDealsValue || 0) / 1000000).toFixed(2)}M`}
          change={12.5}
          icon={Target}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Revenue Won"
          value={`$${((stats?.dealsWonValue || 0) / 1000).toFixed(0)}k`}
          change={8.2}
          icon={DollarSign}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Win Rate"
          value={`${stats?.winRate || 0}%`}
          change={-2.4}
          icon={TrendingUp}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
        />
        <StatCard
          title="Avg. Deal Size"
          value={`$${((stats?.averageDealSize || 0) / 1000).toFixed(1)}k`}
          change={5.7}
          icon={CheckCircle2}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Overview - Takes 2 columns */}
        <div className="lg:col-span-2 card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h2 className="text-heading-3">Pipeline Overview</h2>
              <p className="text-caption mt-0.5">{stats?.openDeals || 0} active deals</p>
            </div>
            <button 
              onClick={() => navigate('/pipeline')}
              className="btn btn-ghost btn-sm"
            >
              View Pipeline
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {pipelineStages.map((stage) => (
                <StageCard
                  key={stage.stageId}
                  name={stage.stageName}
                  count={stage.count}
                  value={stage.value}
                  color={stage.stageColor}
                  percentage={totalPipelineValue > 0 ? Math.round((stage.value / totalPipelineValue) * 100) : 0}
                />
              ))}
            </div>
            
            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">{stats?.dealsWonThisMonth || 0}</p>
                <p className="text-xs text-slate-500 mt-1">Deals Won</p>
              </div>
              <div className="text-center border-x border-gray-100">
                <p className="text-2xl font-bold text-slate-900">{stats?.averageSalesCycle || 0}</p>
                <p className="text-xs text-slate-500 mt-1">Avg. Days to Close</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600">
                  ${((stats?.weightedPipelineValue || 0) / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-slate-500 mt-1">Weighted Value</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Deals */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-heading-3">Top Deals</h2>
            <button className="btn btn-ghost btn-icon-sm">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <div className="card-body space-y-3">
            <TopDealCard
              name="Enterprise License"
              company="Acme Corporation"
              value={125000}
              stage="Negotiation"
              stageColor="#d946ef"
              probability={75}
              daysInStage={5}
            />
            <TopDealCard
              name="Annual Subscription"
              company="TechStart Inc"
              value={85000}
              stage="Proposal"
              stageColor="#a855f7"
              probability={50}
              daysInStage={8}
            />
            <TopDealCard
              name="Consulting Package"
              company="Global Industries"
              value={65000}
              stage="Needs Analysis"
              stageColor="#8b5cf6"
              probability={25}
              daysInStage={3}
            />
            <TopDealCard
              name="Platform Upgrade"
              company="DataFlow Systems"
              value={45000}
              stage="Qualification"
              stageColor="#6366f1"
              probability={10}
              daysInStage={1}
            />
          </div>
          <div className="card-footer">
            <button 
              onClick={() => navigate('/deals')}
              className="btn btn-ghost btn-sm w-full"
            >
              View All Deals
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h2 className="text-heading-3">Recent Activities</h2>
              <p className="text-caption mt-0.5">{stats?.activitiesThisWeek || 0} this week</p>
            </div>
            <button className="btn btn-ghost btn-icon-sm">
              <MoreHorizontal size={18} />
            </button>
          </div>
          <div className="card-body space-y-1 p-3">
            <ActivityItem
              type="call"
              title="Discovery Call"
              contact="John Smith at Acme Corp"
              time="2:30 PM"
              status="scheduled"
            />
            <ActivityItem
              type="email"
              title="Proposal Follow-up"
              contact="Sarah Chen at TechStart"
              time="11:00 AM"
              status="completed"
            />
            <ActivityItem
              type="meeting"
              title="Product Demo"
              contact="Mike Johnson at DataFlow"
              time="Yesterday"
              status="completed"
            />
            <ActivityItem
              type="call"
              title="Contract Discussion"
              contact="Lisa Park at Global Ind"
              time="Overdue"
              status="overdue"
            />
          </div>
          <div className="card-footer">
            <button 
              onClick={() => navigate('/activities')}
              className="btn btn-ghost btn-sm w-full"
            >
              View All Activities
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Tasks */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h2 className="text-heading-3">My Tasks</h2>
              <p className="text-caption mt-0.5">{stats?.pendingTasks || 0} pending</p>
            </div>
            {(stats?.overdueActivities || 0) > 0 && (
              <span className="badge badge-red badge-sm">
                <AlertCircle size={12} />
                {stats?.overdueActivities} overdue
              </span>
            )}
          </div>
          <div className="card-body space-y-1 p-3">
            <TaskItem
              title="Send proposal to Acme Corp"
              dueDate="Today"
              priority="high"
              assignee="You"
            />
            <TaskItem
              title="Follow up with TechStart"
              dueDate="Tomorrow"
              priority="medium"
              assignee="You"
            />
            <TaskItem
              title="Prepare demo materials"
              dueDate="In 3 days"
              priority="medium"
              assignee="You"
            />
            <TaskItem
              title="Review contract terms"
              dueDate="In 5 days"
              priority="low"
              assignee="You"
            />
          </div>
          <div className="card-footer">
            <button 
              onClick={() => navigate('/tasks')}
              className="btn btn-ghost btn-sm w-full"
            >
              View All Tasks
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-heading-3">Activity Summary</h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {/* Activity Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <Phone size={16} className="text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Calls</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {stats?.interactionsByType?.['CALL'] || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Mail size={16} className="text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Emails</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {stats?.interactionsByType?.['EMAIL'] || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Video size={16} className="text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Meetings</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {stats?.interactionsByType?.['MEETING'] || 0}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-slate-900">{stats?.totalContacts || 0}</p>
                    <p className="text-xs text-slate-500 mt-1">Total Contacts</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-slate-900">{stats?.totalAccounts || 0}</p>
                    <p className="text-xs text-slate-500 mt-1">Accounts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
