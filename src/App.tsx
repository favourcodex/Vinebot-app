/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
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
import { Logo } from './components/common/Logo';
import { 
  Bot, Lock, Mail, ChevronRight, User, KeyRound, 
  ArrowLeft, CheckCircle2, AlertTriangle, Sparkles, ShieldAlert
} from 'lucide-react';

function AppContent() {
  const { state, login, apiRequest, logout } = useAuth();
  
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
        const baseUrl = import.meta.env.VITE_API_URL || '';
        const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        const res = await fetch(`${cleanBase}/api/auth/google/config`);
        if (res.ok) {
          const data = await res.json();
          setGoogleConfigured(!!data.configured);
        }
      } catch (err) {
        console.error('Failed to load Google Auth configuration status:', err);
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
              const baseUrl = import.meta.env.VITE_API_URL || '';
              const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
              const res = await fetch(`${cleanBase}/api/auth/me`, {
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

  // Listen for Stripe Redirection Success Parameters (Dual Webhook/Redirect flow)
  useEffect(() => {
    if (state.isAuthenticated && route === '/dashboard') {
      const params = new URLSearchParams(window.location.search);
      const paymentStatus = params.get('payment');
      const planId = params.get('plan_id');
      const sessionId = params.get('session_id');

      if (paymentStatus === 'success' && planId) {
        // Clear query parameters from browser URL bar without reloading
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Execute instant secure activation handshake with Stripe confirmation API
        apiRequest('/api/payments/confirm', {
          method: 'POST',
          body: JSON.stringify({ planId, stripeSessionId: sessionId })
        }).then(res => {
          if (res.success) {
            setDashboardTab('subscription'); // Open billing tab to let them view plan
          }
        }).catch(err => {
          console.error('Failed to confirm Stripe subscription:', err);
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
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      const res = await fetch(`${cleanBase}/api/auth/google/url?redirectUri=${encodeURIComponent(redirectUri)}&action=${action}`);
      
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
          <div className="bg-[#07090d] min-h-screen text-gray-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative">
            <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
            
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
              <button 
                onClick={() => { setRoute('/'); setSentMagicLinkEmail(null); setAuthError(null); }}
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-6 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Return home
              </button>
              <div className="flex justify-center mb-3">
                <Logo size="lg" />
              </div>
              <h2 className="mt-4 text-2xl font-black tracking-tight text-white uppercase">Passwordless Magic Link</h2>
              <p className="mt-1 text-xs text-gray-400 max-w-xs mx-auto">Sign in or create your Vinebot account with a single magic link. No passwords required.</p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
              {sentMagicLinkEmail ? (
                <div className="bg-[#0e1118] border border-[#1b202e] py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10 text-center space-y-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/20 via-blue-500/10 to-indigo-500/5 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/10">
                    <Mail className="w-8 h-8 text-indigo-400 animate-pulse" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wide">Check Your Inbox</h3>
                    <p className="mt-2 text-xs text-gray-300 leading-relaxed max-w-sm mx-auto">
                      We sent a magic link to <span className="text-indigo-300 font-semibold font-mono bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">{sentMagicLinkEmail}</span>
                    </p>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-xl text-left space-y-1">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Spam / Junk Folder Notice</span>
                    </div>
                    <p className="text-[11px] text-amber-200/90 leading-relaxed">
                      Be sure to check your <strong>Spam or Junk folder</strong> if you do not see the email in your inbox within 1-2 minutes.
                    </p>
                  </div>

                  <div className="pt-2 space-y-3">
                    <button
                      onClick={handleMagicLinkSubmit}
                      disabled={submitting}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-wider rounded-lg transition uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                    >
                      {submitting ? (
                        <Sparkles className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Resend Magic Link <Sparkles className="w-4 h-4 text-amber-300" />
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setSentMagicLinkEmail(null)}
                      className="text-xs text-gray-400 hover:text-white transition font-medium cursor-pointer block mx-auto"
                    >
                      Use a different email address
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0e1118] border border-[#1b202e] py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10">
                  {authError && (
                    <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <form className="space-y-5" onSubmit={handleMagicLinkSubmit}>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <input 
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="e.g. trader@example.com"
                          className="w-full bg-[#080a0e] border border-[#232a39] rounded-lg pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                          required
                        />
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      </div>
                      <p className="mt-2 text-[11px] text-gray-500 leading-relaxed">
                        We will email you a secure 15-minute magic link to sign in or create your account automatically.
                      </p>
                    </div>

                    <button 
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs tracking-wider rounded-lg transition uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                    >
                      {submitting ? (
                        <Sparkles className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Send Magic Link <Sparkles className="w-4 h-4 text-amber-300" />
                        </>
                      )}
                    </button>
                  </form>

                  {googleConfigured && (
                    <>
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                          <div className="w-full border-t border-[#1b202e]"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-[#0e1118] px-3 text-gray-500 text-[10px] tracking-wider font-semibold">Or Instant Access</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleGoogleAuth('login')}
                        disabled={submitting}
                        className="w-full py-3 px-4 bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/[0.12] border border-[#232a39] text-white font-semibold text-xs tracking-wider rounded-lg transition uppercase flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                      </button>
                    </>
                  )}

                  {/* Operations Desk Link */}
                  <div className="mt-6 pt-4 border-t border-[#1b202e]/50 text-center">
                    <button 
                      onClick={() => { setRoute('/admin-login'); setAuthError(null); }}
                      className="text-[10px] text-rose-400/60 hover:text-rose-400 font-semibold tracking-wider uppercase cursor-pointer"
                    >
                      Operations Console Access
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
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

  return <>{renderView()}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
