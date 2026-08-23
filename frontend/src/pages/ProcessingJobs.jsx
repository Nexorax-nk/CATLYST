import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ListOrdered, CheckCircle2, AlertTriangle, FileSpreadsheet, Download, RefreshCw, Pause, Square, PlayCircle } from 'lucide-react';

function ProcessingJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = () => {
    setLoading(true);
    axios.get('http://127.0.0.1:8080/api/jobs')
      .then(res => {
        setJobs(res.data);
        setTimeout(() => setLoading(false), 500);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchJobs();
    
    // Auto refresh while any job is processing or paused
    const interval = setInterval(() => {
      setJobs(prev => {
        if (prev.some(j => j.status === 'Processing' || j.status === 'Paused')) {
          fetchJobs();
        }
        return prev;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const controlJob = async (jobId, action) => {
    try {
      // Optimistic update
      setJobs(prev => prev.map(job => {
        if (job.id === jobId) {
          if (action === 'pause') return { ...job, status: 'Paused' };
          if (action === 'resume') return { ...job, status: 'Processing' };
          if (action === 'stop') return { ...job, status: 'Stopped' };
        }
        return job;
      }));
      await axios.post(`http://127.0.0.1:8080/api/jobs/${jobId}/action`, { action });
      fetchJobs();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="h-full w-full max-w-[1600px] mx-auto flex flex-col p-6 lg:p-8 gap-5 lg:gap-6 animate-in fade-in duration-500 overflow-hidden bg-[#FAFAFA]">
      
      {/* Header - Fixed Height */}
      <div className="shrink-0 flex justify-between items-start mb-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f1115] flex items-center justify-center border border-gray-800 shadow-sm">
              <ListOrdered className="w-5 h-5 text-neon" />
            </div>
            <h1 className="text-[28px] font-bold tracking-tight leading-none text-gray-900">Processing Jobs</h1>
          </div>
          <p className="text-[13px] text-gray-500 font-medium ml-1">History of batch ingestion and enrichment pipelines.</p>
        </div>
        <button onClick={fetchJobs} className="bg-[#0f1115] hover:bg-black text-white px-4 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-2 shadow-sm transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-neon' : ''}`} /> Refresh List
        </button>
      </div>

      {/* Data Table */}
      <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <table className="w-full text-center text-[11px] lg:text-[13px] whitespace-nowrap">
            <thead className="bg-gray-50/50 sticky top-0 z-10 border-b border-gray-200 backdrop-blur-sm">
              <tr className="text-gray-600 text-[11px] lg:text-[12px] uppercase tracking-wider font-bold">
                <th className="px-2 py-4 lg:px-4 lg:py-5">Job ID</th>
                <th className="px-2 py-4 lg:px-4 lg:py-5">Source File</th>
                <th className="px-2 py-4 lg:px-4 lg:py-5">Pipeline Type</th>
                <th className="px-2 py-4 lg:px-4 lg:py-5">Date</th>
                <th className="px-2 py-4 lg:px-4 lg:py-5">Rows</th>
                <th className="px-2 py-4 lg:px-4 lg:py-5">Errors</th>
                <th className="px-2 py-4 lg:px-4 lg:py-5">Status</th>
                <th className="px-2 py-4 lg:px-4 lg:py-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.length === 0 && !loading && (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500 font-medium">
                    No processing jobs found.
                  </td>
                </tr>
              )}
              {jobs.map((job, idx) => (
                <tr key={idx} className="hover:bg-[#FAFAFA] transition-colors group text-center">
                  <td className="px-2 py-4 lg:px-4 lg:py-5 font-mono font-bold text-gray-900">{job.id}</td>
                  <td className="px-2 py-4 lg:px-4 lg:py-5">
                    <div className="flex items-center justify-center gap-2 lg:gap-3">
                      <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center shadow-sm group-hover:bg-white transition-colors shrink-0">
                        <FileSpreadsheet className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-green-600" />
                      </div>
                      <span className="font-semibold text-gray-700 text-[11px] lg:text-[13px] whitespace-normal break-all max-w-[150px] lg:max-w-[200px] leading-tight text-left">{job.file}</span>
                    </div>
                  </td>
                  <td className="px-2 py-4 lg:px-4 lg:py-5">
                    <span className="bg-gray-100 text-gray-600 px-2 lg:px-3 py-1 lg:py-1.5 rounded-md lg:rounded-lg text-[10px] lg:text-[11px] font-bold tracking-widest shadow-sm">
                      {job.type}
                    </span>
                  </td>
                  <td className="px-2 py-4 lg:px-4 lg:py-5 text-gray-500 font-medium text-[11px] lg:text-[12px]">{job.date}</td>
                  <td className="px-2 py-4 lg:px-4 lg:py-5 font-mono font-semibold text-gray-600">{job.rows ? job.rows.toLocaleString() : '0'}</td>
                  <td className="px-2 py-4 lg:px-4 lg:py-5">
                    {job.errors > 0 ? (
                      <span className="inline-flex items-center justify-center gap-1.5 px-2 py-1 rounded-md text-[10px] lg:text-[11px] font-bold text-red-600 bg-red-50 border border-red-100">
                        <AlertTriangle className="w-3 h-3" /> {job.errors.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-gray-400 font-medium text-lg">-</span>
                    )}
                  </td>
                  <td className="px-2 py-4 lg:px-4 lg:py-5">
                    <div className="flex justify-center">
                      {job.status === "Completed" ? (
                        <span className="w-24 lg:w-32 inline-flex justify-center items-center gap-1.5 py-1.5 rounded-md lg:rounded-lg text-[10px] lg:text-[11px] uppercase tracking-widest font-black bg-[#0f1115] text-neon shadow-sm">
                          <CheckCircle2 className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-neon" /> {job.status}
                        </span>
                      ) : job.status === "Failed" ? (
                        <span className="w-24 lg:w-32 inline-flex justify-center items-center gap-1.5 py-1.5 rounded-md lg:rounded-lg text-[10px] lg:text-[11px] uppercase tracking-widest font-black bg-[#0f1115] text-[#ff2a5f] shadow-sm">
                          <AlertTriangle className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-[#ff2a5f]" /> {job.status}
                        </span>
                      ) : job.status === "Paused" ? (
                        <span className="w-24 lg:w-32 inline-flex justify-center items-center gap-1.5 py-1.5 rounded-md lg:rounded-lg text-[10px] lg:text-[11px] uppercase tracking-widest font-black bg-[#0f1115] text-yellow-500 shadow-sm">
                          <Pause className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-yellow-500" /> {job.status}
                        </span>
                      ) : job.status === "Stopped" ? (
                        <span className="w-24 lg:w-32 inline-flex justify-center items-center gap-1.5 py-1.5 rounded-md lg:rounded-lg text-[10px] lg:text-[11px] uppercase tracking-widest font-black bg-gray-200 text-gray-500 shadow-sm">
                          <Square className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-gray-500" /> {job.status}
                        </span>
                      ) : (
                        <span className="w-24 lg:w-32 inline-flex justify-center items-center gap-1.5 py-1.5 rounded-md lg:rounded-lg text-[10px] lg:text-[11px] uppercase tracking-widest font-black bg-gray-200 text-gray-600 shadow-sm">
                          <RefreshCw className="w-3 h-3 lg:w-3.5 lg:h-3.5 animate-spin" /> {job.status}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-4 lg:px-4 lg:py-5">
                    <div className="flex items-center justify-center gap-2">
                      {job.status === 'Processing' && (
                        <>
                          <button onClick={() => controlJob(job.id, 'pause')} className="p-1.5 lg:p-2 bg-yellow-500/10 hover:bg-yellow-500/20 rounded-md transition-colors text-yellow-500" title="Pause">
                            <Pause className="w-4 h-4" />
                          </button>
                          <button onClick={() => controlJob(job.id, 'stop')} className="p-1.5 lg:p-2 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-colors text-red-500" title="Stop">
                            <Square className="w-4 h-4 fill-current" />
                          </button>
                        </>
                      )}
                      {job.status === 'Paused' && (
                        <>
                          <button onClick={() => controlJob(job.id, 'resume')} className="p-1.5 lg:p-2 bg-neon/10 hover:bg-neon/20 rounded-md transition-colors text-neon" title="Resume">
                            <PlayCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => controlJob(job.id, 'stop')} className="p-1.5 lg:p-2 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-colors text-red-500" title="Stop">
                            <Square className="w-4 h-4 fill-current" />
                          </button>
                        </>
                      )}
                      
                      <button className="w-20 lg:w-24 text-gray-800 hover:text-black font-black text-[10px] lg:text-[11px] uppercase tracking-widest flex items-center justify-center gap-1.5 lg:gap-2 transition-all bg-white hover:bg-[#f2fcf2] border-2 border-[#23cc04] hover:border-[#1ca303] px-2 py-1.5 lg:py-2 rounded-md lg:rounded-lg shadow-sm hover:shadow-md">
                        <Download className="w-3 h-3 lg:w-4 lg:h-4 text-[#23cc04]" /> Log
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ProcessingJobs;
