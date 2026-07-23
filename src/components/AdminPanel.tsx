/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  ShieldAlert, Users, CreditCard, Activity, Database, CheckSquare, 
  RefreshCw, Search, Save, Download, CheckCircle2, AlertTriangle,
  Copy, Eye, EyeOff, Power, Key, Mail, Check, Sparkles, Sliders
} from 'lucide-react';
import { Logo } from './common/Logo';

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  linkedMt5Accounts: number;
  activeBots: number;
  pendingBotActivations: number;
}

export const AdminPanel: React.FC = () => {
  const { apiRequest } = useAuth();
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [mt5Accounts, setMt5Accounts] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [activations, setActivations] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  
  const [view, setView] = useState<'users' | 'mt5' | 'subscriptions' | 'logs'>('users');
  const [loading, setLoading] = useState(true);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Password visibility & clipboard state for MT5 Credentials Desk
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Status adjustment modal/form state
  const [statusForm, setStatusForm] = useState<{ id: string; userId: string; status: string; notes: string } | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, mt5Res, subRes, actRes, logsRes] = await Promise.all([
        apiRequest<any>('/api/admin/stats'),
        apiRequest<any[]>('/api/admin/users'),
        apiRequest<any[]>('/api/admin/mt5-accounts'),
        apiRequest<any[]>('/api/admin/subscriptions'),
        apiRequest<any[]>('/api/admin/bot-activations'),
        apiRequest<any[]>('/api/admin/activity-logs')
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data.stats);
      }
      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data);
      }
      if (mt5Res.success && mt5Res.data) {
        setMt5Accounts(mt5Res.data);
      }
      if (subRes.success && subRes.data) {
        setSubscriptions(subRes.data);
      }
      if (actRes.success && actRes.data) {
        setActivations(actRes.data);
      }
      if (logsRes.success && logsRes.data) {
        setLogs(logsRes.data);
      }
    } catch (e) {
      console.error('Error compiling admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Direct Bot Activation / Deactivation Toggle Switch Handler
  const handleToggleBot = async (userId: string, currentActive: boolean) => {
    setUpdatingId(userId);
    const nextActiveState = !currentActive;
    
    const res = await apiRequest('/api/admin/activate-bot', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        isBotActive: nextActiveState,
        adminNotes: nextActiveState ? 'Bot enabled via Operations Desk toggle' : 'Bot paused via Operations Desk toggle'
      })
    });

    if (res.success) {
      setMessage({ 
        type: 'success', 
        text: `Bot ${nextActiveState ? 'ACTIVATED' : 'DEACTIVATED'} successfully for user. Database synced in real time.` 
      });
      fetchAdminData();
    } else {
      setMessage({ type: 'error', text: res.message || 'Failed to toggle bot activation state.' });
    }
    setUpdatingId(null);
  };

  // Toggle user verification
  const handleToggleVerification = async (userId: string, currentVerified: boolean) => {
    setUpdatingId(userId);
    const res = await apiRequest(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ verified: !currentVerified })
    });
    if (res.success) {
      setMessage({ type: 'success', text: `User account verification state updated successfully!` });
      fetchAdminData();
    } else {
      setMessage({ type: 'error', text: res.message });
    }
    setUpdatingId(null);
  };

  // Dispatch / Advance Bot Activation status
  const handleUpdateBotActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusForm) return;

    setUpdatingId(statusForm.id);
    const res = await apiRequest(`/api/admin/bot-activations/${statusForm.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: statusForm.status,
        adminNotes: statusForm.notes
      })
    });

    if (res.success) {
      setMessage({ type: 'success', text: 'Bot activation status and deployment logs propagated.' });
      setStatusForm(null);
      fetchAdminData();
    } else {
      setMessage({ type: 'error', text: res.message });
    }
    setUpdatingId(null);
  };

  // Copy password or credentials helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle password visibility in MT5 Desk
  const togglePasswordVisibility = (accId: string) => {
    setVisiblePasswords(prev => ({ ...prev, [accId]: !prev[accId] }));
  };

  const handleExportCSV = () => {
    const token = localStorage.getItem('vinebot_token');
    window.open(`/api/admin/logs/csv?authorization=Bearer ${token}`, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 bg-white/5 rounded animate-pulse" />
        <div className="h-96 bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  // Filter computations
  const filteredUsers = users.filter(u => {
    const matchesQuery = u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' 
      || (statusFilter === 'ACTIVE_BOT' && u.isBotActive)
      || (statusFilter === 'PAUSED_BOT' && !u.isBotActive)
      || (statusFilter === 'VERIFIED' && u.verified)
      || (statusFilter === 'PENDING' && !u.verified);
    return matchesQuery && matchesStatus;
  });

  const filteredMt5 = mt5Accounts.filter(acc => 
    acc.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    acc.accountNumber.includes(searchQuery) ||
    acc.brokerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubscriptions = subscriptions.filter(sub => 
    sub.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = logs.filter(log => 
    log.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in" id="admin-operations-desk">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Logo size="md" />
            <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-extrabold px-2.5 py-0.5 rounded tracking-widest uppercase flex items-center gap-1.5 shadow-sm">
              <ShieldAlert className="w-3.5 h-3.5" /> Live Production Operations Desk
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Admin Operations Console
          </h1>
          <p className="text-white/40 text-xs mt-1">
            Real-time control tower. Review live MT5 submissions, toggle bot execution states, and audit system logs.
          </p>
        </div>
        <button 
          onClick={fetchAdminData}
          className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-white flex items-center gap-2 cursor-pointer transition shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-400" /> Refresh Operations Feed
        </button>
      </div>

      {/* Real-Time System Notification Alert */}
      {message && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center gap-3 shadow-lg ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
            : 'bg-red-500/10 border border-red-500/30 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Admin Operations Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between text-white/40 text-[10px] uppercase font-bold tracking-wider mb-2">
            <span>Total Members</span>
            <Users className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white">{stats?.totalUsers || 0}</p>
          <p className="text-[10px] text-white/30 mt-1">Registered Accounts</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between text-white/40 text-[10px] uppercase font-bold tracking-wider mb-2">
            <span>Active Licences</span>
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">{stats?.activeSubscriptions || 0}</p>
          <p className="text-[10px] text-emerald-400/80 mt-1">Active Subscriptions</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between text-white/40 text-[10px] uppercase font-bold tracking-wider mb-2">
            <span>Active Bots</span>
            <Power className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{stats?.activeBots || 0}</p>
          <p className="text-[10px] text-emerald-400/80 mt-1">Live Trading Bots</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between text-white/40 text-[10px] uppercase font-bold tracking-wider mb-2">
            <span>Total Revenue</span>
            <CreditCard className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white">${(stats?.totalRevenue || 0).toFixed(2)}</p>
          <p className="text-[10px] text-white/30 mt-1">Processed Payments</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between text-white/40 text-[10px] uppercase font-bold tracking-wider mb-2">
            <span>MT5 Linked</span>
            <Database className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white">{stats?.linkedMt5Accounts || 0}</p>
          <p className="text-[10px] text-purple-400/80 mt-1">Broker Connections</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between text-white/40 text-[10px] uppercase font-bold tracking-wider mb-2">
            <span>Pending Setup</span>
            <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-amber-400">{stats?.pendingBotActivations || 0}</p>
          <p className="text-[10px] text-amber-400/80 mt-1">Queued Deployment</p>
        </div>
      </div>

      {/* Operations Desk Content Area */}
      <div className="glass-card overflow-hidden !p-0 border border-white/10 rounded-2xl">
        
        {/* Navigation Tabs Header */}
        <div className="p-4 border-b border-white/5 bg-white/5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => { setView('users'); setSearchQuery(''); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition flex items-center gap-2 cursor-pointer ${
                view === 'users' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> User Management ({users.length})
            </button>

            <button 
              onClick={() => { setView('mt5'); setSearchQuery(''); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition flex items-center gap-2 cursor-pointer ${
                view === 'mt5' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Key className="w-3.5 h-3.5" /> MT5 Credentials Desk ({mt5Accounts.length})
            </button>

            <button 
              onClick={() => { setView('subscriptions'); setSearchQuery(''); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition flex items-center gap-2 cursor-pointer ${
                view === 'subscriptions' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Power className="w-3.5 h-3.5" /> Bot Activation & Subscriptions ({subscriptions.length})
            </button>

            <button 
              onClick={() => { setView('logs'); setSearchQuery(''); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition flex items-center gap-2 cursor-pointer ${
                view === 'logs' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> System Audit Logs ({logs.length})
            </button>
          </div>

          {/* Search Inputs & Filter Actions */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            {view === 'users' && (
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-[#050505] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE_BOT">Active Bot</option>
                <option value="PAUSED_BOT">Bot Paused</option>
                <option value="VERIFIED">Verified Users</option>
                <option value="PENDING">Pending Users</option>
              </select>
            )}

            {view === 'logs' && (
              <button 
                onClick={handleExportCSV}
                className="px-3.5 py-2 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 hover:text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all shrink-0 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" /> Export Audit CSV
              </button>
            )}

            <div className="relative w-full lg:w-60">
              <input 
                type="text"
                placeholder={`Search ${view}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#050505] border border-white/10 rounded-xl pl-8 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            </div>
          </div>
        </div>

        {/* Tab Content Section */}
        <div className="p-6">
          
          {/* TAB 1: USER MANAGEMENT */}
          {view === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-white/5">
                <thead>
                  <tr className="text-white/40 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">User Details</th>
                    <th className="py-3.5 px-4">Signup Date</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Subscription Plan</th>
                    <th className="py-3.5 px-4">Linked MT5</th>
                    <th className="py-3.5 px-4">Bot Execution</th>
                    <th className="py-3.5 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-white/40 font-medium">
                        No registered users found matching filter.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={u.profilePicture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                              alt="Avatar" 
                              className="w-8 h-8 rounded-full border border-white/10 object-cover"
                            />
                            <div>
                              <p className="font-bold text-white flex items-center gap-2">
                                {u.email}
                                {u.verified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                              </p>
                              <p className="text-[10px] text-white/30 font-mono">ID: {u.id.substring(0, 12)}...</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-white/50 text-[11px]">
                          {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-[10px] tracking-wider">
                          <span className={`px-2 py-0.5 rounded ${u.role === 'ADMIN' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-blue-400 border border-white/10'}`}>
                            {u.role}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-white/85">
                          {u.subscription ? (
                            <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">
                              {u.subscription.planId.replace('plan-', '').replace('-month', '').toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-white/30 text-[10px]">NO SUBSCRIPTION</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          {u.mt5 ? (
                            <span className="text-blue-400 font-bold flex items-center gap-1">
                              #{u.mt5.accountNumber} <span className="text-[9px] text-white/30">({u.mt5.brokerName})</span>
                            </span>
                          ) : (
                            <span className="text-white/30 text-[10px]">UNLINKED</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleBot(u.id, u.isBotActive)}
                            disabled={updatingId === u.id}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition ${
                              u.isBotActive 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30' 
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                            }`}
                          >
                            <Power className="w-3 h-3" />
                            {u.isBotActive ? 'BOT ACTIVE' : 'BOT PAUSED'}
                          </button>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleToggleVerification(u.id, u.verified)}
                            disabled={updatingId === u.id}
                            className="text-white/60 hover:text-white underline font-medium text-[10px] tracking-wide cursor-pointer"
                          >
                            {u.verified ? 'Unverify' : 'Verify User'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: MT5 CREDENTIALS DESK */}
          {view === 'mt5' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-center gap-3">
                <Mail className="w-4 h-4 shrink-0 text-blue-400" />
                <span>
                  <strong>Automated Alert Desk:</strong> Every submitted MT5 account triggers an instant automated credential alert email dispatched directly to <strong>vinindustry0@gmail.com</strong>.
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-white/5">
                  <thead>
                    <tr className="text-white/40 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">User Account</th>
                      <th className="py-3.5 px-4">Broker Name</th>
                      <th className="py-3.5 px-4">MT5 Server Name</th>
                      <th className="py-3.5 px-4">MT5 Account #</th>
                      <th className="py-3.5 px-4">MT5 Password</th>
                      <th className="py-3.5 px-4">Submitted Date</th>
                      <th className="py-3.5 px-4">Dispatch Alert</th>
                      <th className="py-3.5 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80">
                    {filteredMt5.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-white/40 font-medium">
                          No MT5 account submissions found.
                        </td>
                      </tr>
                    ) : (
                      filteredMt5.map((acc) => (
                        <tr key={acc.id} className="hover:bg-white/[0.02] transition">
                          <td className="py-3.5 px-4 font-bold text-white">{acc.userEmail}</td>
                          <td className="py-3.5 px-4 font-semibold text-purple-300">{acc.brokerName}</td>
                          <td className="py-3.5 px-4 font-mono text-white/70">{acc.serverName}</td>
                          <td className="py-3.5 px-4 font-mono text-blue-400 font-bold text-sm">
                            {acc.accountNumber}
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            <div className="flex items-center gap-2">
                              <span className="bg-[#050505] px-2.5 py-1 rounded border border-white/10 text-emerald-400 font-bold">
                                {visiblePasswords[acc.id] ? acc.password : '••••••••'}
                              </span>
                              <button
                                onClick={() => togglePasswordVisibility(acc.id)}
                                className="text-white/40 hover:text-white p-1 cursor-pointer"
                                title="Toggle Visibility"
                              >
                                {visiblePasswords[acc.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-white/40 text-[10px]">
                            {new Date(acc.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                              <Check className="w-3 h-3" /> Dispatched
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCopyText(`Account: ${acc.accountNumber}\nBroker: ${acc.brokerName}\nServer: ${acc.serverName}\nPassword: ${acc.password}`, `full-${acc.id}`)}
                                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] font-bold text-white uppercase flex items-center gap-1 cursor-pointer"
                              >
                                {copiedId === `full-${acc.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                {copiedId === `full-${acc.id}` ? 'Copied' : 'Copy All'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: BOT ACTIVATION & SUBSCRIPTIONS */}
          {view === 'subscriptions' && (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-white/5">
                  <thead>
                    <tr className="text-white/40 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Customer Email</th>
                      <th className="py-3.5 px-4">Active Plan</th>
                      <th className="py-3.5 px-4">Subscription Status</th>
                      <th className="py-3.5 px-4">Payments Processed</th>
                      <th className="py-3.5 px-4">Bot Active Toggle</th>
                      <th className="py-3.5 px-4">Dispatch Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80">
                    {filteredSubscriptions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-white/40 font-medium">
                          No user subscriptions or payment records found.
                        </td>
                      </tr>
                    ) : (
                      filteredSubscriptions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-white/[0.02] transition">
                          <td className="py-3.5 px-4 font-bold text-white">{sub.userEmail}</td>
                          <td className="py-3.5 px-4 font-semibold text-blue-400">{sub.planName}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                              sub.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {sub.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-emerald-400 font-bold">
                            ${sub.payments?.reduce((sum: number, p: any) => sum + p.amount, 0).toFixed(2) || '0.00'}
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleToggleBot(sub.userId, sub.isBotActive)}
                              disabled={updatingId === sub.userId}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition ${
                                sub.isBotActive 
                                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500' 
                                  : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                              {sub.isBotActive ? 'ACTIVE (Click to Pause)' : 'PAUSED (Click to Activate)'}
                            </button>
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => {
                                const act = activations.find(a => a.userId === sub.userId);
                                setStatusForm({
                                  id: act?.id || sub.id,
                                  userId: sub.userId,
                                  status: act?.status || 'ACTIVE',
                                  notes: act?.adminNotes || ''
                                });
                              }}
                              className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 rounded-lg font-bold text-[10px] tracking-wide uppercase cursor-pointer flex items-center gap-1"
                            >
                              <Sliders className="w-3 h-3" /> Advance Status
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Status Adjust Overlay Modal */}
              {statusForm && (
                <div className="bg-[#0a0a0a] border border-white/15 rounded-2xl p-6 relative shadow-2xl animate-fade-in">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400" /> Advance Bot Deployment & VPS Parameters
                  </h3>
                  
                  <form onSubmit={handleUpdateBotActivation} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5">Deployment Target Status</label>
                        <select 
                          value={statusForm.status}
                          onChange={e => setStatusForm({ ...statusForm, status: e.target.value })}
                          className="w-full bg-[#050505] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-semibold cursor-pointer"
                        >
                          <option value="WAITING_FOR_BOT_TEAM">WAITING_FOR_BOT_TEAM (Awaiting Setup)</option>
                          <option value="IN_PROGRESS">IN_PROGRESS (VPS Provisioning)</option>
                          <option value="ACTIVE">ACTIVE (Bot Running Live EA)</option>
                          <option value="PAUSED">PAUSED (Bot Suspended)</option>
                          <option value="FAILED">FAILED (Connection Error)</option>
                          <option value="CANCELLED">CANCELLED (De-allocated)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5">Admin Dispatch Notes</label>
                        <input 
                          type="text"
                          value={statusForm.notes}
                          onChange={e => setStatusForm({ ...statusForm, notes: e.target.value })}
                          placeholder="e.g. Assigned to Low-Latency Node IC-04. Trailing stops active."
                          className="w-full bg-[#050505] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                      <button 
                        type="button"
                        onClick={() => setStatusForm(null)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white uppercase cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={updatingId === statusForm.id}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase cursor-pointer flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
                      >
                        <Save className="w-4 h-4" /> Save Dispatch Parameters
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SYSTEM AUDIT LOGS */}
          {view === 'logs' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-white/5">
                <thead>
                  <tr className="text-white/40 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Timestamp</th>
                    <th className="py-3.5 px-4">Subject User</th>
                    <th className="py-3.5 px-4">Action Event</th>
                    <th className="py-3.5 px-4">Audit Details</th>
                    <th className="py-3.5 px-4">IP Node</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80 font-mono text-[11px]">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-white/40 font-medium">
                        No system activity audit records found.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3.5 px-4 text-white/40">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-bold text-white">{log.userEmail || 'System'}</td>
                        <td className="py-3.5 px-4 font-bold text-blue-400">{log.action}</td>
                        <td className="py-3.5 px-4 text-white/70 max-w-sm truncate">{log.details || 'N/A'}</td>
                        <td className="py-3.5 px-4 text-white/30">{log.ipAddress || '127.0.0.1'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
