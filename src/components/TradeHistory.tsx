/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { motion } from 'motion/react';
import { 
  TrendingUp, TrendingDown, RefreshCw, ChevronLeft, ChevronRight, 
  Activity, Award, BarChart2, Clock, Download, Search, Filter
} from 'lucide-react';
import { Trade } from '../types';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip 
} from 'recharts';

export const TradeHistory: React.FC = () => {
  const { apiRequest } = useAuth();
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchSymbol, setSearchSymbol] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  // Stats State
  const [totalTrades, setTotalTrades] = useState(0);
  const [totalPnL, setTotalPnL] = useState(0);
  const [winRate, setWinRate] = useState(0);
  const [activeCount, setActiveCount] = useState(0);

  // Cumulative Chart Data
  const [chartData, setChartData] = useState<any[]>([]);

  const fetchAllTradesData = async () => {
    setLoading(true);
    try {
      // Fetch up to 1000 items in one request for comprehensive local filtering and analytics
      const res = await apiRequest<{ trades: Trade[] }>('/api/trades?page=1&limit=1000');
      if (res.success && res.data && res.data.trades) {
        const list = res.data.trades;
        setAllTrades(list);
        
        // Calculate stable general stats of the overall history
        setTotalTrades(list.length);
        
        const closedTrades = list.filter(t => t.status === 'CLOSED');
        const wins = closedTrades.filter(t => t.pnl > 0).length;
        const rate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;
        setWinRate(rate);

        const sumPnL = list.reduce((sum, t) => sum + t.pnl, 0);
        setTotalPnL(sumPnL);

        const active = list.filter(t => t.status === 'OPEN').length;
        setActiveCount(active);

        // Generate cumulative P&L chart data for the last 30 closed trades
        const sortedRecentTrades = [...closedTrades]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 30)
          .reverse();

        let runningPnL = 0;
        const cData = sortedRecentTrades.map((trade, index) => {
          runningPnL += trade.pnl;
          return {
            index: index + 1,
            tradeId: `#${trade.id.slice(0, 6)}`,
            symbol: trade.symbol,
            type: trade.type,
            pnl: trade.pnl,
            cumulativePnL: parseFloat(runningPnL.toFixed(2)),
            date: new Date(trade.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          };
        });
        setChartData(cData);
      }
    } catch (e) {
      console.error('Error fetching trade history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTradesData();
  }, []);

  // Filter trades locally
  const filteredTrades = allTrades.filter((trade) => {
    const matchesSymbol = trade.symbol.toLowerCase().includes(searchSymbol.trim().toLowerCase());
    const matchesType = filterType === 'ALL' || trade.type === filterType;
    const matchesStatus = filterStatus === 'ALL' || trade.status === filterStatus;
    return matchesSymbol && matchesType && matchesStatus;
  });

  // Calculate local pagination
  const totalFiltered = filteredTrades.length;
  const pages = Math.max(1, Math.ceil(totalFiltered / limit));
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchSymbol, filterType, filterStatus]);

  const startIndex = (currentPage - 1) * limit;
  const paginatedTrades = filteredTrades.slice(startIndex, startIndex + limit);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < pages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // CSV Downloader
  const downloadCSV = () => {
    if (filteredTrades.length === 0) return;

    const headers = [
      'Position ID', 
      'Asset Symbol', 
      'Direction/Type', 
      'Lots (Volume)', 
      'Entry Price', 
      'Exit Price', 
      'Profit or Loss', 
      'Status', 
      'Created At', 
      'Closed At'
    ];

    const rows = filteredTrades.map(trade => [
      trade.id,
      trade.symbol,
      trade.type,
      trade.volume,
      trade.entryPrice,
      trade.status === 'OPEN' ? '—' : trade.exitPrice,
      trade.pnl,
      trade.status,
      trade.createdAt,
      trade.closedAt || '—'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Vincorp_Trades_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 text-gray-200"
      id="trade-history-container"
    >
      {/* Tab Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1b202e] pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white uppercase font-sans">Trade Execution Registry</h2>
          <p className="text-xs text-gray-400">Real-time log of automated expert advisor operations.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Download CSV button */}
          <button 
            onClick={downloadCSV}
            disabled={filteredTrades.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold transition uppercase cursor-pointer"
            id="btn-download-csv"
            title="Export filtered trades to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          
          <button 
            onClick={fetchAllTradesData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0e1118] hover:bg-[#151924] border border-[#1b202e] rounded-lg text-xs font-semibold text-gray-300 transition uppercase cursor-pointer"
            id="btn-refresh-trades"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Analytics Dashboard Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="trade-stats-grid">
        {/* Stat Card 1: Cumulative P&L */}
        <div className="bg-[#0e1118] border border-[#1b202e] rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cumulative P&L</span>
            <div className={`text-lg font-mono font-bold flex items-center ${totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
            </div>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${totalPnL >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'}`}>
            {totalPnL >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          </div>
        </div>

        {/* Stat Card 2: Win Rate */}
        <div className="bg-[#0e1118] border border-[#1b202e] rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Win Rate (Closed)</span>
            <div className="text-lg font-mono font-bold text-white">
              {winRate.toFixed(1)}%
            </div>
          </div>
          <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Stat Card 3: Total Executed */}
        <div className="bg-[#0e1118] border border-[#1b202e] rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Operations</span>
            <div className="text-lg font-mono font-bold text-white">
              {totalTrades}
            </div>
          </div>
          <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center">
            <BarChart2 className="w-5 h-5" />
          </div>
        </div>

        {/* Stat Card 4: Active Positions */}
        <div className="bg-[#0e1118] border border-[#1b202e] rounded-xl p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Positions</span>
            <div className="text-lg font-mono font-bold text-amber-400">
              {activeCount}
            </div>
          </div>
          <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Cumulative P&L Equity Curve Chart */}
      <div className="bg-[#0e1118] border border-[#1b202e] rounded-xl p-5 space-y-4" id="equity-curve-chart-card">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-white uppercase font-sans">Cumulative Equity Curve</h3>
          <p className="text-xs text-gray-400">Progression of cumulative Profit and Loss over the last 30 closed trade executions.</p>
        </div>
        
        {chartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center border border-[#1b202e] border-dashed rounded-lg bg-[#0a0c12]/50 text-center p-4">
            <Activity className="w-8 h-8 text-gray-500 mb-2 opacity-60 animate-pulse" />
            <p className="text-xs text-gray-400 font-mono">No closed trade executions available to generate equity curve.</p>
          </div>
        ) : (
          <div className="h-72 w-full pr-4" id="equity-recharts-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1b202e" vertical={false} />
                <XAxis 
                  dataKey="index" 
                  stroke="#4b5563" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#4b5563" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const isProfit = data.pnl >= 0;
                      return (
                        <div className="bg-[#0e1118] border border-[#1b202e] p-3 rounded-lg shadow-xl text-[11px] font-mono space-y-1.5">
                          <div className="text-gray-400 border-b border-[#1b202e] pb-1 font-sans flex justify-between items-center gap-4">
                            <span>Trade {data.tradeId}</span>
                            <span className="text-[10px] bg-[#151924] px-1.5 py-0.5 rounded text-gray-300">{data.date}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-400">Asset:</span>
                            <span className="font-bold text-white">{data.symbol} ({data.type})</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-400">Trade P&L:</span>
                            <span className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isProfit ? '+' : ''}${data.pnl.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4 pt-1 border-t border-[#1b202e] font-sans">
                            <span className="text-gray-400 font-mono text-[10px] uppercase">Equity:</span>
                            <span className={`font-bold ${data.cumulativePnL >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                              ${data.cumulativePnL.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativePnL"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 4, stroke: '#6366f1', strokeWidth: 1.5, fill: '#0e1118' }}
                  activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Filtering Controls Bar */}
      <div className="bg-[#0e1118] border border-[#1b202e] rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center" id="trade-filter-bar">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Symbol (e.g. EURUSD)"
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value)}
              className="w-full bg-[#090b10] border border-[#1b202e] rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
              id="filter-search-symbol"
            />
          </div>

          {/* Direction Type Select */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:inline">Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-[#090b10] border border-[#1b202e] rounded-lg px-3 py-2 text-xs font-semibold text-gray-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              id="filter-direction-select"
            >
              <option value="ALL">ALL DIRECTIONS</option>
              <option value="BUY">BUY ONLY</option>
              <option value="SELL">SELL ONLY</option>
            </select>
          </div>

          {/* Status Select */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:inline">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-[#090b10] border border-[#1b202e] rounded-lg px-3 py-2 text-xs font-semibold text-gray-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              id="filter-status-select"
            >
              <option value="ALL">ALL STATUSES</option>
              <option value="OPEN">LIVE ONLY</option>
              <option value="CLOSED">CLOSED ONLY</option>
            </select>
          </div>
        </div>

        {/* Dynamic filter count indicator */}
        <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider self-end md:self-auto">
          Found: <span className="text-indigo-400 font-bold">{totalFiltered}</span> trades
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-[#0e1118] border border-[#1b202e] rounded-xl overflow-hidden" id="trade-table-wrapper">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1b202e] bg-[#090b10]">
                <th className="p-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Position ID</th>
                <th className="p-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Asset Symbol</th>
                <th className="p-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Direction</th>
                <th className="p-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Lots (Volume)</th>
                <th className="p-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Entry Price</th>
                <th className="p-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Exit Price</th>
                <th className="p-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Profit / Loss</th>
                <th className="p-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Executed At</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#131722]/50 animate-pulse">
                    <td className="p-4"><div className="h-3.5 bg-[#1b202e] rounded w-16" /></td>
                    <td className="p-4"><div className="h-3.5 bg-[#1b202e] rounded w-20" /></td>
                    <td className="p-4"><div className="h-3.5 bg-[#1b202e] rounded w-12" /></td>
                    <td className="p-4"><div className="h-3.5 bg-[#1b202e] rounded w-10" /></td>
                    <td className="p-4"><div className="h-3.5 bg-[#1b202e] rounded w-16" /></td>
                    <td className="p-4"><div className="h-3.5 bg-[#1b202e] rounded w-16" /></td>
                    <td className="p-4"><div className="h-3.5 bg-[#1b202e] rounded w-14" /></td>
                    <td className="p-4"><div className="h-3.5 bg-[#1b202e] rounded w-14" /></td>
                    <td className="p-4"><div className="h-3.5 bg-[#1b202e] rounded w-24" /></td>
                  </tr>
                ))
              ) : paginatedTrades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-xs text-gray-400 font-mono">
                    <Clock className="w-8 h-8 mx-auto mb-3 text-gray-500 opacity-60" />
                    No logged trade executions match the active filters.
                  </td>
                </tr>
              ) : (
                paginatedTrades.map((trade) => (
                  <tr key={trade.id} className="border-b border-[#1b202e] hover:bg-[#131722]/30 transition text-xs font-mono">
                    <td className="p-4 text-gray-400 font-sans">
                      #{trade.id.slice(0, 8)}
                    </td>
                    <td className="p-4 font-bold text-white">
                      {trade.symbol}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        trade.type === 'BUY' 
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                          : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                      }`}>
                        {trade.type}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300">
                      {trade.volume.toFixed(2)}
                    </td>
                    <td className="p-4 text-gray-300">
                      {trade.entryPrice.toFixed(5)}
                    </td>
                    <td className="p-4 text-gray-300">
                      {trade.status === 'OPEN' ? '—' : trade.exitPrice.toFixed(5)}
                    </td>
                    <td className={`p-4 font-bold ${
                      trade.pnl > 0 
                        ? 'text-emerald-400' 
                        : trade.pnl < 0 
                          ? 'text-rose-400' 
                          : 'text-gray-400'
                    }`}>
                      {trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                    </td>
                    <td className="p-4">
                      {trade.status === 'OPEN' ? (
                        <span className="flex items-center gap-1 text-amber-400 text-[10px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          LIVE POSITION
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400 text-[10px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                          CLOSED
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-400 font-sans">
                      {new Date(trade.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginated Footer Controls */}
        {pages > 1 && (
          <div className="p-4 flex items-center justify-between border-t border-[#1b202e] bg-[#090b10]" id="trade-pagination-footer">
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
              Showing page {currentPage} of {pages} ({totalFiltered} entries)
            </span>
            <div className="flex gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1 || loading}
                className="p-1.5 bg-[#0e1118] border border-[#1b202e] hover:bg-[#151924] disabled:opacity-40 rounded text-gray-400 hover:text-white transition cursor-pointer"
                id="btn-prev-page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === pages || loading}
                className="p-1.5 bg-[#0e1118] border border-[#1b202e] hover:bg-[#151924] disabled:opacity-40 rounded text-gray-400 hover:text-white transition cursor-pointer"
                id="btn-next-page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
