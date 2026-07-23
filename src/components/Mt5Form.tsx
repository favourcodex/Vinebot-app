/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  Database, ShieldCheck, Trash2, KeyRound, AlertTriangle, 
  HelpCircle, CheckCircle2, ChevronRight, Lock, Eye, EyeOff
} from 'lucide-react';
import { Mt5Account } from '../types';

interface Mt5FormProps {
  onTabChange?: (tab: string) => void;
}

export const Mt5Form: React.FC<Mt5FormProps> = ({ onTabChange }) => {
  const { apiRequest } = useAuth();
  const [account, setAccount] = useState<Mt5Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasActiveSub, setHasActiveSub] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form fields
  const [form, setForm] = useState({
    accountNumber: '',
    brokerName: '',
    serverName: '',
    password: '',
    label: ''
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchMt5 = async () => {
    setLoading(true);
    // Fetch active subscription state first
    const subRes = await apiRequest<any>('/api/payments/subscription');
    const isActive = subRes.success && subRes.data && subRes.data.status === 'ACTIVE';
    setHasActiveSub(isActive);

    if (isActive) {
      const res = await apiRequest<Mt5Account | null>('/api/mt5');
      if (res.success && res.data) {
        setAccount(res.data);
        // Pre-fill labels
        setForm({
          accountNumber: res.data.accountNumber,
          brokerName: res.data.brokerName,
          serverName: res.data.serverName,
          password: '', // never expose password!
          label: res.data.label || ''
        });
      } else {
        setAccount(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMt5();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.accountNumber || !form.brokerName || !form.serverName || (!account && !form.password)) {
      setMessage({ type: 'error', text: 'Please fill in all connection credentials.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const payload = { ...form };
    // If updating and password field is empty, send existing or ignore
    if (account && !form.password) {
      // For update, let's keep password blank unless changed
      delete (payload as any).password;
    }

    const res = await apiRequest<Mt5Account>('/api/mt5', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res.success) {
      setMessage({ type: 'success', text: res.message });
      fetchMt5();
    } else {
      setMessage({ type: 'error', text: res.message });
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you absolutely sure you want to decouple and delete these MT5 credentials? This will stop any active trading bots.')) {
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const res = await apiRequest('/api/mt5', {
      method: 'DELETE'
    });

    if (res.success) {
      setMessage({ type: 'success', text: 'MT5 connection unlinked. All cryptographic blocks purged.' });
      setAccount(null);
      setForm({ accountNumber: '', brokerName: '', serverName: '', password: '', label: '' });
    } else {
      setMessage({ type: 'error', text: res.message });
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 bg-white/5 rounded animate-pulse" />
        <div className="h-96 bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (hasActiveSub === false) {
    return (
      <div className="max-w-md mx-auto py-16 px-6 text-center animate-fade-in" id="mt5-locked-view">
        <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-blue-400 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Active Subscription Required</h2>
        <p className="text-white/40 text-xs mt-3 leading-relaxed">
          You must have an active trading license to configure and link MetaTrader 5 (MT5) accounts.
          Please activate your subscription in the Billing Center to unlock secure VPS hosting and expert advisor deployment.
        </p>
        <button
          onClick={() => onTabChange?.('subscription')}
          className="mt-8 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold tracking-wide shadow-lg shadow-indigo-600/15 transition-all cursor-pointer inline-flex items-center gap-2"
        >
          Go to Billing Center <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in" id="mt5-form-view">
      
      {/* Header Info */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          <Database className="w-6 h-6 text-blue-400" /> MetaTrader 5 Vault Configuration
        </h1>
        <p className="text-white/40 text-xs mt-1">
          Securely sync your MT5 execution parameters. We operate a zero-cleartext memory standard.
        </p>
      </div>

      {/* Security Disclosure Card */}
      <div className="glass-card p-4 sm:p-5 relative overflow-hidden flex flex-col sm:flex-row items-start gap-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-2xl rounded-full" />
        <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center shrink-0">
          <Lock className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">AES-256-GCM End-to-End Cryptography</h3>
          <p className="text-xs text-white/60 mt-1 leading-relaxed">
            Upon submission, your broker password undergoes instant symmetric encryption. Our server-side Node execution environment reads authorization vectors within isolated sandboxes. Credentials are never written to flat server logs, caches, or client API endpoints.
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400' 
            : 'bg-red-500/10 border border-red-500/25 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Connection Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-2 glass-card p-4 sm:p-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3 mb-6">
            {account ? 'Modify Link Parameters' : 'Establish Connection Link'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wide mb-1.5">MT5 Account Number</label>
                <input 
                  type="text"
                  value={form.accountNumber}
                  onChange={e => setForm({ ...form, accountNumber: e.target.value })}
                  placeholder="e.g. 849201"
                  className="w-full bg-[#050505] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wide mb-1.5">Optional Account Label</label>
                <input 
                  type="text"
                  value={form.label}
                  onChange={e => setForm({ ...form, label: e.target.value })}
                  placeholder="e.g. IC Markets Premium"
                  className="w-full bg-[#050505] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wide mb-1.5">Broker Name</label>
                <input 
                  type="text"
                  value={form.brokerName}
                  onChange={e => setForm({ ...form, brokerName: e.target.value })}
                  placeholder="e.g. IC Markets Ltd"
                  className="w-full bg-[#050505] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wide mb-1.5">Server Node Name</label>
                <input 
                  type="text"
                  value={form.serverName}
                  onChange={e => setForm({ ...form, serverName: e.target.value })}
                  placeholder="e.g. ICMarkets-Live02"
                  className="w-full bg-[#050505] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-white/40 uppercase tracking-wide mb-1.5">
                Broker Password {account && <span className="text-white/30 font-normal lowercase">(leave empty to retain encrypted value)</span>}
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder={account ? '••••••••••••••••••••' : 'Enter MetaTrader 5 master password'}
                  className="w-full bg-[#050505] border border-white/10 rounded-lg pl-4 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required={!account}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button 
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider rounded-lg transition-colors uppercase disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Cryptographic processing...' : (account ? 'Update Secure link' : 'Securely link MT5 Account')}
              </button>
              
              {account && (
                <button 
                  type="button"
                  onClick={handleDelete}
                  disabled={submitting}
                  className="px-5 py-3 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 hover:border-red-500 font-bold text-xs tracking-wider rounded-lg transition-all uppercase flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Purge Credentials
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Side Status Guidelines */}
        <div className="space-y-6">
          <div className="glass-card p-4 sm:p-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-400" /> MT5 Connection Checklist
            </h3>
            <ul className="space-y-3.5 text-xs text-white/60">
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Verify that your Broker password matches the MT5 master password, not investor access.</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>The server node field must match exactly (e.g., ICMarkets-Live02, ICMarkets-Live05).</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>Our hosting system operates isolated execution servers inside secured private virtualization.</span>
              </li>
            </ul>
          </div>

          <div className="glass-card p-4 sm:p-6 text-xs text-white/40 leading-relaxed">
            <p className="font-bold text-white/60 uppercase tracking-wider mb-2">Need assistance with your broker?</p>
            You can find your server node name and master MT5 login details within your broker's secure dashboard (such as IC Markets, RoboForex, or Pepperstone). For immediate support choosing or connecting a broker, please open a ticket with our support desk.
          </div>
        </div>
      </div>
    </div>
  );
};
