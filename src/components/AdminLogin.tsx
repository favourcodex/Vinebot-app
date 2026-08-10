import React, { useState } from 'react';
import { ArrowLeft, ShieldAlert, Mail, AlertTriangle, CheckCircle2, Send, Loader2 } from 'lucide-react';
import { useAuth } from './AuthContext';

interface AdminLoginProps {
  onNavigate?: (route: string) => void;
}

const ALLOWED_ADMIN_EMAIL = 'vinindustry0@gmail.com';

export const AdminLogin: React.FC<AdminLoginProps> = ({ onNavigate }) => {
  const { apiRequest } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    const inputEmail = email.trim().toLowerCase();

    // 1. Strict email check
    if (inputEmail !== ALLOWED_ADMIN_EMAIL) {
      setAuthError("Unauthorized Admin Email Address.");
      return;
    }

    setSubmitting(true);

    try {
      // 2. Dispatch Magic Link via custom API endpoint
      const res = await apiRequest('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ALLOWED_ADMIN_EMAIL })
      });

      if (res && res.success) {
        setAuthSuccess("Magic link sent! Check vinindustry0@gmail.com to authorize console access.");
      } else {
        setAuthError(res?.message || "Failed to dispatch magic link authorization.");
      }
    } catch (err: any) {
      setAuthError(err.message || "An unexpected authentication error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#050505] min-h-screen text-gray-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <button 
          onClick={() => onNavigate ? onNavigate('/') : (window.location.href = '/')}
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
            <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-xs flex items-center gap-2 font-mono">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{authSuccess}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[10px] font-semibold text-rose-400/60 uppercase tracking-wider mb-1.5 font-mono">
                Admin Email Address
              </label>
              <div className="relative">
                <input 
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="vinindustry0@gmail.com"
                  className="w-full bg-[#080a0e] border border-rose-950/40 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 font-mono placeholder:text-gray-600"
                  required
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500/40" />
              </div>
            </div>

            <button 
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 disabled:opacity-50 text-white font-semibold text-xs tracking-wider rounded-lg transition uppercase flex items-center justify-center gap-2 cursor-pointer font-mono"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Dispatching...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Send Admin Magic Link
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
