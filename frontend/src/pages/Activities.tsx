import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Video,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Building2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { Activity, ActivityType, ActivityStatus } from '../types';

const demoActivities: Activity[] = [
  { id: '1', activityType: 'call', status: 'scheduled', priority: 'high', subject: 'Discovery Call with John Smith', description: 'Initial discovery call to understand requirements', scheduledStart: '2024-01-22T14:30:00Z', scheduledEnd: '2024-01-22T15:00:00Z', allDay: false, contactName: 'John Smith', accountName: 'Acme Corporation', dealName: 'Enterprise License', ownerId: '1', ownerName: 'Alex Johnson', callDirection: 'outbound', reminderSent: false, isRecurring: false, isOverdue: false, tags: [], createdAt: '2024-01-20T10:00:00Z', updatedAt: '2024-01-20T10:00:00Z' },
  { id: '2', activityType: 'email', status: 'completed', priority: 'normal', subject: 'Proposal Follow-up', description: 'Follow up on the proposal sent last week', scheduledStart: '2024-01-20T11:00:00Z', actualStart: '2024-01-20T11:05:00Z', actualEnd: '2024-01-20T11:15:00Z', durationMinutes: 10, allDay: false, contactName: 'Sarah Chen', accountName: 'TechStart Inc', dealName: 'Annual Subscription', ownerId: '1', ownerName: 'Alex Johnson', outcome: 'Client requested additional information about pricing', reminderSent: true, isRecurring: false, isOverdue: false, tags: [], createdAt: '2024-01-19T14:00:00Z', updatedAt: '2024-01-20T11:15:00Z' },
  { id: '3', activityType: 'meeting', status: 'scheduled', priority: 'high', subject: 'Product Demo - DataFlow Systems', description: 'Full product demonstration for the IT team', scheduledStart: '2024-01-23T10:00:00Z', scheduledEnd: '2024-01-23T11:30:00Z', allDay: false, location: 'Zoom', locationType: 'video', meetingLink: 'https://zoom.us/j/123456789', contactName: 'Mike Johnson', accountName: 'DataFlow Systems', dealName: 'Consulting Package', ownerId: '2', ownerName: 'Emily White', reminderSent: false, isRecurring: false, isOverdue: false, tags: ['demo'], createdAt: '2024-01-18T09:00:00Z', updatedAt: '2024-01-18T09:00:00Z' },
  { id: '4', activityType: 'call', status: 'completed', priority: 'normal', subject: 'Contract Discussion', description: 'Discuss contract terms and pricing', scheduledStart: '2024-01-19T16:00:00Z', actualStart: '2024-01-19T16:05:00Z', actualEnd: '2024-01-19T16:35:00Z', durationMinutes: 30, allDay: false, contactName: 'Lisa Park', accountName: 'Global Industries', dealName: 'Platform Upgrade', ownerId: '1', ownerName: 'Alex Johnson', callDirection: 'outbound', callResult: 'Positive', outcome: 'Client agreed to terms, sending final contract', reminderSent: true, isRecurring: false, isOverdue: false, tags: [], createdAt: '2024-01-18T10:00:00Z', updatedAt: '2024-01-19T16:35:00Z' },
  { id: '5', activityType: 'task', status: 'scheduled', priority: 'urgent', subject: 'Send Final Proposal to MegaCorp', description: 'Prepare and send the final proposal with updated pricing', scheduledStart: '2024-01-21T09:00:00Z', scheduledEnd: '2024-01-21T12:00:00Z', allDay: false, contactName: 'James Brown', accountName: 'MegaCorp', dealName: 'Enterprise Suite', ownerId: '1', ownerName: 'Alex Johnson', reminderSent: false, isRecurring: false, isOverdue: true, tags: ['urgent'], createdAt: '2024-01-15T11:00:00Z', updatedAt: '2024-01-15T11:00:00Z' },
  { id: '6', activityType: 'meeting', status: 'completed', priority: 'normal', subject: 'Onboarding Kickoff - CloudFirst', description: 'Initial onboarding meeting for new customer', scheduledStart: '2024-01-17T14:00:00Z', actualStart: '2024-01-17T14:00:00Z', actualEnd: '2024-01-17T15:00:00Z', durationMinutes: 60, allDay: false, location: 'Conference Room A', locationType: 'in_person', contactName: 'Emma Wilson', accountName: 'CloudFirst', ownerId: '1', ownerName: 'Alex Johnson', outcome: 'Successful kickoff, next steps defined', reminderSent: true, isRecurring: false, isOverdue: false, tags: ['onboarding'], createdAt: '2024-01-10T09:00:00Z', updatedAt: '2024-01-17T15:00:00Z' },
];

const activityTypeConfig: Record<ActivityType, { icon: React.ElementType; color: string; bg: string }> = {
  call: { icon: Phone, color: 'text-green-600', bg: 'bg-green-100' },
  email: { icon: Mail, color: 'text-blue-600', bg: 'bg-blue-100' },
  meeting: { icon: Video, color: 'text-purple-600', bg: 'bg-purple-100' },
  task: { icon: CheckCircle, color: 'text-amber-600', bg: 'bg-amber-100' },
  note: { icon: Mail, color: 'text-slate-600', bg: 'bg-slate-100' },
  sms: { icon: Mail, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  whatsapp: { icon: Mail, color: 'text-green-600', bg: 'bg-green-100' },
  linkedin: { icon: Mail, color: 'text-blue-700', bg: 'bg-blue-100' },
  demo: { icon: Video, color: 'text-violet-600', bg: 'bg-violet-100' },
  proposal_sent: { icon: Mail, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  contract_sent: { icon: Mail, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  follow_up: { icon: Phone, color: 'text-orange-600', bg: 'bg-orange-100' },
  site_visit: { icon: Building2, color: 'text-slate-600', bg: 'bg-slate-100' },
};

const statusColors: Record<ActivityStatus, string> = {
  scheduled: 'badge-blue',
  in_progress: 'badge-yellow',
  completed: 'badge-green',
  cancelled: 'badge-gray',
  rescheduled: 'badge-purple'
};

const Activities: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>(demoActivities);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ActivityType | 'all'>('all');

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.accountName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || activity.activityType === typeFilter;
    return matchesSearch && matchesType;
  });

  const scheduledCount = activities.filter(a => a.status === 'scheduled').length;
  const completedCount = activities.filter(a => a.status === 'completed').length;
  const overdueCount = activities.filter(a => a.isOverdue).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-heading-1">Activities</h1>
          <p className="text-body mt-1">Manage your calls, emails, and meetings</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary btn-sm">
            <Calendar size={16} />
            Calendar View
          </button>
          <button className="btn btn-primary btn-sm">
            <Plus size={16} />
            Log Activity
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Scheduled</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{scheduledCount}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-100">
              <Clock size={20} className="text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Completed</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{completedCount}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-100">
              <CheckCircle size={20} className="text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Overdue</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{overdueCount}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-red-100">
              <AlertCircle size={20} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-with-icon-left"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ActivityType | 'all')}
              className="input input-sm w-auto"
            >
              <option value="all">All Types</option>
              <option value="call">Calls</option>
              <option value="email">Emails</option>
              <option value="meeting">Meetings</option>
              <option value="task">Tasks</option>
            </select>
            <button className="btn btn-secondary btn-sm">
              <Filter size={16} />
              More Filters
            </button>
          </div>
        </div>

        {/* Activities List */}
        <div className="divide-y divide-gray-100">
          {filteredActivities.map(activity => {
            const TypeIcon = activityTypeConfig[activity.activityType]?.icon || Mail;
            const typeColor = activityTypeConfig[activity.activityType]?.color || 'text-slate-600';
            const typeBg = activityTypeConfig[activity.activityType]?.bg || 'bg-slate-100';
            
            return (
              <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl ${typeBg}`}>
                    <TypeIcon size={20} className={typeColor} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-medium text-slate-800">{activity.subject}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                          {activity.contactName && (
                            <span className="flex items-center gap-1">
                              <User size={14} />
                              {activity.contactName}
                            </span>
                          )}
                          {activity.accountName && (
                            <span className="flex items-center gap-1">
                              <Building2 size={14} />
                              {activity.accountName}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {activity.isOverdue && (
                          <span className="badge badge-sm badge-red">
                            <AlertCircle size={12} />
                            Overdue
                          </span>
                        )}
                        <span className={`badge badge-sm ${statusColors[activity.status]}`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3">
                      {activity.scheduledStart && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar size={12} />
                          {new Date(activity.scheduledStart).toLocaleDateString('en-US', { 
                            weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                          })}
                        </span>
                      )}
                      {activity.durationMinutes && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock size={12} />
                          {activity.durationMinutes} min
                        </span>
                      )}
                      {activity.dealName && (
                        <span className="text-xs text-blue-600 font-medium">
                          {activity.dealName}
                        </span>
                      )}
                    </div>
                    
                    {activity.outcome && (
                      <p className="mt-2 text-sm text-slate-600 bg-gray-50 rounded-lg p-2">
                        <strong>Outcome:</strong> {activity.outcome}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Activities;

