import React, { useState, useEffect, useCallback } from 'react';
import { 
  Mail, 
  Calendar, 
  MessageCircle, 
  Phone, 
  Check, 
  X,
  Settings,
  RefreshCw,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Link2
} from 'lucide-react';
import { integrationsApi, IntegrationStatus as IntegrationStatusType } from '../services/api';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType | string;
  color: string;
  connected: boolean;
  configured: boolean;
  lastSync?: string;
  docsUrl?: string;
}

const integrationMetadata: Record<string, Omit<Integration, 'id' | 'connected' | 'configured' | 'lastSync'>> = {
  gmail: {
    name: 'Gmail',
    description: 'Sync emails and send messages directly from CRM',
    icon: Mail,
    color: 'bg-red-100 text-red-600',
    docsUrl: 'https://developers.google.com/gmail/api',
  },
  calendar: {
    name: 'Google Calendar',
    description: 'Sync meetings and schedule events',
    icon: Calendar,
    color: 'bg-blue-100 text-blue-600',
    docsUrl: 'https://developers.google.com/calendar',
  },
  telegram: {
    name: 'Telegram',
    description: 'Receive messages and notifications via Telegram',
    icon: MessageCircle,
    color: 'bg-sky-100 text-sky-600',
    docsUrl: 'https://core.telegram.org/bots',
  },
  jira: {
    name: 'Jira',
    description: 'Create and track issues from customer interactions',
    icon: '🔷',
    color: 'bg-blue-100 text-blue-700',
    docsUrl: 'https://developer.atlassian.com/cloud/jira/platform/rest/v3/',
  },
  linear: {
    name: 'Linear',
    description: 'Sync issues and project management',
    icon: '💜',
    color: 'bg-purple-100 text-purple-600',
    docsUrl: 'https://linear.app/docs/api',
  },
  twilio: {
    name: 'Twilio (Telephony)',
    description: 'Make and receive calls directly from CRM',
    icon: Phone,
    color: 'bg-red-100 text-red-500',
    docsUrl: 'https://www.twilio.com/docs',
  },
};

const Integrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJiraModal, setShowJiraModal] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  
  // Jira config form
  const [jiraConfig, setJiraConfig] = useState({
    baseUrl: '',
    email: '',
    apiToken: '',
    defaultProjectKey: ''
  });
  const [jiraConnectionStatus, setJiraConnectionStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [jiraError, setJiraError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await integrationsApi.getAllStatus();
      
      if (response.data?.data) {
        const statuses = response.data.data;
        const mapped = statuses.map((status: IntegrationStatusType) => {
          const metadata = integrationMetadata[status.integrationType];
          return {
            id: status.integrationType,
            name: metadata?.name || status.integrationType,
            description: metadata?.description || '',
            icon: metadata?.icon || Link2,
            color: metadata?.color || 'bg-slate-100 text-slate-600',
            connected: status.isEnabled,
            configured: status.isConfigured,
            lastSync: status.lastSyncAt ? formatLastSync(status.lastSyncAt) : undefined,
            docsUrl: metadata?.docsUrl,
          };
        });
        setIntegrations(mapped);
        
        // Load Jira config if available
        const jiraStatus = statuses.find((s: IntegrationStatusType) => s.integrationType === 'jira');
        if (jiraStatus?.config) {
          setJiraConfig(prev => ({
            ...prev,
            baseUrl: (jiraStatus.config?.baseUrl as string) || '',
            defaultProjectKey: (jiraStatus.config?.defaultProjectKey as string) || ''
          }));
          if (jiraStatus.isEnabled && jiraStatus.isConfigured) {
            setJiraConnectionStatus('connected');
          }
        }
      }
    } catch (error) {
      console.error('Failed to load integrations:', error);
      // Fallback to static list
      const staticIntegrations = Object.entries(integrationMetadata).map(([id, meta]) => ({
        id,
        ...meta,
        connected: false,
        configured: false,
      }));
      setIntegrations(staticIntegrations);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  const formatLastSync = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const handleConnect = (id: string) => {
    if (id === 'jira') {
      setShowJiraModal(true);
    } else {
      // For other integrations, show a coming soon message or open docs
      const integration = integrations.find(i => i.id === id);
      if (integration?.docsUrl) {
        window.open(integration.docsUrl, '_blank');
      } else {
        alert('Integration configuration coming soon!');
      }
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) return;
    
    try {
      await integrationsApi.disable(id);
      setIntegrations(prev => 
        prev.map(i => i.id === id ? { ...i, connected: false } : i)
      );
      if (id === 'jira') {
        setJiraConnectionStatus('idle');
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
      alert('Failed to disconnect integration');
    }
  };

  const handleSync = async (id: string) => {
    setSyncing(id);
    try {
      // Trigger sync based on integration type
      if (id === 'jira') {
        const { issuesApi } = await import('../services/api');
        await issuesApi.syncFromJira();
      } else if (id === 'linear') {
        const { issuesApi } = await import('../services/api');
        await issuesApi.syncFromLinear();
      }
      
      // Reload integration status
      loadIntegrations();
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Sync failed. Please check your configuration.');
    } finally {
      setSyncing(null);
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
          loadIntegrations();
          alert('✅ Jira connected successfully!');
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

  const connectedIntegrations = integrations.filter(i => i.connected);
  const availableIntegrations = integrations.filter(i => !i.connected);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Integrations</h1>
        <p className="text-slate-500 mt-1">Connect your favorite tools to enhance your CRM</p>
      </div>

      {/* Connected Integrations */}
      {connectedIntegrations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Connected</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connectedIntegrations.map((integration) => {
              const IconComponent = typeof integration.icon === 'string' ? null : integration.icon;
              return (
                <div key={integration.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${integration.color}`}>
                        {IconComponent ? <IconComponent size={24} /> : <span className="text-2xl">{integration.icon}</span>}
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
                      disabled={syncing === integration.id}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <RefreshCw size={16} className={syncing === integration.id ? 'animate-spin' : ''} />
                      {syncing === integration.id ? 'Syncing...' : 'Sync'}
                    </button>
                    <button 
                      onClick={() => handleConnect(integration.id)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
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
              );
            })}
          </div>
        </div>
      )}

      {/* Available Integrations */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Available</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableIntegrations.map((integration) => {
            const IconComponent = typeof integration.icon === 'string' ? null : integration.icon;
            return (
              <div key={integration.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${integration.color}`}>
                      {IconComponent ? <IconComponent size={24} /> : <span className="text-2xl">{integration.icon}</span>}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{integration.name}</h3>
                      <p className="text-sm text-slate-400">
                        {integration.configured ? 'Configured' : 'Not connected'}
                      </p>
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
            );
          })}
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
            <code className="flex-1 bg-slate-100 px-3 py-2 rounded text-sm text-slate-700 font-mono overflow-x-auto">
              {`${window.location.origin}/api/webhooks/incoming`}
            </code>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/incoming`);
                alert('Copied to clipboard!');
              }}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      {/* Jira Configuration Modal */}
      {showJiraModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <span className="text-xl">🔷</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Connect Jira</h2>
                  <p className="text-sm text-slate-500">Sync your Jira issues with CRM</p>
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
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-2">How to get your API Token:</h3>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Go to <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noopener noreferrer" className="underline">Atlassian API Tokens</a></li>
                  <li>Click "Create API token"</li>
                  <li>Give it a name (e.g., "CRM Integration")</li>
                  <li>Copy and paste the token below</li>
                </ol>
              </div>
              
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
                <p className="text-xs text-slate-400 mt-1">Your Atlassian Cloud instance URL</p>
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
                <p className="text-xs text-slate-400 mt-1">The email associated with your Atlassian account</p>
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
                  placeholder="••••••••••••••••••••"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Default Project Key (Optional)
                </label>
                <input
                  type="text"
                  value={jiraConfig.defaultProjectKey}
                  onChange={(e) => setJiraConfig({...jiraConfig, defaultProjectKey: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none font-mono"
                  placeholder="CRM"
                />
                <p className="text-xs text-slate-400 mt-1">The project key to sync issues from (e.g., CRM, PROJ)</p>
              </div>
            </div>
            
            <div className="p-5 border-t border-slate-200 flex justify-between gap-3 sticky bottom-0 bg-white">
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

export default Integrations;
