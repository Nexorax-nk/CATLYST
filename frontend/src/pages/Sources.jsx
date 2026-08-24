import { API_BASE } from '../config';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, Plus, Globe, Layers, Link as LinkIcon, FileText, CheckCircle2, AlertCircle, RefreshCw, MoreVertical } from 'lucide-react';

const ICON_MAP = {
  Globe: Globe,
  LinkIcon: LinkIcon,
  FileText: FileText,
  Layers: Layers
};

function Sources() {
  const [sources, setSources] = useState([]);

  useEffect(() => {
    axios.get(`${API_BASE}/api/sources`)
      .then(res => setSources(res.data))
      .catch(err => console.error(err));
  }, []);

  const activeCount = sources.length;
  const uniqueDomains = sources.length;
  const totalFetches = sources.reduce((acc, curr) => acc + parseInt(curr.items.replace(',', '') || 0), 0);

  return (
    <div className="h-full w-full max-w-[1600px] mx-auto flex flex-col bg-[#FAFAFA] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 custom-scrollbar animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-[14px] bg-[#0f1115] border border-gray-800 flex items-center justify-center shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-[#00d4ff]/20 blur-xl group-hover:bg-[#00d4ff]/40 transition-all duration-500" />
              <Database className="w-7 h-7 text-[#00d4ff] relative z-10" />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-[32px] font-extrabold text-gray-900 tracking-tight leading-none mb-1.5">
                Data Sources
              </h1>
              <p className="text-[15px] font-medium text-gray-500 tracking-wide">
                Manage and monitor the origins of your enriched product data.
              </p>
            </div>
          </div>
          
          <button className="bg-[#0f1115] hover:bg-black text-white px-6 py-2.5 rounded-xl text-[13px] font-bold shadow-[0_4px_14px_rgba(0,0,0,0.2)] transition-all flex items-center gap-2 group border border-gray-800 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00d4ff]/10 to-[#2CFF05]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Plus className="w-4 h-4 text-[#00d4ff] group-hover:rotate-90 transition-transform duration-300 relative z-10" />
            <span className="relative z-10">Add Source</span>
          </button>
        </div>

        {/* Global Health KPIs */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-[#0f1115] border border-[#1c1f26] rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-[#00d4ff]/50 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00d4ff]/5 rounded-full blur-2xl pointer-events-none -mt-10 -mr-10 group-hover:bg-[#00d4ff]/10 transition-colors" />
            <div className="flex justify-between items-start mb-6 relative z-10">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Active Sources</p>
              <Globe className="w-5 h-5 text-[#00d4ff]" />
            </div>
            <p className="text-[36px] font-black text-white tracking-tight leading-none mb-2 relative z-10">{activeCount}</p>
            <p className="text-[12px] font-bold text-[#2CFF05] flex items-center gap-1.5 relative z-10">
              <CheckCircle2 className="w-3.5 h-3.5" /> All systems operational
            </p>
          </div>

          <div className="bg-[#0f1115] border border-[#1c1f26] rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-[#2CFF05]/50 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#2CFF05]/5 rounded-full blur-2xl pointer-events-none -mt-10 -mr-10 group-hover:bg-[#2CFF05]/10 transition-colors" />
            <div className="flex justify-between items-start mb-6 relative z-10">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Unique Domains</p>
              <LinkIcon className="w-5 h-5 text-[#2CFF05]" />
            </div>
            <p className="text-[36px] font-black text-white tracking-tight leading-none mb-2 relative z-10">{uniqueDomains}</p>
            <p className="text-[12px] font-bold text-gray-500 relative z-10">Cross-referenced web origins</p>
          </div>

          <div className="bg-[#0f1115] border border-[#1c1f26] rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-[#facc15]/50 transition-colors">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#facc15]/5 rounded-full blur-2xl pointer-events-none -mt-10 -mr-10 group-hover:bg-[#facc15]/10 transition-colors" />
            <div className="flex justify-between items-start mb-6 relative z-10">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Total Fetches</p>
              <FileText className="w-5 h-5 text-[#facc15]" />
            </div>
            <p className="text-[36px] font-black text-white tracking-tight leading-none mb-2 relative z-10">{totalFetches}</p>
            <p className="text-[12px] font-bold text-[#facc15] flex items-center gap-1.5 relative z-10">
              Successfully aggregated
            </p>
          </div>
        </section>

        {/* Sources Data Grid */}
        <section className="bg-white border border-gray-200 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
            <h3 className="text-[14px] font-bold text-gray-900 uppercase tracking-widest">Configured Sources</h3>
            <div className="flex gap-2">
               <button className="px-4 py-1.5 rounded-lg border border-gray-200 text-[12px] font-bold text-gray-600 hover:bg-gray-50 transition-colors">Filter</button>
               <button className="px-4 py-1.5 rounded-lg border border-gray-200 text-[12px] font-bold text-gray-600 hover:bg-gray-50 transition-colors">Sort</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-gray-50/50">
                <tr className="text-gray-400 text-[11px] uppercase tracking-widest font-bold">
                  <th className="px-8 py-4 border-b border-gray-100">Source Name</th>
                  <th className="px-8 py-4 border-b border-gray-100">Type</th>
                  <th className="px-8 py-4 border-b border-gray-100">Status</th>
                  <th className="px-8 py-4 border-b border-gray-100">Items Enriched</th>
                  <th className="px-8 py-4 border-b border-gray-100">Last Sync</th>
                  <th className="px-8 py-4 border-b border-gray-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sources.map((src, i) => {
                  const Icon = ICON_MAP[src.icon] || Globe;
                  return (
                  <tr key={i} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm border border-gray-200/50 transition-all">
                          <Icon className="w-5 h-5" style={{ color: src.color }} />
                        </div>
                        <span className="text-[14px] font-bold text-gray-900">{src.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[13px] font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-md">{src.type}</span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        {src.status === 'Active' && <span className="w-2 h-2 rounded-full bg-[#2CFF05] shadow-[0_0_8px_rgba(44,255,5,0.8)]" />}
                        {src.status === 'Syncing' && <span className="w-2 h-2 rounded-full bg-[#facc15] shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse" />}
                        {src.status === 'Error' && <span className="w-2 h-2 rounded-full bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.8)]" />}
                        <span className={`text-[13px] font-bold ${src.status === 'Active' ? 'text-gray-900' : src.status === 'Syncing' ? 'text-[#facc15]' : 'text-[#ef4444]'}`}>
                          {src.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-[14px] font-bold text-gray-900">{src.items}</td>
                    <td className="px-8 py-5 text-[13px] font-medium text-gray-500">{src.lastSync}</td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}

export default Sources;
