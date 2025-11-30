import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Building2, 
  MessageSquare, 
  CheckSquare,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';
import { dashboardApi } from '../services/api';
import type { DashboardStats } from '../types';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, color }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-2 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span>{Math.abs(trend)}% from last month</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardApi.getStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const interactionTypes = stats?.interactionsByType || {};

  return (
    <div className="space-y-6">
      {/* Header */}
    <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back! Here's what's happening with your CRM.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers || 0}
          icon={Users}
          trend={12}
          color="bg-blue-600"
        />
        <StatCard
          title="Total Accounts"
          value={stats?.totalAccounts || 0}
          icon={Building2}
          trend={8}
          color="bg-purple-600"
        />
        <StatCard
          title="Total Leads"
          value={stats?.totalLeads || 0}
          icon={TrendingUp}
          trend={-3}
          color="bg-emerald-600"
        />
        <StatCard
          title="Pending Tasks"
          value={stats?.pendingTasks || 0}
          icon={CheckSquare}
          color="bg-amber-500"
        />
      </div>

      {/* Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactions by Type */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Interactions Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <Phone className="mx-auto text-blue-600 mb-2" size={24} />
              <p className="text-2xl font-bold text-blue-600">{interactionTypes['CALL'] || 0}</p>
              <p className="text-sm text-slate-600">Calls</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <Mail className="mx-auto text-green-600 mb-2" size={24} />
              <p className="text-2xl font-bold text-green-600">{interactionTypes['EMAIL'] || 0}</p>
              <p className="text-sm text-slate-600">Emails</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <Calendar className="mx-auto text-purple-600 mb-2" size={24} />
              <p className="text-2xl font-bold text-purple-600">{interactionTypes['MEETING'] || 0}</p>
              <p className="text-sm text-slate-600">Meetings</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 text-center">
              <MessageSquare className="mx-auto text-amber-600 mb-2" size={24} />
              <p className="text-2xl font-bold text-amber-600">{interactionTypes['MESSAGE'] || 0}</p>
              <p className="text-sm text-slate-600">Messages</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
              <Users size={20} />
              <span className="font-medium">Add New Customer</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
              <Phone size={20} />
              <span className="font-medium">Log Interaction</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors">
              <CheckSquare size={20} />
              <span className="font-medium">Create Task</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors">
              <Building2 size={20} />
              <span className="font-medium">Add Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Recent Activity</h2>
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All
          </button>
        </div>
        <div className="space-y-4">
          <p className="text-slate-500 text-center py-8">
            {stats?.recentInteractions ? 
              `${stats.recentInteractions} interactions in the last 7 days` : 
              'No recent activity'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
