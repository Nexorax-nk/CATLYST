import { API_BASE } from '../config';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle2, Circle, ArrowRight, Layers, Tag, Shield, Link as LinkIcon, Database, Zap, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = () => {
      axios.get(`${API_BASE}/api/dashboard`)
        .then(res => {
          setStats(res.data);
          setError(false);
        })
        .catch(err => {
          console.error(err);
          setError(err.message || "Failed to connect");
        });
    };
    
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return (
    <div className="p-8 flex flex-col items-center justify-center h-full gap-3">
      <div className={`text-sm font-semibold ${error ? 'text-red-500' : 'text-gray-500'}`}>
        {error ? `Failed to connect: ${error}` : 'Loading metrics...'}
      </div>
    </div>
  );

  return (
    <div className="h-full w-full max-w-[1600px] mx-auto flex flex-col p-6 lg:p-8 gap-5 lg:gap-6 animate-in fade-in duration-500 overflow-hidden">

      {/* Header - Fixed Height */}
      <div className="shrink-0 flex justify-between items-end mb-1">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#0f1115] border border-gray-800 flex items-center justify-center shadow-lg">
            <Database className="w-6 h-6 text-neon" />
          </div>
          <div className="flex flex-col justify-center gap-0.5">
            <h1 className="text-[28px] lg:text-[32px] font-bold text-gray-900 tracking-tight leading-none flex items-center gap-3">
              Operations
              <div className="relative flex items-center justify-center ml-1">
                <div className="absolute inset-0 bg-neon/10 blur-sm rounded-full pointer-events-none" />
                <span className="relative flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-b from-[#16181d] to-[#0a0b0e] border border-gray-800 text-[10px] lg:text-[11px] font-bold text-gray-100 uppercase tracking-[0.2em] shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-neon shadow-[0_0_8px_rgba(44,255,5,0.9)]"></span>
                  </span>
                  Live
                </span>
              </div>
            </h1>
            <p className="text-[14px] lg:text-[15px] font-medium text-gray-500 tracking-wide mt-1">
              Monitor your catalog, enrichment and quality operations.
            </p>
          </div>
        </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.open(`${API_BASE}/api/export?format=csv`, '_blank')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2.5 shadow-sm hover:shadow transition-all mb-1"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={() => window.open(`${API_BASE}/api/export?format=excel`, '_blank')}
              className="bg-green-100 hover:bg-green-200 text-green-800 px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2.5 shadow-sm hover:shadow transition-all mb-1"
            >
              <Download className="w-4 h-4" /> Export Excel
            </button>
            <button
              onClick={() => navigate('/enrichment')}
              className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2.5 shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-all mb-1"
            >
              <Zap className="w-4 h-4 text-neon" /> New Enrichment
            </button>
          </div>
      </div>

      {/* TOP ROW: 4 KPI Cards - Fixed Height */}
      <div className="shrink-0 grid grid-cols-1 md:grid-cols-4 gap-5 lg:gap-6">

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col justify-between cursor-pointer hover:border-neon transition-colors" onClick={() => navigate('/catalog')}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Products</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{stats.products.value.toLocaleString()}</p>
          <div className="flex items-center gap-1 text-xs font-medium text-neon">
            <TrendingUp className="w-4 h-4 text-neon" /> {stats.products.trend}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col justify-between cursor-pointer hover:border-neon transition-colors" onClick={() => navigate('/jobs')}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Processing</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{stats.processing.value}</p>
          <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
            {stats.processing.trend}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col justify-between cursor-pointer hover:border-neon transition-colors" onClick={() => navigate('/validation')}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Needs Review</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{stats.review.value.toLocaleString()}</p>
          <div className="flex items-center gap-1 text-xs font-medium text-neon bg-neon/10 px-2 py-0.5 rounded border border-neon self-start">
            {stats.review.trend}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col justify-between cursor-pointer hover:border-neon transition-colors" onClick={() => navigate('/analytics')}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Catalog Health</p>
          <p className="text-3xl font-bold text-neon mb-2">{stats.health.value}</p>
          <div className="flex items-center gap-1 text-xs font-medium text-neon">
            {stats.health.trend}
          </div>
        </div>

      </div>

      {/* MIDDLE ROW: Activity & Health - Fluid Height */}
      <div className="flex-[1.4] min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-3">

        {/* Processing Activity */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 lg:p-6 shadow-sm flex flex-col min-h-0">
          <h2 className="shrink-0 text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">Processing Activity</h2>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chart_data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <filter id="neonGlow" height="300%" width="300%" x="-100%" y="-100%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#2CFF05" floodOpacity="0.4" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} />
                <RechartsTooltip 
                  cursor={{ stroke: '#2CFF05', strokeWidth: 1.5, strokeDasharray: '4 4', opacity: 0.4 }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 8px 20px rgba(0,0,0,0.08)', fontSize: '13px', fontWeight: 'bold', color: '#111827' }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="processed" 
                  stroke="#2CFF05" 
                  strokeWidth={3} 
                  fill="#2CFF05" 
                  fillOpacity={0.15} 
                  style={{ filter: 'url(#neonGlow)' }}
                  activeDot={{ r: 6, fill: "#2CFF05", stroke: "#ffffff", strokeWidth: 2, style: { filter: 'drop-shadow(0px 0px 4px rgba(44,255,5,0.8))' } }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quality Overview (Catalog Health) */}
        <div className="bg-gradient-to-b from-[#111318] to-[#0a0b0e] border border-gray-800 rounded-lg p-4 lg:p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] flex flex-col h-full w-full relative overflow-hidden">
          {/* Subtle decorative background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-neon/5 rounded-full blur-3xl pointer-events-none" />

          <div className="shrink-0 flex justify-between items-center mb-3 lg:mb-4 relative z-10">
            <h2 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-2">
              Quality Overview
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon"></span>
              </span>
            </h2>
            <button className="text-[11px] text-gray-400 font-medium hover:text-white flex items-center gap-1 transition-colors px-2 py-1 bg-gray-800/50 rounded-md border border-gray-700/50">
              View Report <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 w-full h-full grid grid-cols-2 grid-rows-3 gap-4 lg:gap-5 min-h-0 relative z-10">
            {stats.quality_overview.map((metric, i) => {
              const Icon = { Layers, Tag, Shield, LinkIcon, CheckCircle2, Database }[metric.iconName] || Layers;
              const radius = 15.91549430918954;
              const strokeDashoffset = 100 - metric.val;

              let status = { text: 'Healthy', dot: 'bg-neon', shadow: 'rgba(44,255,5,0.6)', textCol: 'text-gray-200' };
              if (metric.val >= 98) status = { text: 'Excellent', dot: 'bg-neon', shadow: 'rgba(44,255,5,0.8)', textCol: 'text-white font-medium' };
              else if (metric.val < 95) status = { text: 'Fair', dot: 'bg-yellow-400', shadow: 'rgba(250,204,21,0.6)', textCol: 'text-gray-400' };

              return (
                <div key={i} className="p-4 lg:p-5 flex items-center gap-4 lg:gap-5 min-h-0 hover:bg-white/[0.03] rounded-xl transition-all group cursor-default">

                  {/* Circle Gauge */}
                  <div className="relative flex items-center justify-center shrink-0 w-11 h-11 lg:w-12 lg:h-12">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                      <circle cx="18" cy="18" r={radius} stroke="currentColor" strokeWidth="1.8" fill="transparent" className="text-[#1c1f26]" />
                      <circle
                        cx="18" cy="18" r={radius}
                        stroke="currentColor" strokeWidth="1.8" fill="transparent"
                        strokeDasharray="100" strokeDashoffset={strokeDashoffset} strokeLinecap="round"
                        className={metric.col}
                        style={{
                          transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                          filter: 'drop-shadow(0 0 3px rgba(44,255,5,0.4))'
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-white opacity-90 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  </div>

                  {/* Text Content */}
                  <div className="flex flex-col flex-1 min-w-0 justify-center">
                    <span className="text-[9px] lg:text-[10px] font-semibold text-gray-400 tracking-wider uppercase mb-1 truncate">
                      {metric.t1} {metric.t2}
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] lg:text-[15px] font-bold text-white leading-none tracking-tight">
                        {metric.val}%
                      </span>
                      <span className={`flex items-center gap-1.5 text-[9px] px-1.5 py-0.5 rounded font-medium bg-gray-900/80 border border-gray-700/50 ${status.textCol}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} style={{ boxShadow: `0 0 6px ${status.shadow}` }} />
                        {status.text}
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* BOTTOM ROW: Jobs & Attention - Fluid Height */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-3">

        {/* Recent Jobs */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col min-h-0">
          <div className="shrink-0 p-4 lg:p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Recent Processing</h2>
            <button className="text-[11px] lg:text-xs text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-1 transition-colors">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full text-left text-[11px] lg:text-xs whitespace-nowrap">
              <thead className="bg-white sticky top-0 z-10">
                <tr className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">
                  <th className="px-4 lg:px-5 py-3.5 border-b border-gray-100">Job</th>
                  <th className="px-4 lg:px-5 py-3.5 border-b border-gray-100">File</th>
                  <th className="px-4 lg:px-5 py-3.5 border-b border-gray-100">Progress</th>
                  <th className="px-4 lg:px-5 py-3.5 border-b border-gray-100">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recent_jobs.map((job, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 lg:px-5 py-3.5 font-medium text-gray-900">{job.id}</td>
                    <td className="px-4 lg:px-5 py-3.5 text-gray-600 font-medium">{job.file}</td>
                    <td className="px-4 lg:px-5 py-3.5 text-gray-600 font-medium">{job.progress}</td>
                    <td className="px-4 lg:px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md bg-gray-900 text-white shadow-sm">
                        {job.status === 'Complete' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-neon" />
                        ) : job.status === 'Failed' ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.8)]" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse shadow-[0_0_6px_rgba(44,255,5,0.8)]" />
                        )}
                        {job.status === 'Failed' ? 'INTERRUPTED' : job.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Needs Attention */}
        <div className="bg-gradient-to-b from-[#111318] to-[#0a0b0e] border border-gray-800 rounded-lg p-4 lg:p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] flex flex-col min-h-0 relative overflow-hidden">
          {/* Subtle emerald background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-neon/5 rounded-full blur-3xl pointer-events-none" />

          <h2 className="shrink-0 text-sm font-bold text-white tracking-widest uppercase mb-3 lg:mb-4 flex items-center gap-2 relative z-10">
            <AlertTriangle className="w-4 h-4 text-neon" />
            Needs Attention
          </h2>

          <div className="flex-1 overflow-y-auto min-h-0 space-y-2 lg:space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] relative z-10">
            {stats.needs_attention.map((alert, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 lg:py-3 px-2 lg:px-3 hover:bg-white/[0.03] rounded-lg transition-all group cursor-default">
                <div className="flex items-center gap-3.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-neon shadow-[0_0_8px_rgba(44,255,5,0.6)] animate-pulse" />
                  <span className="text-[12px] lg:text-[13px] font-semibold text-gray-300 group-hover:text-white transition-colors">{alert.label}</span>
                </div>
                <button 
                  onClick={() => navigate('/catalog')}
                  className="text-[9px] lg:text-[10px] bg-white text-black hover:bg-gray-200 font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all px-3 py-1.5 rounded-full shadow-sm hover:scale-105 active:scale-95">
                  Review <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
