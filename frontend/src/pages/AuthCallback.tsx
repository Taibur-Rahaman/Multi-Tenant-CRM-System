import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state'); // 'github' or 'google'
      const errorParam = searchParams.get('error');

      if (errorParam) {
        console.error('OAuth error:', errorParam);
        setError(`Authentication failed: ${errorParam}`);
        setTimeout(() => navigate('/login?error=oauth_failed'), 3000);
        return;
      }

      if (!code) {
        navigate('/login');
        return;
      }

      try {
        // Call the appropriate backend endpoint based on provider
        const provider = state || 'github';
        const endpoint = `/auth/oauth/${provider}/callback`;
        
        const response = await api.post(endpoint, null, {
          params: { code }
        });

        if (response.data.success && response.data.data) {
          const { accessToken, refreshToken, user } = response.data.data;
          login(user, accessToken, refreshToken);
          navigate('/dashboard');
        } else {
          setError(response.data.message || 'Authentication failed');
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        
        // Demo mode fallback
        if (state === 'github' || state === 'google') {
          const demoUser = {
            id: 'oauth-user-1',
            tenantId: 'demo-tenant',
            tenantName: 'Demo Company',
            email: `demo@${state}.local`,
            firstName: 'OAuth',
            lastName: 'User',
            fullName: 'OAuth User',
            role: 'AGENT',
            isActive: true,
            emailVerified: true,
          };
          login(demoUser, 'demo-oauth-token', 'demo-refresh-token');
          navigate('/dashboard');
          return;
        }
        
        setError(err.response?.data?.message || 'Authentication failed. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, login]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600">{error}</p>
          <p className="mt-2 text-slate-500 text-sm">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
        <p className="mt-4 text-slate-600">Completing authentication...</p>
        <p className="mt-2 text-slate-400 text-sm">Please wait while we verify your credentials</p>
      </div>
    </div>
  );
};

export default AuthCallback;
