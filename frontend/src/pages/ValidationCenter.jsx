import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Check, X, Search, Filter, List, Activity, Radar, ChevronLeft, ChevronRight, ChevronDown, CheckCircle2 } from 'lucide-react';

function ValidationCenter() {
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  
  useEffect(() => {
    fetchValidationQueue();
  }, []);
  
  const fetchValidationQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8080/api/validation/queue");
      const data = await res.json();
      setConflicts(data);
      if (data.length > 0) setActiveId(data[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id, attribute_key, corrected_value) => {
    try {
      await fetch(`http://127.0.0.1:8080/api/validation/${id}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attribute_key, corrected_value })
      });
      removeConflict(id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (id) => {
    try {
      await fetch(`http://127.0.0.1:8080/api/validation/${id}/reject`, { method: "POST" });
      removeConflict(id);
    } catch (e) {
      console.error(e);
    }
  };

  const removeConflict = (id) => {
    setConflicts(prev => {
      const next = prev.filter(c => c.id !== id);
      if (activeId === id) setActiveId(next[0]?.id || null);
      return next;
    });
  };

  const activeItem = conflicts.find(c => c.id === activeId) || conflicts[0];

  return (
    <div className="h-full w-full max-w-[1600px] mx-auto flex flex-col p-6 lg:p-8 gap-5 lg:gap-6 animate-in fade-in duration-500 overflow-hidden">
      
      {/* Header - Fixed Height */}
      <div className="shrink-0 flex justify-between items-end mb-1">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f1115] flex items-center justify-center border border-gray-800 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-neon" />
            </div>
            <h1 className="text-[28px] font-bold text-gray-900 tracking-tight leading-none flex items-center gap-3">
              Validation Center
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-700 uppercase tracking-widest shadow-sm relative top-0.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                </span>
                {conflicts.length} Pending
              </span>
            </h1>
          </div>
          <p className="text-[13px] text-gray-500 font-medium ml-1">
            Human-in-the-loop review for low confidence extractions and LOV conflicts.
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6">
        
        {/* Sidebar Feed */}
        <div className="col-span-1 bg-[#0f1115] border border-gray-800/80 rounded-xl shadow-lg overflow-hidden flex flex-col min-h-0">
          
          <div className="p-4 border-b border-gray-800/40 shrink-0 flex flex-col gap-4">
            <div className="flex gap-3 items-center">
              <div className="relative group flex-1">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-gray-300 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search validation queue..." 
                  className="w-full bg-[#16181d] border border-gray-800/60 pl-9 pr-4 py-2.5 text-[13px] font-medium text-gray-200 rounded-lg focus:outline-none focus:border-gray-600 transition-all placeholder:text-gray-500" 
                />
              </div>
              <button className="w-10 h-10 bg-[#16181d] border border-gray-800/60 flex items-center justify-center rounded-lg hover:bg-gray-800 transition-colors">
                <Filter className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap pb-1">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#16181d] border border-green-500/30 rounded-full cursor-pointer shrink-0">
                <span className="text-[12px] font-bold text-white">All</span>
                <span className="text-[10px] font-bold text-[#23cc04] bg-[#152e18] px-1.5 py-0.5 rounded-full">{conflicts.length}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-transparent border border-transparent hover:bg-[#16181d] rounded-full cursor-pointer shrink-0 transition-colors">
                <span className="text-[12px] font-medium text-gray-400">LOV Conflict</span>
                <span className="text-[10px] font-bold text-gray-500 bg-gray-800/50 px-1.5 py-0.5 rounded-full">1</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-transparent border border-transparent hover:bg-[#16181d] rounded-full cursor-pointer shrink-0 transition-colors">
                <span className="text-[12px] font-medium text-gray-400">Low Confidence</span>
                <span className="text-[10px] font-bold text-gray-500 bg-gray-800/50 px-1.5 py-0.5 rounded-full">1</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-transparent border border-transparent hover:bg-[#16181d] rounded-full cursor-pointer shrink-0 transition-colors">
                <span className="text-[12px] font-medium text-gray-400">UOM</span>
              </div>
            </div>
          </div>
          

          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {conflicts.length === 0 && !loading && (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                <CheckCircle2 className="w-8 h-8 text-green-500/50 mb-3" />
                <p className="text-sm font-medium">Queue is empty</p>
                <p className="text-xs mt-1">All items validated.</p>
              </div>
            )}
            {loading && (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm font-medium animate-pulse">Loading queue...</p>
              </div>
            )}
            {conflicts.map((c, i) => {
              const isActive = activeId === c.id;
              
              let iconBg = '';
              let iconColor = '';
              let Icon = null;
              let severityBg = '';
              let severityText = '';
              let severityLabel = '';
              let barColor = '';
              let barBgColor = '';
              let scoreColor = '';
              let issueType = '';
              
              if (c.issue.includes("LOV")) {
                iconBg = 'bg-[#152e18]';
                iconColor = 'text-[#23cc04]';
                Icon = ShieldCheck;
                severityBg = 'bg-[#d4a82c]';
                severityText = 'text-[#0f1115]';
                severityLabel = 'HIGH';
                barColor = 'bg-[#23cc04]';
                barBgColor = 'bg-[#152e18]';
                scoreColor = 'text-[#23cc04]';
                issueType = 'LOV CONFLICT';
              } else if (c.issue.includes("Low Confidence")) {
                iconBg = 'bg-[#3b1d0a]';
                iconColor = 'text-[#f97316]';
                Icon = Activity;
                severityBg = 'bg-transparent';
                severityText = 'text-[#eab308]';
                severityLabel = 'MEDIUM';
                barColor = 'bg-[#f97316]';
                barBgColor = 'bg-[#22242a]';
                scoreColor = 'text-[#f97316]';
                issueType = 'LOW CONFIDENCE';
              } else {
                iconBg = 'bg-[#3a131a]';
                iconColor = 'text-[#ef4444]';
                Icon = Radar;
                severityBg = 'bg-transparent';
                severityText = 'text-[#eab308]';
                severityLabel = 'MEDIUM';
                barColor = 'bg-[#ef4444]';
                barBgColor = 'bg-[#22242a]';
                scoreColor = 'text-[#ef4444]';
                issueType = 'UOM MISMATCH';
              }

              return (
                <div key={i} onClick={() => setActiveId(c.id)} className={`p-5 cursor-pointer transition-all relative border-b border-gray-800/40 last:border-0 ${isActive ? 'bg-[#14161b] border-t border-r border-[#23cc04] border-l-[3px] border-l-[#23cc04] shadow-sm' : 'hover:bg-[#16181d] bg-transparent border-l-[3px] border-l-transparent'}`}>
                  
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex justify-between items-start mb-1.5">
                        <span className={`text-[10px] font-bold tracking-widest uppercase ${iconColor}`}>
                          {issueType}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${severityBg} ${severityText}`}>
                          {severityLabel}
                        </span>
                      </div>
                      
                      <h3 className="text-[14px] font-bold text-white leading-tight mb-3 truncate">
                        {c.title}
                      </h3>
                      
                      <div className="flex justify-between items-end">
                        <div className="text-[11px] font-medium text-gray-500">
                          {c.id}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[12px] font-bold ${scoreColor}`}>{Number(c.confidence).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          

        </div>

        {/* Detail View */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col min-h-0 relative">
          {activeItem ? (
          <>
            <div className="p-6 lg:p-7 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
              <div className="flex-1 mr-4 min-w-0">
                <h2 className="text-[20px] font-bold text-gray-900 leading-tight mb-1 truncate">{activeItem.title}</h2>
                <p className="text-[13px] text-gray-500 font-mono font-medium">{activeItem.id}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => handleReject(activeItem.id)} className="bg-white border border-gray-200 text-gray-700 hover:text-red-600 hover:border-red-200 hover:bg-red-50 px-4 py-2.5 rounded-lg text-[12px] font-bold flex items-center gap-2 shadow-sm transition-all uppercase tracking-wide">
                  <X className="w-4 h-4" /> Reject
                </button>
                <button onClick={() => handleAccept(activeItem.id, activeItem.attribute_key, activeItem.expected)} className="bg-[#0f1115] hover:bg-black text-white px-5 py-2.5 rounded-lg text-[12px] font-bold flex items-center gap-2 shadow-sm transition-all uppercase tracking-wide border border-gray-800">
                  <Check className="w-4 h-4 text-neon" /> Accept Correction
                </button>
              </div>
            </div>
            
            <div className="p-8 flex-1 overflow-y-auto bg-[#FAFAFA] custom-scrollbar">
              <div className="max-w-2xl mx-auto space-y-8">
                
                <div className="bg-[#0f1115] border border-gray-800 rounded-xl p-8 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-neon/0 via-neon/50 to-neon/0"></div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-neon/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <h3 className="text-[12px] font-bold text-neon uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Issue Detected: {activeItem.issue}
                  </h3>
                  <p className="text-[14px] text-gray-400 mb-8 font-medium leading-relaxed">
                    The AI extracted a value that does not perfectly match the Master List of Values (LOV) for the attribute "{activeItem.attribute_key}".
                  </p>

                  <div className="grid grid-cols-2 gap-5 relative z-10">
                    <div className="bg-[#16181d] border border-gray-800/80 rounded-xl p-6 relative flex flex-col justify-center shadow-inner">
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <X className="w-3.5 h-3.5 text-red-500" /> AI Extracted
                      </p>
                      <p className="text-[16px] font-mono font-medium text-gray-400 line-through decoration-red-500/60">{activeItem.extracted}</p>
                    </div>
                    
                    <div className="bg-[#16181d] border border-neon/30 rounded-xl p-6 relative flex flex-col justify-center shadow-[0_0_15px_rgba(44,255,5,0.05)] ring-1 ring-neon/20">
                      <p className="text-[11px] font-semibold text-neon uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-neon" /> Suggested (LOV)
                      </p>
                      <p className="text-[16px] font-mono font-bold text-white">{activeItem.expected}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-[13px] font-bold text-gray-900 uppercase tracking-wide">Source Evidence</h3>
                    <div className="h-px flex-1 bg-gray-200"></div>
                  </div>
                  <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-sm text-[13px] font-mono text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {activeItem.source_evidence}
                  </div>
                </div>

              </div>
            </div>
          </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-[#FAFAFA]">
               <div className="text-center text-gray-400">
                  <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-500">No Item Selected</p>
               </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

export default ValidationCenter;
