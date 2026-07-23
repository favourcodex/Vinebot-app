/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { 
  Bot, ShieldCheck, Database, CreditCard, Activity, 
  Clock, AlertTriangle, PlayCircle, PlusCircle, Sparkles, RefreshCw,
  TrendingUp, DollarSign, Percent, BarChart2, ArrowUpRight, ArrowDownRight, Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { UserSubscription, Mt5Account, BotActivation, ActivityLog, SubscriptionPlan, BotActivationStatus } from '../types';

interface DashboardHomeProps {
  onTabChange: (tab: string) => void;
}

interface PnLDataPoint {
  date: string;
  profit: number;
  cumulativePnL: number;
  trades: number;
}

const generateMockPnLData = (daysCount: number): PnLDataPoint[] => {
  const data: PnLDataPoint[] = [];
  const now = new Date();
  let cumulative = 0;
  
  const dailyProfits = [
    180.50, 320.10, -95.00, 410.25, 275.80, -45.00, 510.00, 
    190.20, -110.50, 380.00, 290.40, 430.15, -80.00, 310.50, 
    220.00, -150.25, 490.80, 315.00, 185.50, -65.00, 420.30, 
    360.10, 240.00, -120.50, 530.40, 280.20, 390.15, -75.00, 
    460.00, 345.50, 210.80, -105.00, 480.25, 325.00, -90.00,
    515.40, 295.10, 410.00, -60.50, 385.20, 270.00, 495.50,
    -130.00, 440.10, 350.25, 215.00, -85.50, 525.00, 310.80,
    265.40, -115.00, 475.20, 335.00, 195.50, -70.00, 435.10,
    380.25, 290.00, 505.50, -95.00
  ];

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
    const idx = (daysCount - 1 - i) % dailyProfits.length;
    const profit = dailyProfits[idx];
    cumulative += profit;
    const trades = Math.floor(Math.abs(profit) / 25) + 6;
    data.push({
      date: dateStr,
      profit,
      cumulativePnL: Number(cumulative.toFixed(2)),
      trades
    });
  }
  return data;
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as PnLDataPoint;
    const isPositive = data.profit >= 0;
    return (
      <div className="bg-[#0c0e17] border border-white/15 p-3.5 rounded-xl shadow-2xl text-xs space-y-2 z-50 min-w-[180px] backdrop-blur-md">
        <div className="flex justify-between items-center pb-1.5 border-b border-white/10">
          <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wide">{data.date}</span>
          <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 font-semibold">{data.trades} trades</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-400 text-[11px]">Daily P&L:</span>
          <span className={`font-mono font-bold text-xs ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}${data.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-white/5">
          <span className="text-gray-300 font-semibold text-[11px]">Cumulative:</span>
          <span className="font-mono font-bold text-xs text-blue-400">
            ${data.cumulativePnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-pro-month',
    name: 'Vinebot Pro Access',
    description: 'Complete automated MetaTrader 5 bot deployment, dedicated VPS, and low-latency execution.',
    price: 100.00,
    interval: 'month',
    features: ['Up to 3 Linked MT5 Accounts', 'Advanced Drawdown Safeguards', 'Dedicated VPS Hosting Included', 'Low-Latency Node Allocation', 'Priority Support'],
    stripePriceId: 'price_pro_monthly'
  }
];

export const DashboardHome: React.FC<DashboardHomeProps> = ({ onTabChange }) => {
  const { apiRequest } = useAuth();
  const [sub, setSub] = useState<UserSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(DEFAULT_PLANS);
  const [mt5, setMt5] = useState<Mt5Account | null>(null);
  const [bot, setBot] = useState<BotActivation | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7D' | '30D' | 'ALL'>('30D');

  const pnlDays = timeframe === '7D' ? 7 : timeframe === '30D' ? 30 : 60;
  const pnlData = useMemo(() => generateMockPnLData(pnlDays), [pnlDays]);

  const metrics = useMemo(() => {
    if (!pnlData || pnlData.length === 0) return { totalProfit: 0, winRate: '0.0', totalTrades: 0, avgDailyReturn: '0.00' };
    const totalProfit = pnlData[pnlData.length - 1]?.cumulativePnL || 0;
    const winningDays = pnlData.filter(d => d.profit > 0).length;
    const winRate = ((winningDays / pnlData.length) * 100).toFixed(1);
    const totalTrades = pnlData.reduce((acc, curr) => acc + curr.trades, 0);
    const avgDailyReturn = (totalProfit / pnlData.length).toFixed(2);
    return { totalProfit, winRate, totalTrades, avgDailyReturn };
  }, [pnlData]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [plansRes, mt5Res, botRes, logsRes] = await Promise.all([
        apiRequest<SubscriptionPlan[]>('/api/plans'),
        apiRequest<Mt5Account | null>('/api/mt5'),
        apiRequest<BotActivation | null>('/api/bot-activation'),
        apiRequest<ActivityLog[]>('/api/activity-logs')
      ]);

      if (plansRes.success && plansRes.data && plansRes.data.length > 0) {
        setPlans(plansRes.data);
      } else {
        setPlans(DEFAULT_PLANS);
      }
      if (mt5Res.success && mt5Res.data) {
        setMt5(mt5Res.data);
      } else {
        setMt5(null);
      }
      if (botRes.success && botRes.data) {
        setBot(botRes.data);
      } else {
        setBot(null);
      }
      if (logsRes.success && logsRes.data) {
        setLogs(logsRes.data.slice(0, 5));
      }

      const subRes = await apiRequest<UserSubscription | null>('/api/payments/subscription');
      if (subRes.success && subRes.data) {
        setSub(subRes.data);
      } else {
        setSub(null);
      }

    } catch (e) {
      console.error('Error compiling dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getBotStatusBadge = (status: BotActivationStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full status-glow">ACTIVE</span>;
      case 'PENDING_PAYMENT':
        return <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full">PENDING PAYMENT</span>;
      case 'PAYMENT_CONFIRMED':
        return <span className="px-2.5 py-1 text-[10px] font-bold bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full">PAYMENT VERIFIED</span>;
      case 'WAITING_FOR_BOT_TEAM':
        return <span className="px-2.5 py-1 text-[10px] font-bold bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-full">AWAITING DEPLOYMENT</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 text-[10px] font-bold bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full">VPS PROVISIONING</span>;
      case 'PAUSED':
        return <span className="px-2.5 py-1 text-[10px] font-bold bg-gray-500/10 border border-gray-500/30 text-gray-400 rounded-full">PAUSED</span>;
      case 'FAILED':
        return <span className="px-2.5 py-1 text-[10px] font-bold bg-red-500/10 border border-red-500/30 text-red-400 rounded-full">FAILED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 text-[10px] font-bold bg-red-500/10 border border-red-500/20 text-red-400/80 rounded-full">TERMINATED</span>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-white/5 rounded animate-pulse" />
          <div className="h-8 w-24 bg-white/5 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
          <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
          <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-white/5 rounded-xl animate-pulse" />
          <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const activePlan = plans.find(p => p.id === sub?.planId);

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-home">
      
      {/* Greetings bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">System Command Center</h1>
          <p className="text-white/40 text-xs mt-1">Configure parameters, inspect audit trails, and oversee automated trading VPS state.</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="px-3.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Systems
        </button>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Subscription Status Card */}
        <div className="glass-card p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-2xl rounded-full" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Active Plan</span>
            <CreditCard className="w-4 h-4 text-blue-400" />
          </div>
          {sub ? (
            <div>
              <p className="text-lg font-bold text-white tracking-tight">{activePlan?.name || 'Professional Bot'}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-mono font-semibold text-emerald-400">Subscription Active</span>
              </div>
              <p className="text-[9px] text-white/40 font-medium mt-4">
                Renews on: {new Date(sub.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-bold text-white/40">No Active Subscription</p>
              <button 
                onClick={() => onTabChange('subscription')}
                className="mt-4 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[10px] tracking-wide rounded-lg flex items-center gap-1 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Subscribe Now
              </button>
            </div>
          )}
        </div>

        {/* MT5 Account Card */}
        <div className="glass-card p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-2xl rounded-full" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">MT5 Broker Connection</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          {mt5 ? (
            <div>
              <p className="text-lg font-bold text-white tracking-tight">#{mt5.accountNumber}</p>
              <p className="text-[10px] text-white/60 font-medium mt-1">Broker: {mt5.brokerName}</p>
              <p className="text-[9px] text-white/40 font-mono mt-4 truncate">Server: {mt5.serverName}</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-bold text-white/40">No Broker Linked</p>
              <button 
                onClick={() => onTabChange('mt5')}
                className="mt-4 px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-[10px] tracking-wide rounded-lg flex items-center gap-1 transition-colors"
              >
                <Database className="w-3.5 h-3.5" /> Link MT5 Account
              </button>
            </div>
          )}
        </div>

        {/* Bot Activation Status */}
        <div className="glass-card p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-2xl rounded-full" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Automation Thread</span>
            <Bot className="w-4 h-4 text-blue-400" />
          </div>
          {bot ? (
            <div>
              <div className="mt-1">{getBotStatusBadge(bot.status)}</div>
              <p className="text-[10px] text-white/60 mt-3.5 leading-relaxed">
                {bot.status === 'ACTIVE' 
                  ? 'Expert Advisor is currently running on Node VPS, executing buy/sell parameters 24/5.'
                  : 'Awaiting administrative verification and VM provisioning.'}
              </p>
              <button 
                onClick={() => onTabChange('bot-status')}
                className="text-[10px] font-semibold text-blue-400 hover:text-blue-300 mt-2.5 flex items-center gap-1 cursor-pointer"
              >
                View deployment timeline &rarr;
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm font-bold text-white/40">Bot Inactive</p>
              <p className="text-[10px] text-white/40 mt-2">Complete subscription and configure MT5 parameters to queue your bot.</p>
            </div>
          )}
        </div>
      </div>

      {/* 30-Day P&L Performance Analytics Card */}
      <div className="glass-card p-6 relative overflow-hidden">
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-bold text-white tracking-tight">30-Day P&L Performance</h2>
              <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1 shadow-sm shadow-amber-500/5">
                <Sparkles className="w-3 h-3" /> Coming Soon
              </span>
            </div>
            <p className="text-white/40 text-xs mt-1">Real-time cumulative equity growth and automated trade analytics.</p>
          </div>

          {/* Timeframe Filter Buttons (Disabled) */}
          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-white/10 shrink-0 opacity-40 cursor-not-allowed pointer-events-none" title="Analytics timeframe filters available once live trading is active">
            {(['7D', '30D', 'ALL'] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                disabled
                className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all ${
                  tf === '30D' 
                    ? 'bg-blue-600/50 text-white' 
                    : 'text-gray-400'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Sleek Modern "Coming Soon" Placeholder Card */}
        <div className="my-6 p-8 sm:p-12 rounded-2xl bg-gradient-to-b from-[#0b0e17] to-[#07090e] border border-white/10 text-center flex flex-col items-center justify-center relative overflow-hidden group">
          {/* Subtle Background Glow Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-500/10 blur-[90px] rounded-full pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/5 blur-2xl rounded-full pointer-events-none" />

          {/* Icon Badge */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4 shadow-xl shadow-blue-950/40 relative z-10 group-hover:scale-105 transition-transform duration-300">
            <BarChart2 className="w-7 h-7 text-blue-400" />
          </div>

          {/* Title & Description */}
          <h3 className="text-lg font-bold text-white tracking-tight relative z-10 mb-2">
            Live Performance Tracking Activation
          </h3>
          <p className="text-gray-400 text-xs sm:text-sm max-w-lg leading-relaxed relative z-10 mb-6">
            Live performance tracking and interactive P&L analytics will activate automatically once your <span className="text-blue-400 font-semibold">MT5 trading account</span> or bot is connected and actively executing trades.
          </p>

          {/* Status Badge Tag */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-gray-300 relative z-10">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Status: Awaiting First MT5 Execution</span>
          </div>
        </div>

        {/* DEMO STATS & CHART (TEMPORARILY COMMENTED OUT)
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-6 border-b border-white/5 opacity-50">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center justify-between text-gray-400 text-[11px] mb-1">
              <span>Total Net Profit</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <p className="text-lg sm:text-xl font-mono font-bold text-emerald-400">
              +${metrics.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center justify-between text-gray-400 text-[11px] mb-1">
              <span>Win Rate</span>
              <Percent className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <p className="text-lg sm:text-xl font-mono font-bold text-white">{metrics.winRate}%</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center justify-between text-gray-400 text-[11px] mb-1">
              <span>Total Executions</span>
              <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <p className="text-lg sm:text-xl font-mono font-bold text-white">{metrics.totalTrades}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center justify-between text-gray-400 text-[11px] mb-1">
              <span>Avg Daily Return</span>
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-lg sm:text-xl font-mono font-bold text-amber-400">+${metrics.avgDailyReturn}</p>
          </div>
        </div>

        <div className="pt-6">
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={pnlData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickFormatter={(val) => `$${val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="cumulativePnL" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#pnlGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        */}
      </div>

      {/* Main Bottom Section: Timeline vs Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Deployment Thread Timeline Widget */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" /> Active VPS Deployment Queue
              </h2>
              <p className="text-white/40 text-[10px] mt-0.5">Real-time terminal updates from quantitative deployment logs.</p>
            </div>
            {bot && (
              <span className="text-[10px] font-mono text-white/60 font-semibold bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                ID: {bot.id.substring(0, 8)}
              </span>
            )}
          </div>

          {bot ? (
            <div className="space-y-6">
              {bot.timeline.slice(0, 3).map((event, idx) => (
                <div key={idx} className="flex gap-4 relative">
                  {idx < bot.timeline.slice(0, 3).length - 1 && (
                    <div className="absolute left-2.5 top-5 bottom-0 w-0.5 bg-white/5" />
                  )}
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border z-10 ${
                    event.completed 
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400' 
                      : 'bg-white/5 border-white/10 text-white/40'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2.5">
                      <h4 className="text-xs font-bold text-white">{event.title}</h4>
                      {event.timestamp && (
                        <span className="text-[9px] font-mono text-white/40">{new Date(event.timestamp).toLocaleTimeString()}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/60 mt-1 leading-relaxed">{event.description}</p>
                  </div>
                </div>
              ))}
              <div className="border-t border-white/5 pt-4 flex justify-end">
                <button 
                  onClick={() => onTabChange('bot-status')}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-[10px] font-bold text-white transition-colors cursor-pointer"
                >
                  Inspect Full Pipeline Thread &rarr;
                </button>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-white/40 border border-dashed border-white/10 rounded-xl bg-white/5">
              <AlertTriangle className="w-8 h-8 text-amber-500/60 mx-auto mb-2 animate-pulse" />
              <p className="font-semibold text-white">Deployment queue empty</p>
              <p className="mt-1">Link your MT5 account and buy a subscription to begin container provisioning.</p>
            </div>
          )}
        </div>

        {/* User Session Audit Activity Trail */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" /> Local Audit Trail
          </h2>
          <p className="text-white/40 text-[10px] border-b border-white/5 pb-4 mb-4">Immutable logs of important security actions.</p>

          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-[10px] text-white/40">No local sessions audited.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="text-xs">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-bold text-blue-400 font-mono tracking-wide text-[10px] uppercase">{log.action}</span>
                    <span className="text-[8px] font-mono text-white/40 shrink-0">{new Date(log.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-white/60 text-[10px] mt-0.5 leading-relaxed truncate">{log.details}</p>
                  {log.ipAddress && (
                    <span className="text-[8px] font-mono text-white/30 block mt-0.5">IP Node: {log.ipAddress}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
