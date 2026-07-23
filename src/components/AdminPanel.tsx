/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  ShieldAlert, Users, CreditCard, Activity, Database, CheckSquare, 
  RefreshCw, Search, ArrowRight, Save, UserX, FileText, Download, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { ApiResponse, BotActivationStatus } from '../types';
import { Logo } from './common/Logo';

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  linkedMt5Accounts: number;
  pendingBotActivations: number;
}

export const AdminPanel: React.FC = () => {
  const { apiRequest } = useAuth();
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [activations, setActivations] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [view, setView] = useState<'users' | 'activations' | 'logs'>('activations');
  const [loading, setLoading] = useState(true);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Status adjustment form
  const [statusForm, setStatusForm] = useState<{ id: string; status: string; notes: string } | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, actRes, logsRes] = await Promise.all([
        apiRequest<any>('/api/admin/stats'),
        apiRequest<any[]>('/api/admin/users'),
        apiRequest<any[]>('/api/admin/bot-activations'),
        apiRequest<any[]>('/api/admin/activity-logs')
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data.stats);
      }
      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data);
      }
      if (actRes.success && actRes.data) {
        setActivations(actRes.data);
      }
      if (logsRes.success && logsRes.data) {
        setLogs(logsRes.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateUser = async (userId: string, currentVerified: boolean) => {
    setUpdatingId(userId);
    const res = await apiRequest(`/api/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ verified: !currentVerified })
    });
    if (res.success) {
      setMessage({ type: 'success', text: `User verification toggled successfully!` });
      fetchAdminData();
    } else {
      setMessage({ type: 'error', text: res.message });
    }
    setUpdatingId(null);
  };

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
      setMessage({ type: 'success', text: 'Bot activation status and logs fully propagated.' });
      setStatusForm(null);
      fetchAdminData();
    } else {
      setMessage({ type: 'error', text: res.message });
    }
    setUpdatingId(null);
  };

  const handleExportCSV = () => {
    // Navigate browser to download CSV from secure endpoint
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
  const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredActivations = activations.filter(act => 
    act.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    act.mt5?.accountNumber.includes(searchQuery)
  );
  const filteredLogs = logs.filter(log => 
    log.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in" id="admin-panel-view">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Logo size="md" />
            <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded tracking-widest uppercase flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> Admin Mode
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Platform Operations Desk
          </h1>
          <p className="text-white/40 text-xs mt-1">
            Global VPS dispatch management console. Review client MT5 credentials, progress activations, and download security logs.
          </p>
        </div>
        <button 
          onClick={fetchAdminData}
          className="px-3.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer hover:bg-white/10"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reload Dispatch Node
        </button>
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

      {/* Admin Stats Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center justify-between text-white/40 text-[10px] uppercase font-bold tracking-wider mb-2">
            <span>Total Members</span>
            <Users className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="text-xl font-extrabold text-white">{stats?.totalUsers || 0}</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between text-white/40 text-[10px] uppercase font-bold tracking-wider mb-2">
            <span>Active Licences</span>
            <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold text-white">{stats?.activeSubscriptions || 0}</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between text-white/40 text-[10px] uppercase font-bold tracking-wider mb-2">
            <span>Accumulated Revenue</span>
            <CreditCard className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="text-xl font-extrabold text-white">${(stats?.totalRevenue || 0).toFixed(2)}</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between text-white/40 text-[10px] uppercase font-bold tracking-wider mb-2">
            <span>Linked Brokers</span>
            <Database className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <p className="text-xl font-extrabold text-white">{stats?.linkedMt5Accounts || 0}</p>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between text-white/40 text-[10px] uppercase font-bold tracking-wider mb-2">
            <span>Pending VPS Activations</span>
            <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          </div>
          <p className="text-xl font-extrabold text-amber-400">{stats?.pendingBotActivations || 0}</p>
        </div>
      </div>

      {/* Main Panel Operations Desk */}
      <div className="glass-card overflow-hidden !p-0">
        
        {/* Navigation Switcher Tab */}
        <div className="p-4 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-2">
            <button 
              onClick={() => { setView('activations'); setSearchQuery(''); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition ${
                view === 'activations' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              Bot Activation Queue ({activations.length})
            </button>
            <button 
              onClick={() => { setView('users'); setSearchQuery(''); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition ${
                view === 'users' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              User Registry ({users.length})
            </button>
            <button 
              onClick={() => { setView('logs'); setSearchQuery(''); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide uppercase transition ${
                view === 'logs' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              Security Audit Logs ({logs.length})
            </button>
          </div>

          {/* Search Inputs / Exports */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {view === 'logs' && (
              <button 
                onClick={handleExportCSV}
                className="px-3.5 py-2 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/20 hover:border-emerald-500 text-emerald-400 hover:text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
              >
                <Download className="w-3.5 h-3.5" /> CSV Export
              </button>
            )}

            <div className="relative w-full sm:w-48">
              <input 
                type="text"
                placeholder={`Search ${view}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#050505] border border-white/10 rounded-lg pl-8 pr-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            </div>
          </div>
        </div>

        {/* Content Section Tables */}
        <div className="p-6">
          
          {/* VIEW: ACTIVATIONS */}
          {view === 'activations' && (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-white/5">
                  <thead>
                    <tr className="text-white/40 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">User Email</th>
                      <th className="py-3 px-4">MT5 Acc</th>
                      <th className="py-3 px-4">Broker / Server</th>
                      <th className="py-3 px-4">Current Status</th>
                      <th className="py-3 px-4">Updated At</th>
                      <th className="py-3 px-4">Operation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-white/80">
                    {filteredActivations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-white/40">No matching deployment items queue.</td>
                      </tr>
                    ) : (
                      filteredActivations.map((act) => (
                        <tr key={act.id} className="hover:bg-white/5">
                          <td className="py-3.5 px-4 font-bold text-white">{act.user?.email || 'N/A'}</td>
                          <td className="py-3.5 px-4 font-mono text-blue-400 font-bold">{act.mt5?.accountNumber || 'None'}</td>
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-white">{act.mt5?.brokerName || 'No Broker'}</p>
                            <p className="text-[9px] font-mono text-white/40">{act.mt5?.serverName || ''}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-white/80 uppercase">
                              {act.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[10px] text-white/40">{new Date(act.updatedAt).toLocaleDateString()}</td>
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => setStatusForm({ id: act.id, status: act.status, notes: act.adminNotes || '' })}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-[10px] tracking-wide uppercase cursor-pointer"
                            >
                              Dispatch Adjust
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Status Adjust Box Overlay modal-like layout */}
              {statusForm && (
                <div className="bg-[#050505]/60 border border-white/10 rounded-xl p-5 mt-6 relative">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Advance bot Activation & VPS dispatch</h3>
                  
                  <form onSubmit={handleUpdateBotActivation} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wide mb-1.5">Set Status</label>
                        <select 
                          value={statusForm.status}
                          onChange={e => setStatusForm({ ...statusForm, status: e.target.value })}
                          className="w-full bg-[#050505] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
                          <option value="PAYMENT_CONFIRMED">PAYMENT_CONFIRMED</option>
                          <option value="WAITING_FOR_BOT_TEAM">WAITING_FOR_BOT_TEAM (Awaiting Deployment)</option>
                          <option value="IN_PROGRESS">IN_PROGRESS (VPS Provisioning)</option>
                          <option value="ACTIVE">ACTIVE (Running EA)</option>
                          <option value="PAUSED">PAUSED</option>
                          <option value="FAILED">FAILED (Connection error)</option>
                          <option value="CANCELLED">CANCELLED (De-allocated)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wide mb-1.5">VPS dispatch Parameters / Notes</label>
                        <input 
                          type="text"
                          value={statusForm.notes}
                          onChange={e => setStatusForm({ ...statusForm, notes: e.target.value })}
                          placeholder="e.g. VPS assigned to Node-IC-04. Deployed Vinebot EA."
                          className="w-full bg-[#050505] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                      <button 
                        type="button"
                        onClick={() => setStatusForm(null)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold text-white uppercase cursor-pointer"
                      >
                        Dismiss
                      </button>
                      <button 
                        type="submit"
                        disabled={updatingId === statusForm.id}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold uppercase cursor-pointer flex items-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" /> Save Parameters
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* VIEW: USERS */}
          {view === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-white/5">
                <thead>
                  <tr className="text-white/40 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">User Email</th>
                    <th className="py-3 px-4">Registered Date</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Billing Plan</th>
                    <th className="py-3 px-4">MT5 Config</th>
                    <th className="py-3 px-4">Verified</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-white/40">No matching user accounts found.</td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-white/5">
                        <td className="py-3.5 px-4 font-bold text-white">{u.email}</td>
                        <td className="py-3.5 px-4 text-[10px] text-white/40">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[10px] tracking-wide text-blue-400">{u.role}</td>
                        <td className="py-3.5 px-4 font-semibold text-white/85">
                          {u.subscription ? (
                            <span className="text-emerald-400 font-bold">{u.subscription.planId.replace('plan-', '')}</span>
                          ) : (
                            <span className="text-white/40">No subscription</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[10px]">
                          {u.mt5 ? `#${u.mt5.accountNumber}` : <span className="text-white/30">Unlinked</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            u.verified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {u.verified ? 'VERIFIED' : 'PENDING'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleUpdateUser(u.id, u.verified)}
                            disabled={updatingId === u.id}
                            className="text-blue-400 hover:text-blue-300 font-bold text-[10px] tracking-wide uppercase cursor-pointer"
                          >
                            Toggle Verification
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW: LOGS */}
          {view === 'logs' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-white/5">
                <thead>
                  <tr className="text-white/40 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Event Date</th>
                    <th className="py-3 px-4">Subject User</th>
                    <th className="py-3 px-4">Shorthand Action</th>
                    <th className="py-3 px-4">Audit Details</th>
                    <th className="py-3 px-4">IP Node</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white/80 font-mono text-[10px]">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-white/40">No audited logs recorded.</td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/5">
                        <td className="py-3 px-4 text-white/40">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="py-3 px-4 font-bold text-white">{log.userEmail || 'System'}</td>
                        <td className="py-3 px-4 text-blue-400 font-bold">{log.action}</td>
                        <td className="py-3 px-4 text-white/60 max-w-xs truncate">{log.details}</td>
                        <td className="py-3 px-4 text-white/30">{log.ipAddress || '127.0.0.1'}</td>
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
