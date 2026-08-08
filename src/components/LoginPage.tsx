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
    <div className="min-h-screen lg:h-screen lg:max-h-screen overflow-hidden bg-[#050505] text-white flex flex-col lg:flex-row font-sans relative selection:bg-white selection:text-black">
      
      {/* ================= LEFT SIDE: VISUALS & BRANDING (60% width on LG - Hidden on Mobile) ================= */}
      <div className="hidden lg:flex w-full lg:w-[60%] relative flex-col justify-between p-10 lg:p-12 overflow-hidden border-r border-[#262626] bg-[#0a0a0a] lg:h-full">
        
        {/* Subtle Background Monochrome Glow */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-white/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        {/* Top Header Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#121212] border border-[#262626] text-neutral-300 text-xs font-semibold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            VIN-CORP AI TRADING SYSTEMS
          </div>
        </div>

        {/* Center Hero Content */}
        <div className="relative z-10 my-auto py-6 max-w-xl">
          <div className="mb-3 inline-flex items-center gap-2 text-neutral-300 font-mono text-[11px] font-bold uppercase tracking-widest bg-[#121212] border border-[#262626] px-2.5 py-0.5 rounded-md">
            <Zap className="w-3.5 h-3.5 text-white" /> High-Frequency MT5 Execution
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white uppercase leading-tight font-sans">
            INSTITUTIONAL <br />
            <span className="text-white">
              AI TRADING
            </span> AUTOMATION
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-neutral-400 leading-relaxed font-sans max-w-lg">
            Connect your MetaTrader 5 trading accounts directly to VIN-CORP’s cloud execution engine for 24/7 automated risk management, smart signals, and instant trade placement.
          </p>

          {/* Interactive Stats Grid */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#121212] border border-[#262626]">
              <div className="flex items-center gap-1.5 text-white font-mono text-xs font-bold mb-0.5">
                <Activity className="w-3.5 h-3.5" /> 99.8%
              </div>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Uptime Node</p>
            </div>

            <div className="p-3 rounded-xl bg-[#121212] border border-[#262626]">
              <div className="flex items-center gap-1.5 text-white font-mono text-xs font-bold mb-0.5">
                <Zap className="w-3.5 h-3.5" /> &lt; 12ms
              </div>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Execution Latency</p>
            </div>

            <div className="p-3 rounded-xl bg-[#121212] border border-[#262626]">
              <div className="flex items-center gap-1.5 text-white font-mono text-xs font-bold mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5" /> 24 / 7
              </div>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Auto Risk Guard</p>
            </div>
          </div>
        </div>

        {/* Bottom Security Footer */}
        <div className="relative z-10 pt-3 border-t border-[#262626] flex items-center justify-between text-[11px] text-neutral-400">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-white" /> Encrypted Credentials & MT5 API Security
          </span>
          <span className="font-mono text-neutral-500">v3.4.0-EA</span>
        </div>
      </div>

      {/* ================= RIGHT SIDE: SIGN-IN FORM (100% Mobile, 40% Desktop) ================= */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center px-4 sm:px-10 lg:px-12 py-6 bg-[#050505] relative z-10 min-h-screen lg:min-h-0 lg:h-full overflow-y-auto">
        
        <div className="w-full max-w-md mx-auto lg:max-w-none">
          {/* Navigation Return Home */}
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => { onNavigate('/'); setSentMagicLinkEmail(null); setAuthError(null); }}
              className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Homepage
            </button>
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-300 bg-[#121212] border border-[#262626] px-2 py-0.5 rounded">
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
            <p className="mt-1 text-xs text-neutral-400 max-w-sm">
              Sign in to manage your automated MetaTrader 5 trading bots and active subscription license.
            </p>
          </div>

        {/* Form Container */}
        {sentMagicLinkEmail ? (
          /* Magic Link Sent Confirmation View */
          <div className="bg-[#0a0a0a] border border-[#262626] py-6 px-6 shadow-2xl rounded-2xl text-center space-y-5">
            <div className="w-14 h-14 bg-[#121212] border border-[#262626] rounded-2xl flex items-center justify-center mx-auto shadow-lg">
              <Mail className="w-7 h-7 text-white animate-pulse" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white uppercase tracking-wide">Check Your Inbox</h3>
              <p className="mt-1.5 text-xs text-neutral-300 leading-relaxed max-w-sm mx-auto">
                We sent a magic link to <span className="text-white font-semibold font-mono bg-[#121212] px-2 py-0.5 rounded border border-[#262626]">{sentMagicLinkEmail}</span>
              </p>
            </div>

            <div className="bg-[#121212] border border-[#262626] p-3 rounded-xl text-left space-y-1">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 text-white" />
                <span>Spam / Junk Folder Notice</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Be sure to check your <strong>Spam or Junk folder</strong> if you do not see the email in your inbox within 1-2 minutes.
              </p>
            </div>

            <div className="pt-1 space-y-2.5">
              <button
                onClick={handleMagicLinkSubmit}
                disabled={submitting}
                className="w-full py-3 bg-white text-black hover:bg-neutral-200 font-bold text-xs tracking-wider rounded-xl transition uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {submitting ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Resend Magic Link <Sparkles className="w-4 h-4 text-black" />
                  </>
                )}
              </button>

              <button
                onClick={() => setSentMagicLinkEmail(null)}
                className="text-xs text-neutral-400 hover:text-white transition font-medium cursor-pointer block mx-auto"
              >
                Use a different email address
              </button>
            </div>
          </div>
        ) : (
          /* Sign-In Input Form */
          <div className="bg-[#0a0a0a] border border-[#262626] p-5 sm:p-6 shadow-2xl rounded-2xl">
            {authError && (
              <div className="mb-4 bg-neutral-900 border border-neutral-700 text-neutral-200 p-3 rounded-xl text-xs flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-white" />
                <span>{authError}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleMagicLinkSubmit}>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input 
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g. trader@vincorp.com"
                    className="w-full bg-[#121212] border border-[#262626] rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-white transition"
                    required
                  />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                </div>
                <p className="mt-1.5 text-[11px] text-neutral-400 leading-relaxed">
                  We will send a secure 15-minute magic login link to your inbox. No passwords required.
                </p>
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-white text-black hover:bg-neutral-200 font-bold text-xs tracking-wider rounded-xl transition uppercase flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {submitting ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Send Magic Link <Sparkles className="w-4 h-4 text-black" />
                  </>
                )}
              </button>
            </form>

            {/* Google OAuth Section */}
            {googleConfigured && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-[#262626]"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#0a0a0a] px-2.5 text-neutral-400 text-[10px] tracking-widest font-bold">Or Instant Single Sign-On</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleGoogleAuth('login')}
                  disabled={submitting}
                  className="w-full py-3 px-4 bg-[#121212] hover:bg-[#1a1a1a] border border-[#262626] text-white font-semibold text-xs tracking-wider rounded-xl transition uppercase flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#FFFFFF" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#CCCCCC" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#999999" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#FFFFFF" />
                  </svg>
                  Sign in with Google
                </button>
              </>
            )}

            {/* Operations Desk Link */}
            <div className="mt-5 pt-3 border-t border-[#262626] text-center">
              <button 
                onClick={() => { onNavigate('/admin'); setAuthError(null); }}
                className="text-[10px] text-neutral-400 hover:text-white font-semibold tracking-wider uppercase cursor-pointer transition"
              >
                Operations Desk Console Access
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
