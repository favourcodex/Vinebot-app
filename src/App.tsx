/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import { apiFetch, getApiUrl } from './utils/api';
import { LandingPage } from './components/LandingPage';
import { Navigation } from './components/Navigation';
import { DashboardHome } from './components/DashboardHome';
import { Mt5Form } from './components/Mt5Form';
import { Timeline } from './components/Timeline';
import { SubscriptionCard } from './components/SubscriptionCard';
import { SettingsPage } from './components/Settings';
import { AdminPanel } from './components/AdminPanel';
import { AdminLayout, AdminTab } from './layouts/AdminLayout';
import { TradeHistory } from './components/TradeHistory';
import { TermsPage, PrivacyPage, CookiePolicyPage, RiskDisclosurePage } from './components/LegalPages';
import { OnboardingTerms } from './components/OnboardingTerms';
import { VerifyEmailView } from './components/VerifyEmailView';
import { GoogleCallback } from './components/GoogleCallback';
import { LoginPage } from './components/LoginPage';
import { Logo } from './components/common/Logo';
import { Preloader } from './components/common/Preloader';
import { AnimatePresence } from 'motion/react';
import { 
  Bot, Lock, Mail, ChevronRight, User, KeyRound, 
  ArrowLeft, CheckCircle2, AlertTriangle, Sparkles, ShieldAlert
} from 'lucide-react';

function AppContent() {
  const { state, login, apiRequest, logout } = useAuth();
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  
  // State-based routing with initial path support to handle direct browser visits
  const [route, setRoute] = useState<string>(() => {
    const path = window.location.pathname;
    if (path === '/admin' || path === '/admin-login') {
      return '/admin';
    }
    if (['/verify-email', '/auth/callback', '/auth/google/callback', '/terms', '/privacy', '/cookie-policy', '/risk-disclosure', '/onboarding/terms'].includes(path)) {
      return path;
    }
    return '/';
  });

  const handleNavigate = (newRoute: string) => {
    if (newRoute === route) return;
    setIsRouteLoading(true);
    setRoute(newRoute);
    setTimeout(() => {
      setIsRouteLoading(false);
    }, 400);
  };
  const [dashboardTab, setDashboardTab] = useState<string>('dashboard');
  const [adminTab, setAdminTab] = useState<AdminTab>('overview');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState<boolean>(true);

  // Check if Google Authentication is configured on the backend
  useEffect(() => {
    const checkGoogleConfig = async () => {
      try {
        const res = await apiFetch('/api/auth/google/config');
        if (res.ok) {
          const data = await res.json();
          setGoogleConfigured(!!data.configured);
        }
      } catch (err) {
        console.warn('Google Auth configuration check notice:', err);
      }
    };
    checkGoogleConfig();
  }, []);

  const [sentMagicLinkEmail, setSentMagicLinkEmail] = useState<string | null>(null);

  // Sync route on auth state
  useEffect(() => {
    const isPublicLegal = ['/terms', '/privacy', '/cookie-policy', '/risk-disclosure', '/verify-email', '/auth/callback', '/auth/google/callback'].includes(route);
    if (isPublicLegal) return;

    if (state.isAuthenticated) {
      if (state.user?.hasAcceptedTerms === false) {
        setRoute('/onboarding/terms');
      } else if (route === '/login' || route === '/register' || route === '/admin-login') {
        if (state.user?.role === 'ADMIN') {
          setRoute('/admin');
        } else {
          setRoute('/dashboard');
        }
      }
    } else if (route === '/dashboard' || route === '/onboarding/terms') {
      setRoute('/');
    }
  }, [state.isAuthenticated, state.user?.hasAcceptedTerms, route]);

  // Google OAuth message listener
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      // Allow local development, Cloud Run, Railway, Netlify, or same origin
      const isAllowedOrigin = !origin || 
        origin === window.location.origin || 
        origin.endsWith('.run.app') || 
        origin.includes('localhost') || 
        origin.includes('127.0.0.1') || 
        origin.includes('vercel.app') || 
        origin.includes('netlify.app') || 
        origin.includes('railway.app');

      if (!isAllowedOrigin) return;
      
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        const token = event.data.token || event.data.data?.token;
        const refreshToken = event.data.refreshToken || event.data.data?.refreshToken || '';
        let user = event.data.user || event.data.data?.user;

        if (token) {
          localStorage.setItem('token', token);
          localStorage.setItem('vinebot_token', token);

          if (!user || typeof user.hasAcceptedTerms === 'undefined') {
            try {
              const res = await apiFetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (res.ok) {
                const json = await res.json();
                if (json.success && json.data) {
                  user = json.data;
                }
              }
            } catch (err) {
              console.error('Failed to fetch profile in message listener:', err);
            }
          }

          if (user) {
            localStorage.setItem('vinebot_user', JSON.stringify(user));
          }

          login(token, refreshToken, user);

          // MANDATORY ROUTING GATEWAY (ONBOARDING vs DASHBOARD)
          if (user && user.hasAcceptedTerms === false) {
            setRoute('/onboarding/terms');
          } else {
            setRoute('/dashboard');
          }

          setAuthSuccess('Successfully logged in with Google!');
          setTimeout(() => setAuthSuccess(null), 4000);
        }
      } else if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
        setAuthError(event.data.message || 'Google Authentication failed.');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [login]);

  // Listen for Paystack Redirection Success Parameters
  useEffect(() => {
    if (state.isAuthenticated && route === '/dashboard') {
      const params = new URLSearchParams(window.location.search);
      const paymentStatus = params.get('payment');
      const planId = params.get('plan_id');
      const reference = params.get('reference') || params.get('trxref') || params.get('session_id');

      if ((paymentStatus === 'success' || reference) && planId) {
        // Clear query parameters from browser URL bar without reloading
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Execute instant secure activation handshake with Paystack verification API
        apiRequest('/api/payments/verify', {
          method: 'POST',
          body: JSON.stringify({ planId, reference })
        }).then(res => {
          if (res.success) {
            setDashboardTab('subscription'); // Open billing tab to let them view plan
          }
        }).catch(err => {
          console.error('Failed to verify Paystack subscription:', err);
        });
      }
    }
  }, [state.isAuthenticated, route]);

  const handleGoogleAuth = async (action: 'login' | 'signup') => {
    const width = 500;
    const height = 650;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    // Open a blank popup synchronously during the user gesture to completely bypass browser popup blockers
    const popup = window.open(
      'about:blank',
      'google_oauth_popup',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (popup) {
      popup.document.write(`
        <html>
          <head>
            <title>Connecting to Google...</title>
            <style>
              body {
                background-color: #07090d;
                color: #ffffff;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
              }
              .spinner {
                border: 3px solid rgba(255,255,255,0.1);
                border-top: 3px solid #3b82f6;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                animation: spin 1s linear infinite;
                margin-bottom: 16px;
              }
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              .text {
                font-size: 14px;
                font-weight: 500;
                color: #94a3b8;
              }
            </style>
          </head>
          <body>
            <div class="spinner"></div>
            <div class="text">Connecting to Google...</div>
          </body>
        </html>
      `);
    } else {
      setAuthError('OAuth window was blocked. Please enable popups in your browser settings to continue.');
      return;
    }

    try {
      setSubmitting(true);
      setAuthError(null);
      setAuthSuccess(null);
      
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      const res = await apiFetch(`/api/auth/google/url?redirectUri=${encodeURIComponent(redirectUri)}&action=${action}`);
      
      if (!res.ok) {
        throw new Error('Could not contact authentication server.');
      }
      
      const data = await res.json();
      if (!data.configured) {
        popup.close();
        setAuthError('Google Authentication is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET variables to your environment settings.');
        setSubmitting(false);
        return;
      }
      
      popup.location.href = data.url;
    } catch (err: any) {
      popup.close();
      setAuthError(err.message || 'Failed to initiate Google authentication.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle passwordless magic link request
  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = email || sentMagicLinkEmail;
    if (!targetEmail || !targetEmail.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    setAuthError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await apiRequest('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail.trim().toLowerCase() }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res && res.success) {
        setSentMagicLinkEmail(targetEmail.trim().toLowerCase());
        setAuthError(null);
      } else {
        setAuthError(res?.message || 'Failed to dispatch magic link. Please try again.');
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setAuthError('Network error or request timed out. Please try again.');
      } else {
        setAuthError(err.message || 'Network error or request timed out. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setAuthError('Please populate all credential inputs.');
      return;
    }
    if (password !== confirmPassword) {
      setAuthError('Credentials do not match.');
      return;
    }

    setSubmitting(true);
    setAuthError(null);
    setAuthSuccess(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await apiRequest('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res && res.success) {
        setAuthSuccess(res.message || 'Verification email sent! Please check your inbox (and check your Spam / Junk folder if you do not see it within 1-2 minutes).');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        // Redirect to login after 5 seconds to let user read the notice
        setTimeout(() => {
          setRoute('/login');
          setAuthSuccess(null);
        }, 5000);
      } else {
        setAuthError(res?.message || 'Registration failed.');
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      setAuthError(err.name === 'AbortError' ? 'Network error or request timed out. Please try again.' : (err.message || 'Network error occurred.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle standard login credentials
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Credentials required.');
      return;
    }

    setSubmitting(true);
    setAuthError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res && res.success && res.data) {
        login(res.data.token, res.data.refreshToken, res.data.user);
        setRoute('/dashboard');
      } else {
        setAuthError(res?.message || 'Login failed.');
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      setAuthError(err.name === 'AbortError' ? 'Network error or request timed out. Please try again.' : (err.message || 'Network error occurred.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Handle dedicated Admin console credentials login
  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Credentials required.');
      return;
    }

    setSubmitting(true);
    setAuthError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res && res.success && res.data) {
        if (res.data.user.role !== 'ADMIN') {
          setAuthError('Access Denied: This account does not possess administrator privileges.');
          return;
        }
        login(res.data.token, res.data.refreshToken, res.data.user);
        setRoute('/admin');
      } else {
        setAuthError(res?.message || 'Admin authentication failed.');
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      setAuthError(err.name === 'AbortError' ? 'Network error or request timed out. Please try again.' : (err.message || 'Network error occurred.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Switch to correct view
  const renderView = () => {
    switch (route) {
      case '/':
        return <LandingPage onNavigate={setRoute} />;
      
      case '/login':
      case '/register':
        return (
          <LoginPage
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            submitting={submitting}
            authError={authError}
            setAuthError={setAuthError}
            sentMagicLinkEmail={sentMagicLinkEmail}
            setSentMagicLinkEmail={setSentMagicLinkEmail}
            handleMagicLinkSubmit={handleMagicLinkSubmit}
            handleLoginSubmit={handleLoginSubmit}
            handleGoogleAuth={handleGoogleAuth}
            googleConfigured={googleConfigured}
            onNavigate={handleNavigate}
          />
        );

      case '/admin':
        if (!state.isAuthenticated) {
          return (
            <div className="bg-[#050505] min-h-screen text-gray-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
              <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <button 
                  onClick={() => setRoute('/')}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-6 transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Return home
                </button>
                <div className="w-12 h-12 bg-rose-600/20 border border-rose-500/30 rounded-xl flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                  <ShieldAlert className="w-6 h-6 text-rose-400" />
                </div>
                <h2 className="mt-4 text-2xl font-bold tracking-tight text-white uppercase font-mono">Operations Console</h2>
                <p className="mt-1 text-xs text-rose-400/80 uppercase tracking-widest font-mono text-[9px]">Authorized Administrators Only</p>
              </div>

              <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-[#0b0c10] border border-rose-500/20 py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10 shadow-rose-950/10">
                  {authError && (
                    <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <form className="space-y-4" onSubmit={handleAdminLoginSubmit}>
                    <div>
                      <label className="block text-[10px] font-semibold text-rose-400/60 uppercase tracking-wider mb-1.5">Admin Email ID</label>
                      <div className="relative">
                        <input 
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="admin@vinebot.app"
                          className="w-full bg-[#080a0e] border border-rose-950/40 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
                          required
                        />
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500/40" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10px] font-semibold text-rose-400/60 uppercase tracking-wider">Access Password</label>
                      </div>
                      <div className="relative">
                        <input 
                          type="password"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#080a0e] border border-rose-950/40 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
                          required
                        />
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500/40" />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-semibold text-xs tracking-wider rounded-lg transition uppercase flex items-center justify-center gap-1.5 cursor-pointer font-mono"
                    >
                      Authorize Console <ChevronRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          );
        }

        if (state.user?.role !== 'ADMIN') {
          return (
            <div className="bg-[#050505] min-h-screen text-gray-200 flex flex-col items-center justify-center p-4">
              <div className="text-center space-y-4 max-w-md">
                <div className="w-12 h-12 bg-rose-500/20 border border-rose-500/30 rounded-xl flex items-center justify-center mx-auto text-rose-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold text-white uppercase font-mono">Access Restricted</h2>
                <p className="text-xs text-gray-400">Your account ({state.user?.email}) does not possess administrator privileges on the Vinebot Operations Console.</p>
                <div className="pt-2 flex gap-3 justify-center">
                  <button onClick={() => setRoute('/dashboard')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase cursor-pointer">
                    Return to Dashboard
                  </button>
                  <button onClick={() => { logout(); setRoute('/admin-login'); }} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold uppercase cursor-pointer">
                    Switch Account
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <AdminLayout currentTab={adminTab} onTabChange={setAdminTab}>
            <AdminPanel activeTab={adminTab} onTabChange={setAdminTab} />
          </AdminLayout>
        );

      case '/admin-login':
        return (
          <div className="bg-[#050505] min-h-screen text-gray-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
              <button 
                onClick={() => setRoute('/')}
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-6 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Return home
              </button>
              <div className="w-12 h-12 bg-rose-600/20 border border-rose-500/30 rounded-xl flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                <ShieldAlert className="w-6 h-6 text-rose-400" />
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-white uppercase font-mono">Operations Console</h2>
              <p className="mt-1 text-xs text-rose-400/80 uppercase tracking-widest font-mono text-[9px]">Authorized Administrators Only</p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
              <div className="bg-[#0b0c10] border border-rose-500/20 py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10 shadow-rose-950/10">
                {authError && (
                  <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleAdminLoginSubmit}>
                  <div>
                    <label className="block text-[10px] font-semibold text-rose-400/60 uppercase tracking-wider mb-1.5">Admin Email ID</label>
                    <div className="relative">
                      <input 
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="admin@vinebot.app"
                        className="w-full bg-[#080a0e] border border-rose-950/40 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
                        required
                      />
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500/40" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[10px] font-semibold text-rose-400/60 uppercase tracking-wider">Access Password</label>
                    </div>
                    <div className="relative">
                      <input 
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#080a0e] border border-rose-950/40 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
                        required
                      />
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500/40" />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-semibold text-xs tracking-wider rounded-lg transition uppercase flex items-center justify-center gap-1.5 cursor-pointer font-mono"
                  >
                    Authorize Console <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        );

      case '/forgot-password':
        return (
          <div className="bg-[#07090d] min-h-screen text-gray-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
              <button 
                onClick={() => setRoute('/login')}
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-6 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Return to Login
              </button>
              <div className="w-12 h-12 bg-indigo-600/20 border border-indigo-500/30 rounded-xl flex items-center justify-center mx-auto">
                <Bot className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-white uppercase">Vault recovery</h2>
              <p className="mt-1 text-xs text-gray-400">Retrieve credentials via secured SMTP dispatch.</p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
              <div className="bg-[#0e1118] border border-[#1b202e] py-8 px-4 shadow sm:rounded-xl sm:px-10">
                
                {authSuccess && (
                  <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{authSuccess}</span>
                  </div>
                )}

                <form className="space-y-4" onSubmit={async (e) => {
                  e.preventDefault();
                  if (!email) return;
                  setSubmitting(true);
                  const res = await apiRequest('/api/auth/forgot-password', {
                    method: 'POST',
                    body: JSON.stringify({ email })
                  });
                  if (res.success) {
                    setAuthSuccess(res.message);
                    setEmail('');
                  }
                  setSubmitting(false);
                }}>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Registered Email</label>
                    <div className="relative">
                      <input 
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="e.g. client@example.com"
                        className="w-full bg-[#080a0e] border border-[#232a39] rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                        required
                      />
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs tracking-wider rounded-lg transition uppercase flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Dispatch Reset Token <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        );

      case '/terms':
        return <TermsPage onBack={() => setRoute('/')} />;

      case '/privacy':
        return <PrivacyPage onBack={() => setRoute('/')} />;

      case '/cookie-policy':
        return <CookiePolicyPage onBack={() => setRoute('/')} />;

      case '/risk-disclosure':
        return <RiskDisclosurePage onBack={() => setRoute('/')} />;

      case '/verify-email':
      case '/auth/callback':
        return <VerifyEmailView onNavigate={setRoute} />;

      case '/auth/google/callback':
        return <GoogleCallback onNavigate={setRoute} />;

      case '/onboarding/terms':
        return (
          <OnboardingTerms 
            onComplete={() => setRoute('/dashboard')} 
            onLogout={() => { logout(); setRoute('/'); }} 
          />
        );

      case '/dashboard':
        return (
          <Navigation currentTab={dashboardTab} onTabChange={setDashboardTab} onNavigate={setRoute}>
            {dashboardTab === 'dashboard' && <DashboardHome onTabChange={setDashboardTab} />}
            {dashboardTab === 'mt5' && <Mt5Form onTabChange={setDashboardTab} />}
            {dashboardTab === 'bot-status' && <Timeline />}
            {dashboardTab === 'trades' && <TradeHistory />}
            {dashboardTab === 'subscription' && <SubscriptionCard />}
            {dashboardTab === 'settings' && <SettingsPage />}
          </Navigation>
        );

      default:
        return (
          <div className="bg-[#07090d] min-h-screen flex items-center justify-center p-4">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold text-white tracking-tight">404</h1>
              <p className="mt-2 text-sm text-gray-400">The requested coordinate does not exist.</p>
              <button 
                onClick={() => setRoute('/')}
                className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase transition"
              >
                Go Home
              </button>
            </div>
          </div>
        );
    }
  };

  if (state.loading) {
    return <Preloader message="Authenticating User Session..." subtext="Connecting to VIN-CORP AI Trading nodes" />;
  }

  return (
    <>
      <AnimatePresence>
        {isRouteLoading && (
          <Preloader 
            variant="overlay" 
            message="Synchronizing View..." 
            subtext="Loading automated trading interface" 
          />
        )}
      </AnimatePresence>
      {renderView()}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
