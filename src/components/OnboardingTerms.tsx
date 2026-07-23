import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { ShieldCheck, Mail, LogOut, CheckCircle2, AlertTriangle, ShieldAlert, ArrowRight, RefreshCw, Scale } from 'lucide-react';

interface OnboardingTermsProps {
  onComplete: () => void;
  onLogout: () => void;
}

export const OnboardingTerms: React.FC<OnboardingTermsProps> = ({ onComplete, onLogout }) => {
  const { state, apiRequest, updateUser } = useAuth();
  const user = state.user;

  // Onboarding Steps
  // If email is not verified, we show step 'email'. Otherwise we show 'terms'.
  const currentStep = (!user?.isEmailVerified && !user?.verified) ? 'email' : 'terms';

  // Email step states
  const [resending, setResending] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error' | 'warning' | null; message: string | null }>({ type: null, message: null });
  const [checking, setChecking] = useState(false);

  // Terms step states
  const [checkedRisk, setCheckedRisk] = useState(false);
  const [checkedTerms, setCheckedTerms] = useState(false);
  const [savingTerms, setSavingTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  const handleResendEmail = async () => {
    if (!user?.email) return;
    setResending(true);
    setEmailStatus({ type: null, message: null });

    try {
      const res = await apiRequest('/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: user.email })
      });

      if (res.success) {
        setEmailStatus({ 
          type: 'success', 
          message: 'Verification email sent! Please check your inbox (and check your Spam / Junk folder if you do not see it within 1-2 minutes).' 
        });
      } else {
        setEmailStatus({ 
          type: 'warning', 
          message: res.message || 'SMTP dispatch failed. Please verify that SMTP_PASS or RESEND_API_KEY is configured in your environment.' 
        });
      }
    } catch (err: any) {
      setEmailStatus({ 
        type: 'warning', 
        message: err.message || 'Verification delivery failed. Secure SMTP credentials may be missing.' 
      });
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerificationStatus = async () => {
    setChecking(true);
    setEmailStatus({ type: null, message: null });
    try {
      // Get latest profile
      const res = await apiRequest('/api/auth/me', { method: 'GET' });
      if (res.success && res.data) {
        updateUser(res.data);
        if (res.data.isEmailVerified || res.data.verified) {
          setEmailStatus({ type: 'success', message: 'Email verified successfully! Preparing terms compliance...' });
        } else {
          setEmailStatus({ type: 'error', message: 'Email verification is still pending. Please check your spam folder or trigger a resend.' });
        }
      } else {
        setEmailStatus({ type: 'error', message: 'Could not refresh session status.' });
      }
    } catch (err: any) {
      setEmailStatus({ type: 'error', message: err.message || 'Failed to check verification status.' });
    } finally {
      setChecking(false);
    }
  };

  const handleSimulateVerification = async () => {
    setChecking(true);
    setEmailStatus({ type: null, message: null });
    try {
      const res = await apiRequest('/api/auth/verify-email', { method: 'POST' });
      if (res.success) {
        // Retrieve fresh user profile
        const meRes = await apiRequest('/api/auth/me', { method: 'GET' });
        if (meRes.success && meRes.data) {
          updateUser(meRes.data);
          setEmailStatus({ type: 'success', message: 'Verification simulated successfully! Proceed to terms acceptance.' });
        }
      } else {
        setEmailStatus({ type: 'error', message: res.message || 'Simulation failed.' });
      }
    } catch (err: any) {
      setEmailStatus({ type: 'error', message: err.message || 'Simulation failed.' });
    } finally {
      setChecking(false);
    }
  };

  const handleAcceptTerms = async () => {
    if (!checkedRisk || !checkedTerms) return;
    setSavingTerms(true);
    setTermsError(null);

    try {
      const res = await apiRequest('/api/user/accept-terms', {
        method: 'POST'
      });

      if (res.success && res.data?.user) {
        updateUser(res.data.user);
        onComplete();
      } else {
        setTermsError(res.message || 'Could not save compliance terms. Please try again.');
      }
    } catch (err: any) {
      setTermsError(err.message || 'An error occurred while transmitting legal acceptance.');
    } finally {
      setSavingTerms(false);
    }
  };

  return (
    <div className="bg-[#07090d] min-h-screen text-gray-200 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative">
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center relative z-10">
        <div className="w-14 h-14 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-400">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white uppercase">User Onboarding Compliance</h2>
        <p className="mt-1.5 text-xs text-gray-400 max-w-md mx-auto">
          Please complete our onboarding steps to configure your automated trading bot VPS environment.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
        <div className="bg-[#0e1118] border border-[#1b202e] py-8 px-5 sm:px-10 shadow-2xl sm:rounded-2xl">
          
          {/* STEP TABS HEADER */}
          <div className="flex items-center justify-center gap-2 mb-8 border-b border-[#1b202e] pb-6">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
              currentStep === 'email' 
                ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400 opacity-60'
            }`}>
              <Mail className="w-3.5 h-3.5" /> Step 1: Verify Email
            </div>
            <div className="w-8 h-px bg-[#1b202e]" />
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
              currentStep === 'terms' 
                ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                : 'bg-white/5 border-white/5 text-gray-500'
            }`}>
              <Scale className="w-3.5 h-3.5" /> Step 2: Accept Terms
            </div>
          </div>

          {/* ==================================== */}
          {/* STEP 1: EMAIL VERIFICATION */}
          {/* ==================================== */}
          {currentStep === 'email' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-sm font-semibold text-white">We sent a secure validation token link to:</p>
                <div className="inline-block bg-[#080a0e] border border-white/5 px-4 py-2 rounded-xl text-xs font-mono text-indigo-300 font-semibold select-all">
                  {user?.email}
                </div>
                <p className="text-xs text-gray-400 max-w-md mx-auto mt-2 leading-relaxed">
                  Open your email inbox and click the verification link. <span className="text-amber-400 font-semibold">(Please check your Spam / Junk folder if you do not see it within 1-2 minutes).</span>
                </p>
              </div>

              {/* Email Status Banner fallbacks */}
              {emailStatus.message && (
                <div className={`p-4 rounded-xl text-xs flex items-start gap-2.5 border ${
                  emailStatus.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : emailStatus.type === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                  {emailStatus.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-bold text-white uppercase tracking-wider text-[10px]">
                      {emailStatus.type === 'success' ? 'Verification Alert' : 'Delivery/Verification Warning'}
                    </p>
                    <p className="opacity-90 leading-relaxed text-[10px]">{emailStatus.message}</p>
                    {emailStatus.type === 'warning' && (
                      <div className="mt-2 p-2 bg-[#080a0e] border border-white/5 rounded text-[9px] font-mono text-gray-400 leading-normal">
                        <span className="font-bold text-amber-400">Local Sandbox Mode:</span> Since third-party SMTP server parameters are not fully populated in the project settings, real-world emails might be blocked. You can securely simulate immediate verification by clicking the manual simulation button below.
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <button
                  onClick={handleResendEmail}
                  disabled={resending}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs tracking-wider rounded-lg transition uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-600/10"
                >
                  {resending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  {resending ? 'Dispatched Request...' : 'Resend Verification Email'}
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleCheckVerificationStatus}
                    disabled={checking}
                    className="py-2.5 bg-[#1b202e] hover:bg-[#252c41] disabled:opacity-50 text-white font-semibold text-xs tracking-wider rounded-lg transition uppercase cursor-pointer"
                  >
                    Check Status
                  </button>

                  <button
                    onClick={handleSimulateVerification}
                    disabled={checking}
                    className="py-2.5 bg-[#10b981]/10 hover:bg-[#10b981]/20 border border-[#10b981]/30 disabled:opacity-50 text-[#10b981] font-semibold text-xs tracking-wider rounded-lg transition uppercase cursor-pointer font-mono"
                  >
                    Simulate Verification
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================================== */}
          {/* STEP 2: TERMS & POLICIES ACCEPTANCE */}
          {/* ==================================== */}
          {currentStep === 'terms' && (
            <div className="space-y-6">
              <div className="bg-[#ef4444]/5 border border-[#ef4444]/20 text-[#ef4444] p-4 rounded-xl text-xs flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-[#ef4444]" />
                <div>
                  <p className="font-bold text-white uppercase tracking-wider text-[10px]">MANDATORY COMPLIANCE DISCLOSURE</p>
                  <p className="text-gray-300 text-[10px] mt-0.5">
                    Vinebot executes automated orders on your connected MT5 account. You must read and agree to the extreme risk disclaimers prior to accessing the VPS deployment terminal.
                  </p>
                </div>
              </div>

              {/* Scrollable Terms & Conditions box */}
              <div className="bg-[#080a0e] border border-[#1b202e] rounded-xl p-4 h-56 overflow-y-auto text-xs space-y-4 text-gray-400 select-none scrollbar-thin">
                <div className="border-b border-[#1b202e] pb-2 mb-2">
                  <h3 className="font-bold text-white text-xs tracking-wide uppercase font-mono">TERMS AND CONDITIONS OF USE: VINEBOT</h3>
                  <p className="text-[10px] text-indigo-400 mt-0.5">Effective Date: July 20, 2026</p>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-white text-[11px] uppercase">1. NO FINANCIAL OR INVESTMENT ADVICE: Informational Tool Only</p>
                  <p className="leading-relaxed">
                    Vinebot is a software development and algorithmic technology provider. Vinebot is not a registered broker-dealer, financial advisor, investment analyst, or tax planner. All software, tools, signals, parameters, and documentation provided are strictly for informational and educational purposes. Vinebot does not solicit, recommend, or provide investment advice. Any automated trading settings, indicators, or strategies you configure are executed solely at your own discretion and risk.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-white text-[11px] uppercase">2. ACKNOWLEDGMENT OF HIGH-RISK TRADING</p>
                  <p className="leading-relaxed">
                    Trading financial instruments, including but not limited to foreign exchange (Forex), contracts for difference (CFDs), commodities, indices, and cryptocurrencies, involves extreme risk of capital loss. High-frequency or automated trading executes positions rapidly, which can exacerbate losses under volatile market conditions. You acknowledge that you may lose all of your deposited capital and potentially incur liabilities exceeding your account balance. Past performance is no guarantee of future results.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-white text-[11px] uppercase">3. ASSUMPTION OF OPERATIONAL AND TECHNICAL RISK</p>
                  <p className="leading-relaxed">
                    By utilizing Vinebot's cloud hosting, VPS, or MetaTrader 5 (MT5) execution bridging technology, you assume all operational and technical risks. This includes, but is not limited to, API connection latency, internet connection failures, VPS downtime, third-party software bugs, server crashes, execution slippage, broker-side rejection of orders, and algorithmic errors. Vinebot is not responsible for trade execution failures resulting from technical anomalies.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-white text-[11px] uppercase">4. LIMITATION OF LIABILITY</p>
                  <p className="leading-relaxed">
                    To the maximum extent permitted by applicable law, in no event shall Vinebot, its affiliates, directors, employees, or technology providers be liable for any direct, indirect, incidental, special, exemplary, punitive, or consequential damages (including, but not limited to, loss of trading capital, trading losses, loss of profits, data corruption, or system outages) arising out of or in connection with the use, performance, or inability to use the Vinebot platform, regardless of the legal theory.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-white text-[11px] uppercase">5. INDEMNIFICATION</p>
                  <p className="leading-relaxed">
                    You agree to defend, indemnify, and hold harmless Vinebot and its officers, directors, employees, and agents from and against any and all claims, liabilities, damages, losses, expenses, or legal fees (including reasonable attorneys' fees) arising out of your violation of these Terms, your use of the automated trading bot, or your MT5 account operations.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-white text-[11px] uppercase">6. "AS IS" AND "AS AVAILABLE" WARRANTY</p>
                  <p className="leading-relaxed">
                    The Vinebot platform, including all algorithms, VPS hosting configurations, templates, and execution scripts, is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, either express or implied. Vinebot disclaims all warranties, including but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement, or uninterrupted, bug-free operation.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-white text-[11px] uppercase">7. GOVERNING LAW AND DISPUTE RESOLUTION</p>
                  <p className="leading-relaxed">
                    These Terms of Use shall be governed by and construed in accordance with the laws of the jurisdiction of incorporation, without regard to conflicts of law principles. Any dispute, controversy, or claim arising out of or relating to these terms, including their formation or breach, shall be settled by binding arbitration in accordance with the rules of the local arbitration association, and you waive any right to participate in class actions or jury trials.
                  </p>
                </div>
              </div>

              {termsError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{termsError}</span>
                </div>
              )}

              {/* CHECKBOXES */}
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checkedRisk}
                    onChange={e => setCheckedRisk(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-indigo-600 bg-[#080a0e] border-[#232a39] focus:ring-0 focus:ring-offset-0 focus:outline-none cursor-pointer"
                  />
                  <span className="text-[11px] text-gray-300 leading-normal">
                    <span className="font-bold text-[#ef4444] uppercase tracking-wide mr-1">[Mandatory]</span> 
                    I acknowledge that automated trading carries extreme financial risk and Vinebot provides no investment advice.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checkedTerms}
                    onChange={e => setCheckedTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-indigo-600 bg-[#080a0e] border-[#232a39] focus:ring-0 focus:ring-offset-0 focus:outline-none cursor-pointer"
                  />
                  <span className="text-[11px] text-gray-300 leading-normal">
                    <span className="font-bold text-[#ef4444] uppercase tracking-wide mr-1">[Mandatory]</span> 
                    I have read and agree to the Terms and Conditions, Privacy Policy, and Cookie Policy.
                  </span>
                </label>
              </div>

              {/* ACTION BUTTON */}
              <button
                onClick={handleAcceptTerms}
                disabled={!checkedRisk || !checkedTerms || savingTerms}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#1b202e] disabled:text-gray-500 disabled:opacity-60 text-white font-semibold text-xs tracking-wider rounded-lg transition uppercase flex items-center justify-center gap-1 cursor-pointer shadow-lg"
              >
                {savingTerms ? 'Storing Acceptance Record...' : 'Accept & Continue to Dashboard'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* FOOTER OPTION TO LOGOUT */}
          <div className="mt-8 border-t border-[#1b202e] pt-6 flex justify-between items-center text-xs">
            <span className="text-gray-500 font-mono tracking-wide">Secure Token Gateway</span>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout Account
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
