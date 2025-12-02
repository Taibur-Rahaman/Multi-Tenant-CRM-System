import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Target, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Chrome,
  Github,
  Sparkles,
  Shield,
  Zap,
  Users,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';
import api from '../services/api';
import { githubApi, type GitHubUser } from '../services/githubApi';

interface OAuthProvider {
  clientId: string;
  redirectUri: string;
  authUrl: string;
  scope: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [oauthProviders, setOauthProviders] = useState<Record<string, OAuthProvider>>({});
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [githubUserData, setGithubUserData] = useState<GitHubUser | null>(null);
  const [showGithubInfo, setShowGithubInfo] = useState(false);

  // Fetch OAuth providers on mount
  useEffect(() => {
    const fetchOAuthProviders = async () => {
      try {
        const response = await api.get('/auth/oauth/providers');
        if (response.data.success && response.data.data) {
          setOauthProviders(response.data.data);
        }
      } catch (err) {
        console.log('OAuth providers not available (backend may be offline)');
        // Set default providers for demo mode
        setOauthProviders({
          github: {
            clientId: '',
            redirectUri: 'http://localhost:5173/auth/callback',
            authUrl: 'https://github.com/login/oauth/authorize',
            scope: 'user:email read:user'
          },
          google: {
            clientId: '',
            redirectUri: 'http://localhost:5173/auth/callback',
            authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
            scope: 'openid profile email'
          }
        });
      }
    };
    fetchOAuthProviders();
  }, []);

  // Fetch GitHub user data from API (using username search or token)
  const fetchGitHubUserData = async (username?: string) => {
    if (!username) return;
    
    try {
      setLoading(true);
      const userInfo = await githubApi.getPublicUserInfo(username);
      setGithubUserData(userInfo);
      setShowGithubInfo(true);
    } catch (err: any) {
      console.error('Failed to fetch GitHub user data:', err.message);
      setError('Could not fetch GitHub user information');
    } finally {
      setLoading(false);
    }
  };

  // Handle OAuth login
  const handleOAuthLogin = (provider: 'github' | 'google') => {
    const config = oauthProviders[provider];
    
    if (!config || !config.clientId) {
      // Demo mode - simulate OAuth flow
      setOauthLoading(provider);
      setTimeout(() => {
        setAuth({
          accessToken: `demo-${provider}-token`,
          refreshToken: `demo-${provider}-refresh`,
          tokenType: 'Bearer',
          expiresIn: 3600,
          user: {
            id: `oauth-${provider}-demo`,
            tenantId: '1',
            tenantName: 'Demo Company',
            email: `demo@${provider}.com`,
            firstName: provider === 'github' ? 'GitHub' : 'Google',
            lastName: 'User',
            fullName: `${provider === 'github' ? 'GitHub' : 'Google'} User`,
            role: 'TENANT_ADMIN',
            isActive: true,
            emailVerified: true,
            createdAt: new Date().toISOString()
          }
        });
        navigate('/dashboard');
      }, 1000);
      return;
    }

    // Build OAuth URL
    const redirectUri = config.redirectUri || `${window.location.origin}/auth/callback`;
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      scope: config.scope,
      response_type: 'code',
      state: provider // Pass provider name as state to identify in callback
    });

    // Google requires additional params
    if (provider === 'google') {
      params.append('access_type', 'offline');
      params.append('prompt', 'consent');
    }

    // Redirect to OAuth provider
    window.location.href = `${config.authUrl}?${params.toString()}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login({ email, password });
      if (response.data.success && response.data.data) {
        setAuth(response.data.data);
        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      // Demo mode - allow login with demo credentials
      if (email === 'admin@demo.com' && password === 'admin123') {
        setAuth({
          accessToken: 'demo-token',
          refreshToken: 'demo-refresh',
          tokenType: 'Bearer',
          expiresIn: 3600,
          user: {
            id: '1',
            tenantId: '1',
            tenantName: 'Demo Company',
            email: 'admin@demo.com',
            firstName: 'Admin',
            lastName: 'User',
            fullName: 'Admin User',
            role: 'TENANT_ADMIN',
            isActive: true,
            emailVerified: true,
            createdAt: new Date().toISOString()
          }
        });
        navigate('/dashboard');
      } else {
        setError('Invalid credentials. Try admin@demo.com / admin123');
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Zap, title: 'Lightning Fast', description: 'Optimized for speed and efficiency' },
    { icon: Shield, title: 'Enterprise Security', description: 'Bank-grade encryption & compliance' },
    { icon: Users, title: 'Team Collaboration', description: 'Real-time updates & notifications' },
    { icon: Sparkles, title: 'AI-Powered', description: 'Smart insights & automation' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-violet-600/30 rounded-full blur-3xl"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Target size={22} className="text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              SIRA
            </span>
          </div>
          
          {/* Main Content */}
          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight">
              Close more deals with{' '}
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                intelligent CRM
              </span>
            </h1>
            <p className="text-slate-400 mt-4 text-lg leading-relaxed">
              Empower your sales team with AI-powered insights, seamless integrations, and a beautiful interface that makes selling enjoyable.
            </p>
            
            {/* Features */}
            <div className="grid grid-cols-2 gap-4 mt-10">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white/10">
                    <feature.icon size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{feature.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* GitHub User Info Display */}
          {githubUserData && showGithubInfo && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <img 
                  src={githubUserData.avatar_url} 
                  alt={githubUserData.name || githubUserData.login}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-semibold">{githubUserData.name || githubUserData.login}</p>
                  <p className="text-xs text-slate-400">@{githubUserData.login}</p>
                </div>
                <button 
                  onClick={() => setShowGithubInfo(false)}
                  className="ml-auto text-slate-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              {githubUserData.bio && (
                <p className="text-sm text-slate-300 mb-3">{githubUserData.bio}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>{githubUserData.followers} followers</span>
                <span>{githubUserData.following} following</span>
                <span>{githubUserData.public_repos} repos</span>
              </div>
            </div>
          )}
          
          {/* Testimonial */}
          {!githubUserData && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <p className="text-slate-300 italic">
                "SIRA transformed our sales process. We've increased our close rate by 40% in just 3 months."
              </p>
              <div className="flex items-center gap-3 mt-4">
                <div className="avatar avatar-sm">
                  <span>JD</span>
                </div>
                <div>
                  <p className="text-sm font-medium">John Doe</p>
                  <p className="text-xs text-slate-500">VP Sales, TechCorp</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Target size={22} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900">SIRA</span>
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 mt-2">Sign in to your account to continue</p>
          </div>
          
          {/* GitHub Username Search */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Github size={18} className="text-slate-600" />
              <p className="text-sm font-medium text-slate-700">Try GitHub API</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter GitHub username..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const username = (e.target as HTMLInputElement).value.trim();
                    if (username) {
                      fetchGitHubUserData(username);
                    }
                  }
                }}
                className="input input-sm flex-1"
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Enter GitHub username..."]') as HTMLInputElement;
                  if (input?.value.trim()) {
                    fetchGitHubUserData(input.value.trim());
                  }
                }}
                className="btn btn-secondary btn-sm"
                disabled={loading}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Fetch'}
              </button>
            </div>
          </div>
          
          {/* Demo Credentials Notice */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Demo Credentials:</strong><br />
              Email: admin@demo.com<br />
              Password: admin123
            </p>
          </div>
          
          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="input input-with-icon-left"
                  required
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
                <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input input-with-icon-left pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-slate-600">
                Remember me for 30 days
              </label>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign in
                  <ArrowRight size={18} />
                </span>
              )}
            </button>
          </form>
          
          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-50 text-slate-500">Or continue with</span>
            </div>
          </div>
          
          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={oauthLoading !== null}
              className="btn btn-secondary w-full"
            >
              {oauthLoading === 'google' ? (
                <span className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-600 rounded-full animate-spin"></span>
              ) : (
                <Chrome size={18} />
              )}
              Google
            </button>
            <button 
              type="button"
              onClick={() => handleOAuthLogin('github')}
              disabled={oauthLoading !== null}
              className="btn btn-secondary w-full"
            >
              {oauthLoading === 'github' ? (
                <span className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-600 rounded-full animate-spin"></span>
              ) : (
                <Github size={18} />
              )}
              GitHub
            </button>
          </div>
          
          {/* Sign Up Link */}
          <p className="text-center text-sm text-slate-500 mt-8">
            Don't have an account?{' '}
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              Start free trial
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
