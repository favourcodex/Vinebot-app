/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  Settings, User, Lock, ShieldAlert, Monitor, CheckCircle2, 
  AlertTriangle, UploadCloud, Save, RefreshCw, KeyRound, Trash2, X, Loader2, Sparkles, ShieldCheck
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { state, updateUser, logout, apiRequest } = useAuth();
  const user = state.user;

  const [picUrl, setPicUrl] = useState(user?.profilePicture || '');
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Danger Zone / Delete Account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Default avatars for quick selection
  const quickAvatars = [
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
  ];

  const handleUpdateAvatar = async (url: string) => {
    setSubmitting(true);
    setMessage(null);
    const res = await apiRequest('/api/auth/profile-picture', {
      method: 'POST',
      body: JSON.stringify({ url })
    });
    if (res.success && res.data) {
      setPicUrl(url);
      updateUser({ ...user!, profilePicture: url });
      setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
    } else {
      setMessage({ type: 'error', text: res.message });
    }
    setSubmitting(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.newPassword || !form.confirmPassword) {
      setMessage({ type: 'error', text: 'All password fields are required.' });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    const res = await apiRequest('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: user?.email,
        newPassword: form.newPassword
      })
    });

    if (res.success) {
      setMessage({ type: 'success', text: 'Password secure update complete!' });
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      setMessage({ type: 'error', text: res.message });
    }
    setSubmitting(false);
  };

  const handleDeleteAccount = async () => {
    if (confirmInput.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm account removal.');
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await apiRequest('/api/account/delete', {
        method: 'POST'
      });

      if (res.success) {
        setShowDeleteModal(false);
        logout();
      } else {
        setDeleteError(res.message || 'Failed to archive account.');
        setDeleting(false);
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Network error occurred.');
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in" id="settings-view">
      
      {/* Header Info */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          <Settings className="w-6 h-6 text-blue-400" /> Account Settings
        </h1>
        <p className="text-white/40 text-xs mt-1">
          Review profile details, assign avatar nodes, and secure system credentials.
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Avatar Upload / profile card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 text-center">
            <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest border-b border-white/5 pb-3 mb-6">
              Avatar Specifications
            </h3>
            
            <div className="relative inline-block mb-4">
              <img 
                src={picUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                alt="Profile Avatar"
                className="w-24 h-24 rounded-full border border-blue-500/20 mx-auto object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border border-[#050505]">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>

            <p className="text-xs font-bold text-white mb-1 truncate">{user?.email}</p>
            <span className="text-[9px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded uppercase tracking-wider border border-blue-500/10">
              {user?.role}
            </span>

            {/* Selector list of quick avatars */}
            <div className="mt-6 border-t border-white/5 pt-4">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-3">Quick Presets</p>
              <div className="flex justify-center gap-2.5">
                {quickAvatars.map((url, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleUpdateAvatar(url)}
                    disabled={submitting}
                    className={`w-10 h-10 rounded-full overflow-hidden border-2 transition ${
                      picUrl === url ? 'border-blue-500 scale-105' : 'border-white/10 hover:border-white/40'
                    }`}
                  >
                    <img src={url} alt={`avatar-${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Security update credentials */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Authentication Methods Card */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" /> Authentication Methods
            </h3>

            <div className="space-y-3">
              {/* Magic Link Option */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Sparkles className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-xs">Magic Link (Passwordless)</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Single-use passwordless verification delivered to {user?.email}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 font-bold font-mono text-[9px] rounded-md border border-emerald-500/20 uppercase tracking-wider shrink-0">
                  ACTIVE
                </span>
              </div>

              {/* Google OAuth Option */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-white text-xs">Google OAuth (Linked)</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Seamless single sign-on backed by Google identity services</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 font-bold font-mono text-[9px] rounded-md border border-emerald-500/20 uppercase tracking-wider shrink-0">
                  LINKED
                </span>
              </div>
            </div>
          </div>

          {/* Active login session details */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3 mb-4 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-emerald-400" /> Active System Session
            </h3>

            <div className="flex items-center justify-between py-2 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-white/40 border border-white/10">
                  <Monitor className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="font-bold text-white">Browser Terminal session</p>
                  <p className="text-[9px] text-white/40 font-mono mt-0.5">Secure IP Node: 127.0.0.1 (AI Studio proxy)</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-bold font-mono text-[9px] rounded border border-emerald-500/20 status-glow">
                ACTIVE
              </span>
            </div>
          </div>

          {/* DANGER ZONE - DELETE MY ACCOUNT */}
          <div className="glass-card p-6 border border-red-500/30 bg-gradient-to-br from-red-950/20 via-black to-red-950/10">
            <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider border-b border-red-500/20 pb-3 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" /> Danger Zone
            </h3>

            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Permanently archive your account data, cancel any active Stripe subscriptions, and disconnect your MT5 automated trading bots. This action cannot be reversed.
            </p>

            <button
              id="delete-account-btn"
              onClick={() => {
                setConfirmInput('');
                setDeleteError(null);
                setShowDeleteModal(true);
              }}
              className="py-2.5 px-4 bg-red-600/20 hover:bg-red-600 border border-red-500/40 text-red-300 hover:text-white font-bold text-xs tracking-wider rounded-lg transition uppercase flex items-center gap-2 cursor-pointer shadow-lg shadow-red-600/10"
            >
              <Trash2 className="w-4 h-4" /> Delete My Account
            </button>
          </div>

        </div>

      </div>

      {/* CONFIRMATION MODAL FOR ACCOUNT DELETION */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md glass-card p-6 border border-red-500/40 shadow-2xl shadow-red-950/50 bg-[#0d0f17]">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Confirm Account Deletion</h3>
                  <p className="text-[10px] text-red-400 font-mono uppercase tracking-wider mt-0.5">Irreversible Operation</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-3">
              <p className="text-xs text-gray-300 leading-relaxed">
                You are about to archive your Vinebot EA account. Performing this action will:
              </p>

              <ul className="text-xs text-gray-400 space-y-2 pl-2">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span> 
                  <span><strong>Cancel active Stripe subscriptions</strong> and stop recurring billing immediately.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span> 
                  <span><strong>Disconnect MT5 trading bots</strong> and revoke automated trade execution.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span> 
                  <span>Archive your profile details, trading logs, and system credentials.</span>
                </li>
              </ul>

              <div className="pt-2">
                <label className="block text-[11px] font-bold text-gray-300 uppercase tracking-wide mb-1.5">
                  Type <span className="text-red-400 font-mono bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20">DELETE</span> to confirm:
                </label>
                <input 
                  type="text"
                  value={confirmInput}
                  onChange={e => setConfirmInput(e.target.value)}
                  placeholder="Type DELETE here"
                  disabled={deleting}
                  className="w-full bg-[#05070c] border border-red-500/30 rounded-lg px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 placeholder:text-gray-600"
                />
              </div>

              {deleteError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-delete-account-btn"
                onClick={handleDeleteAccount}
                disabled={deleting || confirmInput.trim().toUpperCase() !== 'DELETE'}
                className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-xs font-extrabold text-white transition uppercase flex items-center gap-2 cursor-pointer shadow-lg shadow-red-600/30"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Archiving Account...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Permanent Delete
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

