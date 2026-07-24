/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { 
  ShieldAlert, Users, Key, Power, Activity, LogOut, 
  Menu, X, LayoutDashboard, RefreshCw, CheckCircle2, Shield, Sliders
} from 'lucide-react';
import { Logo } from '../components/common/Logo';

export type AdminTab = 'overview' | 'users' | 'mt5' | 'subscriptions' | 'logs' | 'settings';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ currentTab, onTabChange, children }) => {
  const { state, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const user = state.user;

  const adminNavItems: { id: AdminTab; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'overview', label: 'Operations Overview', icon: <LayoutDashboard className="w-4 h-4" />, desc: 'Platform metrics & live stats' },
    { id: 'users', label: 'User Management', icon: <Users className="w-4 h-4" />, desc: 'Registered users & verification' },
    { id: 'mt5', label: 'MT5 Credentials Desk', icon: <Key className="w-4 h-4" />, desc: 'Submitted broker credentials' },
    { id: 'subscriptions', label: 'Bot Activation Queue', icon: <Power className="w-4 h-4" />, desc: 'Real-time bot state toggles' },
    { id: 'logs', label: 'Audit Logs', icon: <Activity className="w-4 h-4" />, desc: 'System events & activity logs' },
    { id: 'settings', label: 'Platform Settings', icon: <Sliders className="w-4 h-4" />, desc: 'System configuration & alerts' }
  ];

  return (
    <div className="bg-[#050505] text-[#E5E5E5] min-h-screen flex flex-col md:flex-row font-sans selection:bg-rose-500/30 selection:text-white">
      
      {/* Desktop Admin Operations Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#08080c] border-r border-rose-500/15 flex-col justify-between shrink-0 h-screen sticky top-0 z-30 shadow-2xl">
        <div>
          {/* Brand Logo & Admin Badge */}
          <div className="p-5 border-b border-rose-500/10">
            <div className="flex items-center gap-3">
              <Logo size="md" />
            </div>
            <div className="mt-3 bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[9px] font-extrabold px-2.5 py-1 rounded tracking-widest uppercase flex items-center justify-center gap-1.5 shadow-sm">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" /> Operations Console
            </div>
          </div>

          {/* Section title */}
          <div className="text-[10px] font-bold uppercase tracking-widest text-rose-400/50 px-5 py-3">
            Admin Controls
          </div>

          {/* Navigation Items */}
          <nav className="px-3 space-y-1">
            {adminNavItems.map((item) => {
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                    active 
                      ? 'bg-rose-600/20 text-white border border-rose-500/40 shadow-lg shadow-rose-950/40 font-extrabold' 
                      : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className={`shrink-0 p-1.5 rounded-lg ${active ? 'bg-rose-500 text-white' : 'bg-white/5 text-white/60'}`}>
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{item.label}</div>
                    <div className="text-[9px] font-normal text-white/30 truncate">{item.desc}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Admin Footer & Logout */}
        <div className="p-4 border-t border-rose-500/10 bg-rose-950/10">
          <div className="flex items-center justify-between gap-3 bg-black/40 p-3 rounded-xl border border-rose-500/20">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                <Shield className="w-3 h-3 text-rose-400 shrink-0" />
                {user?.email || 'admin@vinebot.app'}
              </div>
              <div className="text-[9px] font-mono text-rose-400/80 font-semibold tracking-wider">SYSTEM ADMINISTRATOR</div>
            </div>
            <button 
              onClick={() => setShowLogoutModal(true)}
              className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 hover:text-white hover:bg-rose-600 transition-all shrink-0 cursor-pointer"
              title="Sign Out of Operations Console"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Navigation Header */}
      <div className="md:hidden bg-[#08080c] border-b border-rose-500/15 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-extrabold px-2 py-0.5 rounded tracking-wider uppercase">
            ADMIN
          </span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 bg-white/5 border border-white/10 rounded-lg text-white"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex flex-col w-72 max-w-xs bg-[#08080c] border-r border-rose-500/20 h-full p-4 justify-between shadow-2xl z-50">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <Logo size="sm" />
                <button onClick={() => setMobileMenuOpen(false)} className="text-white/60 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1.5">
                {adminNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id as any);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition ${
                      currentTab === item.id 
                        ? 'bg-rose-600 text-white shadow-lg' 
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowLogoutModal(true);
                }}
                className="w-full py-2.5 bg-rose-600/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Operations Console Content Canvas */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0c0d12] border border-rose-500/30 p-6 rounded-2xl max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-rose-500/20 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Sign Out of Admin Console</h3>
              <p className="text-xs text-white/50 mt-1">End active administrative session on Vinebot Operations Desk?</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowLogoutModal(false);
                  logout();
                  window.location.href = '/';
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold uppercase cursor-pointer shadow-lg shadow-rose-950/50"
              >
                Confirm Exit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
