/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';

interface GoogleCallbackProps {
  onNavigate?: (route: string) => void;
}

export const GoogleCallback: React.FC<GoogleCallbackProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(
          window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash
        );

        const error = searchParams.get('error') || hashParams.get('error');
        if (error) {
          setStatus('error');
          setErrorMsg(decodeURIComponent(error));
          return;
        }

        let token = searchParams.get('token') || hashParams.get('token');
        let refreshToken = searchParams.get('refreshToken') || hashParams.get('refreshToken') || '';
        let code = searchParams.get('code') || hashParams.get('code');
        let userRaw = searchParams.get('user') || hashParams.get('user');

        let user: any = null;
        if (userRaw) {
          try {
            user = JSON.parse(decodeURIComponent(userRaw));
          } catch (e) {
            // String parse fallback
          }
        }

        // If authorization code is present without direct token, exchange code with backend
        if (!token && code) {
          const baseUrl = import.meta.env.VITE_API_URL || '';
          const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
          
          try {
            const res = await fetch(`${cleanBase}/api/auth/google/callback?code=${encodeURIComponent(code)}`, {
              headers: { 'Accept': 'application/json' }
            });

            if (res.ok) {
              const contentType = res.headers.get('content-type');
              if (contentType && contentType.includes('application/json')) {
                const data = await res.json();
                if (data.token) {
                  token = data.token;
                  refreshToken = data.refreshToken || '';
                  user = data.user || null;
                } else if (data.error) {
                  setStatus('error');
                  setErrorMsg(data.error);
                  return;
                }
              }
            } else if (res.redirected && res.url) {
              const redirectedUrl = new URL(res.url);
              token = redirectedUrl.searchParams.get('token');
              refreshToken = redirectedUrl.searchParams.get('refreshToken') || '';
              const redirectedErr = redirectedUrl.searchParams.get('error');
              if (redirectedErr) {
                setStatus('error');
                setErrorMsg(decodeURIComponent(redirectedErr));
                return;
              }
            }
          } catch (fetchErr) {
            console.error('Fetch code exchange error:', fetchErr);
            // Fallback: direct window redirect to backend callback handler
            window.location.href = `${cleanBase}/api/auth/google/callback?code=${encodeURIComponent(code)}`;
            return;
          }
        }

        // Check fallback in localStorage if token not found in URL or code exchange
        if (!token) {
          token = localStorage.getItem('token') || localStorage.getItem('vinebot_token');
        }

        if (token) {
          localStorage.setItem('token', token);
          localStorage.setItem('vinebot_token', token);
          if (refreshToken) {
            localStorage.setItem('vinebot_refresh', refreshToken);
          }

          // Fetch user profile if missing or to verify hasAcceptedTerms
          if (!user || typeof user.hasAcceptedTerms === 'undefined') {
            const baseUrl = import.meta.env.VITE_API_URL || '';
            const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
            try {
              const meRes = await fetch(`${cleanBase}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (meRes.ok) {
                const meJson = await meRes.json();
                if (meJson.success && meJson.data) {
                  user = meJson.data;
                }
              }
            } catch (err) {
              console.error('Failed to fetch user profile in callback:', err);
            }
          }

          if (user) {
            localStorage.setItem('vinebot_user', JSON.stringify(user));
            login(token, refreshToken, user);
          } else {
            login(token, refreshToken, { email: 'user@vinebot.io', role: 'USER' });
          }

          // Check if window was opened as a popup
          let postMessageSent = false;
          if (window.opener && !window.opener.closed) {
            try {
              window.opener.postMessage({
                type: 'GOOGLE_AUTH_SUCCESS',
                token,
                refreshToken,
                user
              }, '*');
              postMessageSent = true;
              setStatus('success');
              setTimeout(() => {
                try { window.close(); } catch (e) {}
              }, 300);
              return;
            } catch (postErr) {
              console.warn('postMessage to window.opener failed:', postErr);
            }
          }

          if (!postMessageSent) {
            setStatus('success');

            // MANDATORY ROUTING GATEWAY (ONBOARDING vs DASHBOARD)
            const targetRoute = user?.hasAcceptedTerms === false ? '/onboarding/terms' : '/dashboard';
            if (onNavigate) {
              onNavigate(targetRoute);
            } else {
              window.location.href = targetRoute;
            }
          }
        } else {
          setStatus('error');
          setErrorMsg('No authentication token received from Google OAuth.');
        }
      } catch (err: any) {
        console.error('Google callback processing error:', err);
        setStatus('error');
        setErrorMsg(err.message || 'Failed to process Google authentication callback.');
      }
    };

    handleCallback();
  }, [login, onNavigate]);

  return (
    <div className="min-h-screen bg-[#07090d] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-card p-8 text-center border border-white/10 rounded-2xl shadow-2xl bg-[#0d1017]">
        {status === 'processing' && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <h2 className="text-lg font-bold">Authenticating with Google</h2>
            <p className="text-xs text-gray-400">Establishing session security and processing login gateway...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold">Authentication Successful</h2>
            <p className="text-xs text-gray-400">Redirecting to your portal...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-red-400">Authentication Failed</h2>
            <p className="text-xs text-gray-300 max-w-sm mx-auto break-words leading-relaxed">{errorMsg || 'Could not process OAuth credentials.'}</p>
            
            {(errorMsg?.includes('Client Secret') || errorMsg?.includes('GOOGLE_CLIENT') || errorMsg?.includes('invalid_client')) && (
              <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-left text-xs text-amber-200/90 space-y-1">
                <p className="font-semibold text-amber-300">💡 OAuth Configuration Help:</p>
                <p>1. Open Google Cloud Console &gt; APIs &amp; Services &gt; Credentials.</p>
                <p>2. Verify your OAuth 2.0 Client Secret matches <code className="bg-amber-950/50 px-1 rounded text-amber-100">GOOGLE_CLIENT_SECRET</code>.</p>
                <p>3. Update environment variables in Settings or Railway deployment config.</p>
              </div>
            )}

            <button
              onClick={() => {
                if (onNavigate) onNavigate('/');
                else window.location.href = '/';
              }}
              className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white rounded-lg transition shadow-lg shadow-blue-500/20"
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
