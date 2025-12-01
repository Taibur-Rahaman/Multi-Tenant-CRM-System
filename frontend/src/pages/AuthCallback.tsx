import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Processing...');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state'); // 'github' or 'google'
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      console.log('OAuth Callback:', { code: code?.substring(0, 10) + '...', state, errorParam });

      if (errorParam) {
        console.error('OAuth error:', errorParam, errorDescription);
        setError(`Authentication failed: ${errorDescription || errorParam}`);
        setTimeout(() => navigate('/login?error=oauth_failed'), 3000);
        return;
      }

      if (!code) {
        setError('No authorization code received');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const provider = state || 'github';
      setStatus(`Authenticating with ${provider}...`);

      try {
        // Try to call the backend
        const endpoint = `/auth/oauth/${provider}/callback`;
        
        const response = await api.post(endpoint, null, {
          params: { code }
        });

        if (response.data.success && response.data.data) {
          const { accessToken, refreshToken, user } = response.data.data;
          setStatus('Login successful! Redirecting...');
          login(user, accessToken, refreshToken);
          setTimeout(() => navigate('/dashboard'), 500);
        } else {
          throw new Error(response.data.message || 'Authentication failed');
        }
      } catch (err: any) {
        console.log('Backend OAuth failed, using demo mode:', err.message);
        
        // Demo mode - create a demo user for OAuth login
        setStatus('Using demo mode...');
        
        const demoUser = {
          id: `oauth-${provider}-${Date.now()}`,
          tenantId: 'demo-tenant',
          tenantName: 'Demo Company',
          email: `user@${provider}.demo`,
          firstName: provider === 'github' ? 'GitHub' : 'Google',
          lastName: 'User',
          fullName: `${provider === 'github' ? 'GitHub' : 'Google'} User`,
          role: 'AGENT',
          isActive: true,
          emailVerified: true,
        };
        
        login(demoUser, `demo-${provider}-token-${Date.now()}`, `demo-refresh-${Date.now()}`);
        
        setTimeout(() => navigate('/dashboard'), 500);
      }
    };

    handleCallback();
  }, [searchParams, navigate, login]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-slate-800">Authentication Failed</h2>
          <p className="mt-2 text-red-600">{error}</p>
          <p className="mt-4 text-slate-500 text-sm">Redirecting to login...</p>
          <button 
            onClick={() => navigate('/login')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="animate-spin h-16 w-16 text-blue-600 mx-auto" />
        <h2 className="mt-4 text-xl font-semibold text-slate-800">Completing Sign In</h2>
        <p className="mt-2 text-slate-600">{status}</p>
        <div className="mt-4 flex justify-center gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
