import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { Bot, CheckCircle2, XCircle, Loader2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Logo } from './common/Logo';

interface VerifyEmailViewProps {
  onNavigate: (route: string) => void;
}

export const VerifyEmailView: React.FC<VerifyEmailViewProps> = ({ onNavigate }) => {
  const { login, apiRequest } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your magic link with Vinebot security engine...');

  useEffect(() => {
    const processMagicLink = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (!token) {
        setStatus('error');
        setMessage('Magic link is missing secure token parameters.');
        return;
      }

      try {
        // Try verify-magic-link first
        let res = await apiRequest('/api/auth/verify-magic-link', {
          method: 'POST',
          body: JSON.stringify({ token })
        });

        if (!res.success) {
          // Fallback to verify-email endpoint
          res = await apiRequest('/api/auth/verify-email', {
            method: 'POST',
            body: JSON.stringify({ token })
          });
        }

        if (res.success && res.data) {
          setStatus('success');
          setMessage('Email verified & session authorized! Redirecting...');
          
          if (res.data.token && res.data.refreshToken && res.data.user) {
            const user = res.data.user;
            login(res.data.token, res.data.refreshToken, user);

            setTimeout(() => {
              // ROUTING GATEWAY LOGIC
              if (user.hasAcceptedTerms === false) {
                onNavigate('/onboarding/terms');
              } else {
                onNavigate('/dashboard');
              }
            }, 1200);
          }
        } else {
          setStatus('error');
          setMessage(res.message || 'This magic link has expired or is invalid. Please request a new link.');
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'A network error occurred while verifying your login link.');
      }
    };

    processMagicLink();
  }, [login, apiRequest, onNavigate]);

  return (
    <div className="bg-[#07090d] min-h-screen text-gray-200 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative">
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="flex items-center justify-center mb-6">
          <Logo size="lg" />
        </div>
        <p className="mt-1 text-xs text-gray-400">Cryptographic passwordless session authentication.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#0e1118] border border-[#1b202e] py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10 text-center space-y-6">
          
          {status === 'loading' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
              <p className="text-xs text-gray-300 font-mono tracking-wide">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <p className="text-base font-bold text-white uppercase tracking-wide">Authentication Confirmed</p>
              <p className="text-xs text-emerald-300 leading-relaxed px-4">{message}</p>
              <div className="inline-flex items-center gap-1.5 text-[11px] text-indigo-300 bg-indigo-950/60 border border-indigo-800/40 px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Connecting to MetaTrader Node...
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="w-14 h-14 bg-red-500/15 border border-red-500/30 text-red-400 rounded-full flex items-center justify-center shadow-lg shadow-red-500/10">
                <XCircle className="w-8 h-8" />
              </div>
              <p className="text-base font-bold text-white uppercase tracking-wide">Link Expired or Invalid</p>
              <p className="text-xs text-red-400 leading-relaxed px-4">{message}</p>

              <button
                onClick={() => onNavigate('/login')}
                className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase transition inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                Request New Magic Link <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="border-t border-[#1b202e] pt-6 text-[10px] text-gray-500 font-mono flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> VINEBOT TRUST SHIELD &bull; AES-256 ENCRYPTED
          </div>
        </div>
      </div>
    </div>
  );
};
