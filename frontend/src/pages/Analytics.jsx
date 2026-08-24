import { API_BASE } from '../config';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart as RechartsLineChart, Line, Legend } from 'recharts';
import { LineChart, Activity, Zap, Clock, CheckCircle2, TrendingUp, TrendingDown, Layers, ArrowRight, ShieldAlert, FileText, Globe, Search, Database, Tag, Code, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Analytics() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API_BASE}/api/analytics`)
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);

  const [activeTab, setActiveTab] = useState('overview');

  if (!data) return <div className="p-8 text-gray-500 animate-pulse">Loading analytics...</div>;

  return (
    <div className="h-full w-full max-w-[1600px] mx-auto flex flex-col bg-[#FAFAFA] overflow-hidden">
      
      {/* Scrollable Container */}
      <div className="flex-1 flex flex-col overflow-y-auto p-6 lg:p-8 space-y-8 custom-scrollbar animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-[14px] bg-[#0f1115] border border-gray-800 flex items-center justify-center shadow-lg">
              <LineChart className="w-7 h-7 text-neon" />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-[32px] font-extrabold text-gray-900 tracking-tight leading-none mb-1.5">
                Analytics
              </h1>
              <p className="text-[15px] font-medium text-gray-500 tracking-wide">
                Understand enrichment performance, data quality and pipeline efficiency.
              </p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex flex-col items-end gap-3.5">
            {/* View Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200/60 shadow-inner">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`px-5 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'overview' ? 'bg-white text-gray-900 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('pipeline')}
                className={`px-5 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'pipeline' ? 'bg-white text-gray-900 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Pipeline Flow
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-500">
            {/* SECTION 1: PERFORMANCE */}
            <section>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                {[
                  { title: "Enrichment Throughput", val: data.performance.throughput.value, trend: data.performance.throughput.trend, icon: Database },
                  { title: "Automation Rate", val: data.performance.automation_rate.value, trend: data.performance.automation_rate.trend, icon: Zap },
                  { title: "Avg Processing Time", val: data.performance.processing_time.value, trend: data.performance.processing_time.trend, icon: Clock, badTrend: true },
                  { title: "Success Rate", val: data.performance.success_rate.value, trend: data.performance.success_rate.trend, icon: CheckCircle2 },
                ].map((kpi, i) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between group hover:border-[#2CFF05] hover:shadow-[0_8px_24px_rgba(44,255,5,0.15)] hover:-translate-y-1 transition-all duration-300">
                    <div className="flex justify-between items-start mb-6">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-gray-900 transition-colors">{kpi.title}</p>
                      <kpi.icon className="w-4 h-4 text-gray-400 group-hover:text-[#2CFF05] transition-colors" />
                    </div>
                    <p className="text-[32px] font-extrabold text-gray-900 mb-4 leading-none tracking-tight">{kpi.val}</p>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-neon">
                      {kpi.trend}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 3: QUALITY */}
            <section>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0 relative z-10">
                <div className="lg:col-span-2 bg-[#0f1115] border border-gray-800 rounded-2xl p-8 shadow-2xl flex flex-col min-h-[360px]">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-[11px] font-bold text-white uppercase tracking-widest">Quality Trends</h3>
                  </div>
                  <div className="flex-1 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={data.quality_trends} margin={{ top: 5, right: 20, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} dy={15} />
                        <YAxis domain={[80, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#111827', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', color: '#fff', fontSize: '12px' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '30px' }} />
                        <Line type="monotone" dataKey="completeness" name="Completeness" stroke="#00d4ff" strokeWidth={3} dot={{ r: 4.5, fill: '#0f1115', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="accuracy" name="Accuracy" stroke="#2CFF05" strokeWidth={3} dot={{ r: 4.5, fill: '#0f1115', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="lov" name="LOV Compliance" stroke="#9ca3af" strokeWidth={3} dot={{ r: 4.5, fill: '#0f1115', strokeWidth: 2 }} activeDot={{ r: 6 }} strokeDasharray="5 5" />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Right: Confidence Donut/List */}
                <div className="lg:col-span-1 bg-[#0f1115] border border-gray-800 rounded-2xl p-8 shadow-2xl flex flex-col min-h-[360px]">
                  <h3 className="text-[11px] font-bold text-white uppercase tracking-widest mb-8">Confidence Distribution</h3>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="h-44 w-full relative mb-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.confidence_distribution}
                            cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="count" stroke="none"
                          >
                            {data.confidence_distribution.map((entry, index) => {
                              const pieColor = entry.name === '90-100%' ? '#2CFF05' : entry.name === '70-90%' ? '#facc15' : '#ef4444';
                              return <Cell key={`cell-${index}`} fill={pieColor} />
                            })}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#111827', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }} itemStyle={{ color: '#fff', fontWeight: 600 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Center Text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                        <span className="text-[26px] font-extrabold text-white tracking-tight">
                          {data.confidence_distribution?.length > 0 ? Number(data.confidence_distribution[0].count).toFixed(1) : 0}%
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">HIGH</span>
                      </div>
                    </div>
                    {/* Custom Legend / List */}
                    <div className="space-y-4 px-2">
                      {data.confidence_distribution.map((band, i) => {
                        const pieColor = band.name === '90-100%' ? '#2CFF05' : band.name === '70-90%' ? '#facc15' : '#ef4444';
                        return (
                          <div key={i} className="flex justify-between items-center text-[12px] font-bold">
                            <div className="flex items-center gap-3">
                              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: pieColor }} />
                              <span className="text-gray-400">{band.name}</span>
                            </div>
                            <span className="text-white">{Number(band.count).toFixed(1)}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>


          </div>
        )}

        {activeTab === 'pipeline' && (
          <div className="flex-1 flex flex-col space-y-4 animate-in slide-in-from-left-4 fade-in duration-500">
            {/* NEW LIGHT-MODE IMMERSIVE PIPELINE FUNNEL */}
            <section>
              <div className="bg-[#f2fceb] border border-[#2CFF05]/20 rounded-2xl p-6 shadow-[0_4px_24px_rgba(44,255,5,0.05)] relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#2CFF05]/10 rounded-full blur-[100px] pointer-events-none -mt-32 -mr-32" />
                 
                 <div className="flex items-center justify-between w-full gap-2 relative z-10">
                   {data.funnel.map((stage, i) => (
                     <React.Fragment key={i}>
                       <div className="flex flex-col flex-1 relative group cursor-default">
                         {/* Elaborate Light Stage Card */}
                         <div className={`relative w-full py-6 px-3 flex flex-col items-center justify-center rounded-xl border transition-all duration-300 hover:border-[#2CFF05] hover:shadow-[0_0_20px_rgba(44,255,5,0.4)] hover:-translate-y-1 ${i === data.funnel.length - 1 ? 'bg-white border-[#2CFF05]/60 shadow-[0_8px_24px_rgba(44,255,5,0.1)] border-t-[3px] border-t-[#2CFF05]' : 'bg-white border-[#2CFF05]/10 shadow-sm hover:bg-white'}`}>
                           
                           {/* Glow Effect on Hover for non-final stages */}
                           {i !== data.funnel.length - 1 && (
                             <div className="absolute inset-0 bg-[#2CFF05]/[0.02] opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
                           )}

                           <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-4 text-center ${i === data.funnel.length - 1 ? 'text-[#2CFF05]' : 'text-gray-500'}`}>{stage.stage}</h3>
                           <p className={`text-[28px] font-extrabold tracking-tight mb-4 leading-none ${i === data.funnel.length - 1 ? 'text-gray-900 drop-shadow-[0_2px_10px_rgba(44,255,5,0.3)]' : 'text-gray-900'}`}>
                             {data.funnel?.length > 0 ? data.funnel[data.funnel.length - 1].count.toLocaleString() : 0}
                           </p>
                           
                           {/* Percentage Badge */}
                           <div className={`border rounded-full px-3 py-1 flex items-center justify-center transition-colors ${i === data.funnel.length - 1 ? 'bg-[#2CFF05]/10 border-[#2CFF05]/30 shadow-[0_0_10px_rgba(44,255,5,0.1)]' : 'bg-[#f2fceb] border-[#2CFF05]/20 group-hover:border-[#2CFF05]/50 group-hover:bg-[#2CFF05]/10'}`}>
                             <span className={`text-[10px] font-bold ${i === data.funnel.length - 1 ? 'text-[#2CFF05]' : 'text-gray-500 group-hover:text-gray-700'}`}>100.0%</span>
                           </div>
                         </div>
                       </div>
                       
                       {/* Sleek Connector */}
                       {i < data.funnel.length - 1 && (
                         <div className="flex-shrink-0 w-4 flex justify-center items-center relative">
                           <div className="absolute w-full h-[1px] bg-gradient-to-r from-[#2CFF05]/20 via-[#2CFF05]/60 to-[#2CFF05]/20" />
                           <ArrowRight className="w-3 h-3 text-[#2CFF05] relative z-10 bg-[#f2fceb]" />
                         </div>
                       )}
                     </React.Fragment>
                   ))}
                 </div>
              </div>
            </section>

            {/* PIPELINE DIAGNOSTICS (Latency & Drop-offs) */}
            <section className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[360px]">
              
              {/* Latency Bottlenecks */}
              <div className="bg-[#0f1115] border border-[#1c1f26] rounded-2xl p-6 shadow-2xl flex flex-col relative overflow-hidden group h-full">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-6 relative z-10">
                  <h3 className="text-[13px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#2CFF05]" /> Latency Bottlenecks
                  </h3>
                  <button className="text-[12px] font-semibold text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                    View Details <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                
                {/* Content */}
                <div className="flex-1 flex flex-col justify-center gap-6 pt-4 pb-2">
                  
                  <div className="flex items-center justify-between gap-6 px-4 w-full">
                    {/* Donut Chart */}
                    <div className="relative w-[150px] h-[150px] flex-shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.stage_times.map(st => {
                              const s = st.stage.toUpperCase();
                              let c = '#ffffff';
                              if (s.includes('ENRICH')) c = '#2CFF05';
                              else if (s.includes('CLASS')) c = '#facc15';
                              else if (s.includes('VALID')) c = '#00d4ff';
                              else if (s.includes('PARS')) c = '#a855f7';
                              return { name: st.stage, value: parseFloat(st.time) || 0, color: c };
                            })}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={70}
                            stroke="none"
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                            paddingAngle={3}
                          >
                            {
                              data.stage_times.map((entry, index) => {
                                const s = entry.stage.toUpperCase();
                                let c = '#ffffff';
                                if (s.includes('ENRICH')) c = '#2CFF05';
                                else if (s.includes('CLASS')) c = '#facc15';
                                else if (s.includes('VALID')) c = '#00d4ff';
                                else if (s.includes('PARS')) c = '#a855f7';
                                return <Cell key={`cell-${index}`} fill={c} />
                              })
                            }
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                        <span className="text-[22px] font-black text-white tracking-tight leading-none drop-shadow-md">{data.performance.processing_time.value}</span>
                        <span className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">Total Avg</span>
                      </div>
                    </div>

                    {/* Stage List */}
                    <div className="flex-1 flex flex-col gap-4 w-full min-w-0">
                      {data.stage_times.map((item, i) => {
                        const s = item.stage.toUpperCase();
                        let color = '#ffffff';
                        if (s.includes('ENRICH')) color = '#2CFF05';
                        else if (s.includes('CLASS')) color = '#facc15';
                        else if (s.includes('VALID')) color = '#00d4ff';
                        else if (s.includes('PARS')) color = '#a855f7';
                        
                        const iconMap = {'ENRICHED': Layers, 'CLASSIFIED': Tag, 'VALIDATED': CheckCircle2, 'PARSING': Code};
                        let IconComponent = Layers;
                        if (s.includes('CLASS')) IconComponent = Tag;
                        if (s.includes('VALID')) IconComponent = CheckCircle2;
                        if (s.includes('PARS')) IconComponent = Code;

                        const totalTimeParsed = data.stage_times.reduce((acc, curr) => acc + (parseFloat(curr.time) || 0), 0);
                        const percent = totalTimeParsed > 0 ? `${((parseFloat(item.time) || 0) / totalTimeParsed * 100).toFixed(1)}%` : '0%';
                        
                        return (
                        <div key={i} className="flex items-center gap-4 py-1.5 w-full">
                          {/* Icon Box */}
                          <div 
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }} 
                          >
                            <IconComponent className="w-4 h-4" style={{ color: color }} />
                          </div>
                          
                          {/* Content Block */}
                          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                            {/* Text Row */}
                            <div className="flex justify-between items-center w-full">
                              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate mr-2">{item.stage}</span>
                              <span className="text-[13px] font-black tracking-tight shrink-0" style={{ color: color }}>{item.time}</span>
                            </div>
                            
                            {/* Sharp Progress Bar */}
                            <div className="w-full bg-[#1c1f26] h-1.5 rounded-full relative overflow-hidden">
                              <div 
                                className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000"
                                style={{ 
                                  width: percent,
                                  backgroundColor: color,
                                  boxShadow: `0 0 8px ${color}80` 
                                }} 
                              />
                            </div>
                          </div>
                        </div>
                      )})}
                    </div>
                  </div>
                </div>
                  
                </div>
              {/* Source Discovery */}
              <div className="bg-[#0f1115] border border-[#1c1f26] rounded-2xl p-6 shadow-2xl flex flex-col relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00d4ff]/5 rounded-full blur-2xl pointer-events-none -mt-10 -mr-10" />
                <div className="flex justify-between items-center mb-6 relative z-10">
                  <h3 className="text-[13px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Database className="w-5 h-5 text-[#00d4ff]" /> Source Discovery
                  </h3>
                </div>
                
                <div className="flex-1 flex flex-col justify-center gap-6 relative z-10">
                  <div className="flex justify-between items-center bg-gradient-to-r from-[#16191f] to-[#121419] p-5 rounded-xl border border-[#1c1f26]">
                     <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Discovered</span>
                        <span className="text-3xl font-black text-white">9</span>
                     </div>
                     <div className="h-12 w-[1px] bg-gray-800" />
                     <div className="flex flex-col gap-1 items-end">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Verified Sources</span>
                        <span className="text-3xl font-black text-[#2CFF05]">9</span>
                     </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    {/* Manufacturer Websites */}
                    <div className="flex items-center gap-4 w-full group">
                      <div className="w-10 h-10 rounded-xl bg-[#00d4ff]/10 flex items-center justify-center border border-[#00d4ff]/20 transition-colors group-hover:bg-[#00d4ff]/20">
                        <Globe className="w-4 h-4 text-[#00d4ff]" />
                      </div>
                      <div className="flex-1 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[13px] font-bold text-gray-300">Manufacturer Websites</span>
                          <span className="text-[13px] font-black text-[#00d4ff]">67%</span>
                        </div>
                        <div className="w-full bg-[#1c1f26] h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-[#00d4ff] rounded-full shadow-[0_0_8px_rgba(0,212,255,0.6)]" style={{ width: '67%' }} />
                        </div>
                      </div>
                    </div>

                    {/* Product Manuals */}
                    <div className="flex items-center gap-4 w-full group">
                      <div className="w-10 h-10 rounded-xl bg-[#facc15]/10 flex items-center justify-center border border-[#facc15]/20 transition-colors group-hover:bg-[#facc15]/20">
                        <FileText className="w-4 h-4 text-[#facc15]" />
                      </div>
                      <div className="flex-1 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[13px] font-bold text-gray-300">Product Manuals</span>
                          <span className="text-[13px] font-black text-[#facc15]">33%</span>
                        </div>
                        <div className="w-full bg-[#1c1f26] h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-[#facc15] rounded-full shadow-[0_0_8px_rgba(250,204,21,0.6)]" style={{ width: '33%' }} />
                        </div>
                      </div>
                    </div>

                    {/* Technical PDFs */}
                    <div className="flex items-center gap-4 w-full group">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 transition-colors group-hover:bg-white/10">
                        <FileText className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[13px] font-bold text-gray-500">Technical PDFs</span>
                          <span className="text-[13px] font-black text-gray-500">0%</span>
                        </div>
                        <div className="w-full bg-[#1c1f26] h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-gray-600 rounded-full" style={{ width: '0%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}


      </div>
    </div>
  );
}

export default Analytics;
