import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Calendar,
  Download,
  Filter,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const Reports: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-heading-1">Reports & Analytics</h1>
          <p className="text-body mt-1">Track your sales performance and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="input input-sm w-auto">
            <option>Last 30 Days</option>
            <option>Last Quarter</option>
            <option>Last Year</option>
            <option>All Time</option>
          </select>
          <button className="btn btn-secondary btn-sm">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-blue-100">
              <DollarSign size={20} className="text-blue-600" />
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <ArrowUpRight size={14} />
              12.5%
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-4">$485,000</p>
          <p className="text-sm text-slate-500 mt-1">Revenue Won</p>
        </div>
        
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-violet-100">
              <Target size={20} className="text-violet-600" />
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <ArrowUpRight size={14} />
              8.2%
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-4">$1.25M</p>
          <p className="text-sm text-slate-500 mt-1">Pipeline Value</p>
        </div>
        
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-emerald-100">
              <TrendingUp size={20} className="text-emerald-600" />
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-red-600">
              <ArrowDownRight size={14} />
              2.4%
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-4">68%</p>
          <p className="text-sm text-slate-500 mt-1">Win Rate</p>
        </div>
        
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-amber-100">
              <Calendar size={20} className="text-amber-600" />
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <ArrowUpRight size={14} />
              5 days
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-4">32 days</p>
          <p className="text-sm text-slate-500 mt-1">Avg. Sales Cycle</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-heading-3">Revenue Trend</h2>
            <button className="btn btn-ghost btn-sm">
              <Filter size={16} />
            </button>
          </div>
          <div className="card-body">
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-violet-50 rounded-xl">
              <div className="text-center">
                <BarChart3 size={48} className="text-blue-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Revenue chart visualization</p>
                <p className="text-xs text-slate-400 mt-1">Integrate with Chart.js or Recharts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline by Stage */}
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-heading-3">Pipeline by Stage</h2>
            <button className="btn btn-ghost btn-sm">
              <Filter size={16} />
            </button>
          </div>
          <div className="card-body">
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl">
              <div className="text-center">
                <PieChart size={48} className="text-violet-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Pipeline distribution chart</p>
                <p className="text-xs text-slate-400 mt-1">Integrate with Chart.js or Recharts</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-heading-3">Team Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Sales Rep</th>
                <th>Deals Won</th>
                <th>Revenue</th>
                <th>Win Rate</th>
                <th>Activities</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="avatar avatar-sm">
                      <span>AJ</span>
                    </div>
                    <span className="font-medium text-slate-800">Alex Johnson</span>
                  </div>
                </td>
                <td className="font-semibold text-slate-800">12</td>
                <td className="font-semibold text-slate-800">$285,000</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '72%' }} />
                    </div>
                    <span className="text-sm text-slate-600">72%</span>
                  </div>
                </td>
                <td className="text-slate-600">156</td>
                <td>
                  <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                    <ArrowUpRight size={14} />
                    +15%
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="avatar avatar-sm bg-gradient-to-br from-pink-500 to-rose-500">
                      <span>EW</span>
                    </div>
                    <span className="font-medium text-slate-800">Emily White</span>
                  </div>
                </td>
                <td className="font-semibold text-slate-800">8</td>
                <td className="font-semibold text-slate-800">$165,000</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '65%' }} />
                    </div>
                    <span className="text-sm text-slate-600">65%</span>
                  </div>
                </td>
                <td className="text-slate-600">98</td>
                <td>
                  <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                    <ArrowUpRight size={14} />
                    +8%
                  </span>
                </td>
              </tr>
              <tr>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="avatar avatar-sm bg-gradient-to-br from-cyan-500 to-blue-500">
                      <span>MK</span>
                    </div>
                    <span className="font-medium text-slate-800">Michael Kim</span>
                  </div>
                </td>
                <td className="font-semibold text-slate-800">5</td>
                <td className="font-semibold text-slate-800">$95,000</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '55%' }} />
                    </div>
                    <span className="text-sm text-slate-600">55%</span>
                  </div>
                </td>
                <td className="text-slate-600">72</td>
                <td>
                  <span className="flex items-center gap-1 text-red-600 text-sm font-medium">
                    <ArrowDownRight size={14} />
                    -3%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Reports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="card p-5 text-left hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 group-hover:bg-blue-200 transition-colors">
              <BarChart3 size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Sales Forecast</h3>
              <p className="text-xs text-slate-500">Projected revenue analysis</p>
            </div>
          </div>
        </button>
        
        <button className="card p-5 text-left hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-100 group-hover:bg-violet-200 transition-colors">
              <Users size={20} className="text-violet-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Lead Sources</h3>
              <p className="text-xs text-slate-500">Where leads come from</p>
            </div>
          </div>
        </button>
        
        <button className="card p-5 text-left hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
              <TrendingUp size={20} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Conversion Analysis</h3>
              <p className="text-xs text-slate-500">Stage-by-stage conversion</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Reports;

