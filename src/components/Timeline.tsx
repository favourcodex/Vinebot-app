/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  Activity, CheckCircle2, AlertTriangle, Cpu, Terminal, 
  RefreshCw, PlayCircle, HelpCircle, MessageSquare, Hourglass
} from 'lucide-react';
import { BotActivation, BotActivationStatus, TimelineEvent } from '../types';

export const Timeline: React.FC = () => {
  const { apiRequest } = useAuth();
  const [activation, setActivation] = useState<BotActivation | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchBotStatus = async () => {
    setLoading(true);
    const res = await apiRequest<BotActivation | null>('/api/bot-activation');
    if (res.success && res.data) {
      setActivation(res.data);
    } else {
      setActivation(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBotStatus();
  }, []);

  const handleTriggerActivation = async () => {
    setRequesting(true);
    setMessage(null);
    
    const res = await apiRequest<BotActivation>('/api/bot-activation', {
      method: 'POST'
    });

    if (res.success) {
      setMessage({ type: 'success', text: 'Bot queue initiated. Deployed quant managers notified!' });
      fetchBotStatus();
    } else {
      setMessage({ type: 'error', text: res.message });
    }
    setRequesting(false);
  };

  const getStatusColor = (status: BotActivationStatus) => {
    switch (status) {
      case 'ACTIVE': return 'text-emerald-400 border-emerald-500/35 bg-emerald-500/10 status-glow';
      case 'PENDING_PAYMENT': return 'text-amber-400 border-amber-500/35 bg-amber-500/10';
      case 'PAYMENT_CONFIRMED': return 'text-blue-400 border-blue-500/35 bg-blue-500/10';
      case 'WAITING_FOR_BOT_TEAM': return 'text-purple-400 border-purple-500/35 bg-purple-500/10';
      case 'IN_PROGRESS': return 'text-blue-400 border-blue-500/35 bg-blue-500/10';
      case 'PAUSED': return 'text-gray-400 border-gray-500/35 bg-gray-500/10';
      case 'FAILED': return 'text-red-400 border-red-500/35 bg-red-500/10';
      default: return 'text-red-400/85 border-red-500/20 bg-red-500/5';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 bg-white/5 rounded animate-pulse" />
        <div className="h-96 bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in" id="bot-timeline-view">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Cpu className="w-6 h-6 text-blue-400" /> MT5 Bot Operation Timeline
          </h1>
          <p className="text-white/40 text-xs mt-1">
            Track your container provisioning, algorithm validation, and active execution parameters.
          </p>
        </div>
        <button 
          onClick={fetchBotStatus}
          className="px-3.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer hover:bg-white/10"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Re-poll status
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Timeline progression */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">VPS Deployment pipeline</h2>
            {activation && (
              <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wide ${getStatusColor(activation.status)}`}>
                {activation.status.replace(/_/g, ' ')}
              </span>
            )}
          </div>

          {activation ? (
            <div className="space-y-8 relative">
              {activation.timeline.map((event, idx) => {
                const activeLine = idx < activation.timeline.length - 1;
                return (
                  <div key={idx} className="flex gap-4 relative">
                    {activeLine && (
                      <div className={`absolute left-3.5 top-6 bottom-0 w-0.5 ${
                        event.completed ? 'bg-blue-600' : 'bg-white/5'
                      }`} />
                    )}

                    <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center border z-10 shrink-0 ${
                      event.completed 
                        ? 'bg-blue-600/15 border-blue-500 text-blue-400 status-glow' 
                        : 'bg-[#050505] border-white/10 text-white/40'
                    }`}>
                      {event.completed ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Hourglass className="w-4 h-4 animate-pulse" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-baseline gap-2.5">
                        <h4 className={`text-xs font-bold ${event.completed ? 'text-white' : 'text-white/40'}`}>{event.title}</h4>
                        {event.timestamp && (
                          <span className="text-[9px] font-mono text-white/40">{new Date(event.timestamp).toLocaleString()}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-white/60 mt-1.5 leading-relaxed">{event.description}</p>
                      {event.byUser && (
                        <span className="text-[8px] font-mono text-blue-400/85 bg-white/5 px-1.5 py-0.5 rounded mt-1.5 inline-block border border-white/5">
                          Verified: {event.byUser}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-white/40 space-y-4">
              <Terminal className="w-10 h-10 text-white/40 mx-auto" />
              <p className="font-bold text-white">Trading Bot Thread Inactive</p>
              <p className="max-w-md mx-auto text-white/40">
                To activate the expert automated trading bot, you must link your MT5 account credentials and purchase an active license plan.
              </p>
              <button 
                onClick={handleTriggerActivation}
                disabled={requesting}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] tracking-wider uppercase rounded-lg transition-colors cursor-pointer disabled:opacity-50 inline-block"
              >
                {requesting ? 'Initializing Pipeline Thread...' : 'Queue Bot Activation'}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Admin Dispatch Notes & Instructions */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" /> Platform Dispatch Notes
            </h3>
            <p className="text-white/40 text-[10px] border-b border-white/5 pb-3 mb-4">Official parameters issued by bot administrators.</p>

            {activation?.adminNotes ? (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 font-mono text-[10px] text-white/80 leading-relaxed whitespace-pre-wrap">
                {activation.adminNotes}
              </div>
            ) : (
              <p className="text-white/40 text-xs italic">No administrative dispatches on record. Once our team reviews your account number, technical VPS parameters will appear here.</p>
            )}
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">VPS Specifications</h3>
            <div className="space-y-2.5 font-mono text-[10px] text-white/60">
              <div className="flex justify-between">
                <span>OS Environment:</span>
                <span className="text-white">Windows Server Core</span>
              </div>
              <div className="flex justify-between">
                <span>Core Allocation:</span>
                <span className="text-white">Dedicated (Standard Node)</span>
              </div>
              <div className="flex justify-between">
                <span>Execution Speed:</span>
                <span className="text-white">&lt; 3ms Low-latency</span>
              </div>
              <div className="flex justify-between">
                <span>EA License:</span>
                <span className="text-white">Vinebot Alpha v4.2</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
