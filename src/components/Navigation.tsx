/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  Bot, LayoutDashboard, Database, Activity, CreditCard, 
  Settings, ShieldAlert, LogOut, Bell, Menu, X, Check, CheckSquare,
  History
} from 'lucide-react';
import { Notification } from '../types';
import { Logo } from './common/Logo';

interface NavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onNavigate?: (route: string) => void;
  children: React.ReactNode;
}

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange, onNavigate, children }) => {
  const { state, logout, apiRequest, updateUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);

  const user = state.user;

  const fetchNotifications = async () => {
    if (!state.isAuthenticated) return;
    const res = await apiRequest<Notification[]>('/api/notifications');
    if (res.success && res.data) {
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.read).length);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll notifications every 10 seconds for real-time fidelity
    const timer = setInterval(fetchNotifications, 10000);
    return () => clearInterval(timer);
  }, [state.isAuthenticated]);

  const handleMarkRead = async (id?: string) => {
    const res = await apiRequest('/api/notifications/read', {
      method: 'POST',
      body: JSON.stringify({ id })
    });
    if (res.success) {
      fetchNotifications();
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'mt5', label: 'MT5 Terminals', icon: <Database className="w-4 h-4" /> },
    { id: 'bot-status', label: 'Bot Strategy', icon: <Activity className="w-4 h-4" /> },
    { id: 'trades', label: 'Trade History', icon: <History className="w-4 h-4" /> },
    { id: 'subscription', label: 'Billing & Plans', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'settings', label: 'Security', icon: <Settings className="w-4 h-4" /> }
  ];

  return (
    <div className="bg-[#050505] text-[#E5E5E5] min-h-screen flex flex-col md:flex-row font-sans">
      
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex w-64 bg-[#080808] border-r border-white/5 flex-col justify-between shrink-0 h-screen sticky top-0 z-30">
        <div>
          {/* Brand Logo */}
          <div className="p-6 flex items-center justify-start gap-3">
            <Logo size="md" />
          </div>

          {/* Section title */}
          <div className="text-[10px] uppercase tracking-widest text-white/30 px-6 py-2 mt-2">Main Menu</div>

          {/* Navigation Items */}
          <nav className="px-3 space-y-1 mt-0">
            {navItems.map((item) => {
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`side-nav-${item.id}`}
                  onClick={() => onTabChange(item.id)}
                  className={`sidebar-item w-full flex items-center justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    active 
                      ? 'active-nav' 
                      : 'text-white/60 hover:text-white'
                  }`}
                  title={item.label}
                >
                  <div className="shrink-0">{item.icon}</div>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {user?.role === 'ADMIN' && (
            <div className="px-3 mt-6 pt-4 border-t border-white/5">
              <button
                onClick={() => onNavigate ? onNavigate('/admin') : (window.location.href = '/admin')}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Operations Console</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Profile Card / Logout Footer */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center justify-start gap-3 bg-white/5 p-3 rounded-xl min-w-0">
            <img 
              src={user?.profilePicture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80"} 
              alt="avatar" 
              className="w-8 h-8 rounded-full border border-white/10 shrink-0 object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">{user?.email}</div>
              <div className="text-[10px] text-white/40 truncate uppercase">{user?.role}</div>
            </div>
            <button 
              id="side-nav-logout-btn"
              onClick={() => setShowLogoutModal(true)}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Drawer Overlay & Content */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Drawer container */}
          <div className="relative flex flex-col w-64 max-w-xs bg-[#080808] border-r border-white/5 h-full p-4 justify-between shadow-2xl z-50 animate-fade-in">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Logo size="sm" />
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-white/60 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Nav Items */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const active = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onTabChange(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                        active 
                          ? 'active-nav' 
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      <div className="shrink-0">{item.icon}</div>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Footer profile */}
            <div className="border-t border-white/5 pt-4">
              <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl min-w-0 mb-3">
                <img 
                  src={user?.profilePicture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80"} 
                  alt="avatar" 
                  className="w-8 h-8 rounded-full border border-white/10 shrink-0 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white truncate">{user?.email}</div>
                  <div className="text-[10px] text-white/40 truncate uppercase">{user?.role}</div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowLogoutModal(true);
                }}
                className="w-full py-2.5 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center gap-2 text-xs font-semibold text-red-400 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Pane Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Menu Header (Top Bar with Hamburger menu) */}
        <header className="md:hidden h-14 border-b border-white/5 bg-[#080808] flex items-center justify-between px-4 sticky top-0 z-20 shrink-0 w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-white/60 hover:text-white cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold tracking-tight text-white uppercase">{currentTab.replace('-', ' ')}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications Trigger Mobile */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative w-8 h-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-white/60 hover:text-white cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-[9px] font-bold text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Card */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2.5 w-72 bg-[#0c0c0c] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-white/5 flex items-center justify-between bg-[#101010]">
                    <span className="text-xs font-bold text-white">System Alerts</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={() => handleMarkRead()}
                        className="text-[9px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-0.5 cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                    {notifications.length === 0 ? (
                      <div className="p-5 text-center text-xs text-white/40">No active system alerts.</div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className={`p-3 text-xs transition-colors hover:bg-white/5 ${n.read ? 'opacity-50' : 'bg-[#121212]'}`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold text-white text-[10px] leading-tight block">{n.title}</span>
                            {!n.read && (
                              <button 
                                onClick={() => handleMarkRead(n.id)}
                                className="w-4 h-4 rounded bg-white/5 flex items-center justify-center hover:bg-blue-600 hover:text-white shrink-0 cursor-pointer"
                              >
                                <Check className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                          <p className="text-white/60 text-[9px] mt-1 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Top Header bar (Desktop) */}
        <header className="h-16 border-b border-white/5 bg-[#050505] px-8 items-center justify-between hidden md:flex shrink-0">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-white/40">Organization</span>
            <span className="text-white/20">/</span>
            <span className="text-white font-medium">{currentTab.replace('-', '_')}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Dynamic Alerts Indicator / Connection */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full status-glow animate-pulse" />
              <span className="text-[10px] font-medium text-green-400 uppercase tracking-wider">Cloud Bot Active</span>
            </div>

            {/* Notifications Trigger Desktop */}
            <div className="relative">
              <button 
                id="top-nav-bell-trigger"
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 border border-white/10 text-white/60 hover:text-white transition-all cursor-pointer relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-blue-500 text-[8px] font-bold text-white flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Card */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2.5 w-80 bg-[#0c0c0c] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-3.5 border-b border-white/5 flex items-center justify-between bg-[#101010]">
                    <span className="text-xs font-bold text-white">System Alerts</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={() => handleMarkRead()}
                        className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                      >
                        <CheckSquare className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-white/40">No active system alerts.</div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className={`p-3.5 text-xs transition-colors hover:bg-white/5 ${n.read ? 'opacity-50' : 'bg-[#121212]'}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-white text-[11px] leading-tight block">{n.title}</span>
                            {!n.read && (
                              <button 
                                onClick={() => handleMarkRead(n.id)}
                                className="w-4 h-4 rounded bg-white/5 flex items-center justify-center hover:bg-blue-600 hover:text-white shrink-0 cursor-pointer"
                                title="Mark read"
                              >
                                <Check className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                          <p className="text-white/60 text-[10px] mt-1 leading-relaxed">{n.message}</p>
                          <span className="text-[8px] font-mono text-white/40 mt-1.5 block">
                            {new Date(n.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User credentials identifier */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5 bg-white/5">
              <span className="text-[11px] font-mono text-white/60 tracking-wide font-semibold">User: {user?.email}</span>
            </div>
          </div>
        </header>

        {/* Dashboard Dynamic View Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {user && (!user.isEmailVerified && !user.verified) && (
            <div className="mb-6 bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-xl text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <p className="font-bold text-white uppercase tracking-wider text-[10px]">Security Notice: Email Verification Pending</p>
                  <p className="text-white/60 text-[10px] mt-0.5">Please verify your email address to unlock full automated MetaTrader 5 bot attachment features.</p>
                  {verifyMsg && (
                    <p className="text-emerald-400 font-bold mt-1 text-[10px]">{verifyMsg}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={async () => {
                    try {
                      setVerifying(true);
                      setVerifyMsg(null);
                      const res = await apiRequest('/api/auth/resend-verification', { 
                        method: 'POST',
                        body: JSON.stringify({ email: user.email })
                      });
                      if (res.success) {
                        setVerifyMsg('A fresh verification link has been resent to your email.');
                      } else {
                        setVerifyMsg(res.message || 'Resend failed. SMTP may be unconfigured.');
                      }
                    } catch (err: any) {
                      setVerifyMsg(err.message || 'Resend failed.');
                    } finally {
                      setVerifying(false);
                    }
                  }}
                  disabled={verifying}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] tracking-wider rounded-lg uppercase cursor-pointer transition disabled:opacity-50 border border-white/10"
                >
                  Resend Email
                </button>
                <button 
                  onClick={async () => {
                    try {
                      setVerifying(true);
                      setVerifyMsg(null);
                      const res = await apiRequest('/api/auth/verify-email', { method: 'POST' });
                      if (res.success) {
                        setVerifyMsg('Email verified successfully! Session updated.');
                        setTimeout(() => {
                          updateUser({ ...user, verified: true, isEmailVerified: true });
                          setVerifyMsg(null);
                        }, 2000);
                      } else {
                        setVerifyMsg(res.message || 'Verification failed.');
                      }
                    } catch (err: any) {
                      setVerifyMsg(err.message || 'Verification failed.');
                    } finally {
                      setVerifying(false);
                    }
                  }}
                  disabled={verifying}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-[10px] tracking-wider rounded-lg uppercase cursor-pointer transition disabled:opacity-50"
                >
                  {verifying ? 'Verifying...' : 'Verify Email Now'}
                </button>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>

      {/* SIGN-OUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm glass-card p-6 border border-red-500/30 shadow-2xl shadow-red-950/40 bg-[#0d0f17]">
            {/* Modal Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-white/10">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Confirm Logout</h3>
                <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider mt-0.5">Vinebot Trading Terminal</p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="py-4">
              <p className="text-xs text-gray-300 leading-relaxed">
                Are you sure you want to sign out of Vinebot trading terminal?
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                id="cancel-logout-btn"
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-logout-btn"
                onClick={() => {
                  setShowLogoutModal(false);
                  logout();
                  window.location.href = '/';
                }}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition uppercase flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-600/30"
              >
                <LogOut className="w-3.5 h-3.5" /> Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
