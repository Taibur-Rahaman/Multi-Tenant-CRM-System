import React, { useState } from 'react';
import { 
  Mail, 
  Calendar, 
  MessageCircle, 
  GitBranch, 
  Phone, 
  Check, 
  X,
  Settings,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  connected: boolean;
  lastSync?: string;
}

const integrations: Integration[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Sync emails and send messages directly from CRM',
    icon: Mail,
    color: 'bg-red-100 text-red-600',
    connected: true,
    lastSync: '5 minutes ago',
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sync meetings and schedule events',
    icon: Calendar,
    color: 'bg-blue-100 text-blue-600',
    connected: true,
    lastSync: '10 minutes ago',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Receive messages and notifications via Telegram',
    icon: MessageCircle,
    color: 'bg-sky-100 text-sky-600',
    connected: false,
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Create and track issues from customer interactions',
    icon: GitBranch,
    color: 'bg-blue-100 text-blue-700',
    connected: false,
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Sync issues and project management',
    icon: GitBranch,
    color: 'bg-purple-100 text-purple-600',
    connected: false,
  },
  {
    id: 'twilio',
    name: 'Twilio (Telephony)',
    description: 'Make and receive calls directly from CRM',
    icon: Phone,
    color: 'bg-red-100 text-red-500',
    connected: true,
    lastSync: 'Real-time',
  },
];

const Integrations: React.FC = () => {
  const [integrationsState, setIntegrationsState] = useState(integrations);

  const handleConnect = (id: string) => {
    // In a real app, this would open OAuth flow or configuration modal
    console.log(`Connecting ${id}...`);
  };

  const handleDisconnect = (id: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) return;
    setIntegrationsState(prev => 
      prev.map(i => i.id === id ? { ...i, connected: false, lastSync: undefined } : i)
    );
  };

  const handleSync = (id: string) => {
    console.log(`Syncing ${id}...`);
    // Trigger manual sync
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Integrations</h1>
        <p className="text-slate-500 mt-1">Connect your favorite tools to enhance your CRM</p>
      </div>

      {/* Connected Integrations */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Connected</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrationsState.filter(i => i.connected).map((integration) => (
            <div key={integration.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${integration.color}`}>
                    <integration.icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{integration.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <Check size={14} />
                      <span>Connected</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-slate-500 mt-3">{integration.description}</p>
              
              {integration.lastSync && (
                <p className="text-xs text-slate-400 mt-2">
                  Last synced: {integration.lastSync}
                </p>
              )}
              
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => handleSync(integration.id)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <RefreshCw size={16} />
                  Sync
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <Settings size={16} />
                  Settings
                </button>
                <button 
                  onClick={() => handleDisconnect(integration.id)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                >
                  <X size={16} />
                  Disconnect
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available Integrations */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Available</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrationsState.filter(i => !i.connected).map((integration) => (
            <div key={integration.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${integration.color}`}>
                    <integration.icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{integration.name}</h3>
                    <p className="text-sm text-slate-400">Not connected</p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-slate-500 mt-3">{integration.description}</p>
              
              <button 
                onClick={() => handleConnect(integration.id)}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink size={16} />
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Webhook Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Webhooks</h2>
        <p className="text-slate-500 mb-4">
          Use webhooks to receive real-time updates when events happen in your CRM.
        </p>
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-sm text-slate-600 mb-2">Webhook URL:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-slate-100 px-3 py-2 rounded text-sm text-slate-700 font-mono">
              https://api.yourcrm.com/webhooks/abc123xyz
            </code>
            <button className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
              Copy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Integrations;

