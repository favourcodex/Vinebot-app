/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ArrowLeft, Mail, Sparkles, AlertTriangle, 
  ShieldAlert, Zap, Activity, ShieldCheck
} from 'lucide-react';
import { Logo } from './common/Logo';

interface LoginPageProps {
  email: string;
  setEmail: (val: string) => void;
  submitting: boolean;
  authError: string | null;
  setAuthError: (val: string | null) => void;
  sentMagicLinkEmail: string | null;
  setSentMagicLinkEmail: (val: string | null) => void;
  handleMagicLinkSubmit: (e: React.FormEvent) => void;
  handleGoogleAuth: (action: string) => void;
  googleConfigured: boolean;
  onNavigate: (route: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  email,
  setEmail,
  submitting,
  authError,
  setAuthError,
  sentMagicLinkEmail,
  setSentMagicLinkEmail,
  handleMagicLinkSubmit,
  handleGoogleAuth,
  googleConfigured,
  onNavigate
}) => {
  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen overflow-y-auto lg:overflow-hidden bg-[#06080e] text-white flex flex-col lg:flex-row font-sans relative selection:bg-blue-500/30">
      
      {/* ================= LEFT SIDE: VISUALS & BRANDING (60% width on LG) ================= */}
      <div className="w-full lg:w-[60%] relative flex flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10 bg-[#080b13] min-h-[320px] lg:h-full">
        
        {/* Background Radial Blobs */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-[#080b13] to-[#06080e] pointer-events-none" />
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        {/* Top Header Badge & Return Home */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            VIN-CORP AI TRADING SYSTEMS
          </div>
          <button 
            onClick={() => onNavigate('/')}
            className="lg:hidden inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition cursor-pointer bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return Home
          </button>
        </div>

        {/* Center Hero Content */}
        <div className="relative z-10 my-auto py-6 max-w-xl">
          <div className="mb-3 inline-flex items-center gap-2 text-indigo-400 font-mono text-[11px] font-bold uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-md">
            <Zap className="w-3.5 h-3.5 text-indigo-400" /> High-Frequency MT5 Execution
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase leading-tight font-sans">
            INSTITUTIONAL <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
              AI TRADING
            </span> AUTOMATION
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-gray-300 leading-relaxed font-sans max-w-lg">
            Connect your MetaTrader 5 trading accounts directly to VIN-CORP’s cloud execution engine for 24/7 automated risk management, smart signals, and instant trade placement.
          </p>

          {/* Interactive Stats Grid */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-xs font-bold mb-0.5">
                <Activity className="w-3.5 h-3.5" /> 99.8%
              </div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Uptime Node</p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-blue-400 font-mono text-xs font-bold mb-0.5">
                <Zap className="w-3.5 h-3.5" /> &lt; 12ms
              </div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Execution Latency</p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-1.5 text-indigo-400 font-mono text-xs font-bold mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5" /> 24 / 7
              </div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Auto Risk Guard</p>
            </div>
          </div>
        </div>

        {/* Bottom Security Footer */}
        <div className="relative z-10 pt-3 border-t border-white/10 hidden sm:flex items-center justify-between text-[11px] text-gray-400">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-400" /> Encrypted Credentials & MT5 API Security
          </span>
          <span className="font-mono text-gray-500">v3.4.0-EA</span>
        </div>
      </div>

      {/* ================= RIGHT SIDE: SIGN-IN FORM (40% width on LG) ================= */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center px-6 sm:px-10 lg:px-12 py-8 bg-[#070a12] relative z-10 lg:h-full">
        
        {/* Navigation Return Home */}
        <div className="hidden lg:flex items-center justify-between mb-6">
          <button 
            onClick={() => { onNavigate('/'); setSentMagicLinkEmail(null); setAuthError(null); }}
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Homepage
          </button>
          <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400/80 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
            SECURE PORTAL
          </span>
        </div>

        {/* Brand Header */}
        <div className="text-center sm:text-left mb-6">
          <div className="flex justify-center sm:justify-start mb-3">
            <Logo size="lg" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase font-sans">
            Account Access
          </h2>
          <p className="mt-1 text-xs text-gray-400 max-w-sm">
            Sign in to manage your automated MetaTrader 5 trading bots and active subscription license.
          </p>
        </div>

        {/* Form Container */}
        {sentMagicLinkEmail ? (
          /* Magic Link Sent Confirmation View */
          <div className="bg-[#0b0e19] border border-[#1e2638] py-6 px-6 shadow-2xl rounded-2xl text-center space-y-5">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-blue-500/5 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/10">
              <Mail className="w-7 h-7 text-blue-400 animate-pulse" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wide">Check Your Inbox</h3>
              <p className="mt-1.5 text-xs text-gray-300 leading-relaxed max-w-sm mx-auto">
                We sent a magic link to <span className="text-blue-300 font-semibold font-mono bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/40">{sentMagicLinkEmail}</span>
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl text-left space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Spam / Junk Folder Notice</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                Be sure to check your <strong>Spam or Junk folder</strong> if you do not see the email in your inbox within 1-2 minutes.
              </p>
            </div>

            <div className="pt-1 space-y-2.5">
              <button
                onClick={handleMagicLinkSubmit}
                disabled={submitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider rounded-xl transition uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20 disabled:opacity-50"
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
          /* Sign-In Input Form - Magic Link & Google SSO ONLY */
          <div className="bg-[#0b0e19] border border-[#1e2638] p-5 sm:p-6 shadow-2xl rounded-2xl">
            {authError && (
              <div className="mb-4 bg-red-500/10 border border-red-500/25 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{authError}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleMagicLinkSubmit}>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input 
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. trader@vincorp.com"
                    className="w-full bg-[#06080f] border border-[#232d42] rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                    required
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
                <p className="mt-1.5 text-[11px] text-gray-400 leading-relaxed">
                  We will send a secure 15-minute magic login link to your inbox. No passwords required.
                </p>
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider rounded-xl transition uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/25 disabled:opacity-50"
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

            {/* Google OAuth Section */}
            {googleConfigured && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-[#1e2638]"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#0b0e19] px-2.5 text-gray-400 text-[10px] tracking-widest font-bold">Or Instant Single Sign-On</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleGoogleAuth('login')}
                  disabled={submitting}
                  className="w-full py-3 px-4 bg-white/[0.04] hover:bg-white/[0.08] active:bg-white/[0.12] border border-[#232d42] text-white font-semibold text-xs tracking-wider rounded-xl transition uppercase flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  Sign in with Google
                </button>
              </>
            )}

            {/* Operations Desk Link */}
            <div className="mt-5 pt-3 border-t border-[#1e2638]/60 text-center">
              <button 
                onClick={() => { onNavigate('/admin'); setAuthError(null); }}
                className="text-[10px] text-rose-400/80 hover:text-rose-400 font-semibold tracking-wider uppercase cursor-pointer transition"
              >
                Operations Desk Console Access
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
