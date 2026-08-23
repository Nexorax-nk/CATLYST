import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, Settings2, Play, CheckCircle2, FileUp, Sparkles, Database, Layers, CheckCircle, Loader2, Zap, AlertTriangle, Pause, Square, PlayCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function EnrichmentStudio() {
  const [file, setFile] = useState(null);
  const [fileMeta, setFileMeta] = useState(null);
  const [batchSize, setBatchSize] = useState(100);
  const [batches, setBatches] = useState([]);
  const [step, setStep] = useState(1);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [activeJobId, setActiveJobId] = useState(null);
  const [activeBatchIndex, setActiveBatchIndex] = useState(null);
  
  const navigate = useNavigate();

  const handleUploadAnalyze = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    
    const formData = new FormData();
    formData.append("file", selectedFile);
    
    try {
      const response = await axios.post("http://127.0.0.1:8080/api/upload-analyze", formData);
      setFileMeta(response.data);
      generateBatches(response.data.total_rows, 100);
      setStep(2);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze file");
    }
  };

  const generateBatches = (total, size) => {
    const newBatches = [];
    for (let i = 0; i < total; i += size) {
      newBatches.push({
        index: newBatches.length,
        start: i,
        end: Math.min(i + size, total),
        status: 'Idle',
        jobId: null,
        progress: 0,
        result: null
      });
    }
    setBatches(newBatches);
  };

  const handleBatchSizeChange = (e) => {
    const size = parseInt(e.target.value);
    setBatchSize(size);
    if (fileMeta) {
      generateBatches(fileMeta.total_rows, size);
    }
  };

  const processBatch = async (batchIndex) => {
    if (!fileMeta) return;
    const batch = batches[batchIndex];
    
    // Update status
    setBatches(prev => {
      const newBatches = [...prev];
      newBatches[batchIndex].status = 'Processing';
      return newBatches;
    });
    setStep(3);

    try {
      const response = await axios.post("http://127.0.0.1:8080/api/batch-process", {
        file_path: fileMeta.file_path,
        filename: fileMeta.filename,
        start_row: batch.start,
        end_row: batch.end
      });
      
      const jobId = response.data.job_id;
      
      setBatches(prev => {
        const newBatches = [...prev];
        newBatches[batchIndex].jobId = jobId;
        return newBatches;
      });
      
      setActiveJobId(jobId);
      setActiveBatchIndex(batchIndex);
    } catch (e) {
      console.error(e);
      setBatches(prev => {
        const newBatches = [...prev];
        newBatches[batchIndex].status = 'Failed';
        return newBatches;
      });
      if (isProcessingAll) setIsProcessingAll(false);
    }
  };

  const processAllBatches = () => {
    setIsProcessingAll(true);
    // Find first idle batch
    const firstIdleIndex = batches.findIndex(b => b.status === 'Idle');
    if (firstIdleIndex !== -1) {
      processBatch(firstIdleIndex);
    } else {
      setIsProcessingAll(false);
    }
  };

  const controlJob = async (action, batchIdx) => {
    const batch = batches[batchIdx];
    if (!batch.jobId) return;
    try {
      setBatches(prev => {
        const newBatches = [...prev];
        if (action === 'pause') newBatches[batchIdx].status = 'Paused';
        if (action === 'resume') newBatches[batchIdx].status = 'Processing';
        if (action === 'stop') newBatches[batchIdx].status = 'Stopped';
        return newBatches;
      });
      await axios.post(`http://127.0.0.1:8080/api/jobs/${batch.jobId}/action`, { action });
    } catch(e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let interval;
    if (activeJobId && activeBatchIndex !== null) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`http://127.0.0.1:8080/api/jobs/${activeJobId}`);
          
          setBatches(prev => {
            const newBatches = [...prev];
            const batch = newBatches[activeBatchIndex];
            
            if (res.data.total_rows > 0) {
              batch.progress = Math.round((res.data.processed_rows / res.data.total_rows) * 100);
              batch.processedRows = res.data.processed_rows;
              batch.totalRows = res.data.total_rows;
            }

            if (res.data.status === "Completed" || res.data.status === "Failed" || res.data.status === "Stopped") {
              batch.status = res.data.status;
              batch.result = { processed: res.data.processed_rows, successful: res.data.successful };
              setActiveJobId(null);
              setActiveBatchIndex(null);
              clearInterval(interval);
              
              if (res.data.status === "Stopped") {
                setIsProcessingAll(false);
              } else if (isProcessingAll) {
                // Trigger next batch if processing all
                const nextBatch = activeBatchIndex + 1;
                if (nextBatch < batches.length) {
                  setTimeout(() => processBatch(nextBatch), 1000);
                } else {
                  setIsProcessingAll(false);
                }
              }
            } else if (res.data.status === "Paused") {
              batch.status = "Paused";
            } else if (res.data.status === "Processing") {
              batch.status = "Processing";
            }
            return newBatches;
          });
          
        } catch (e) {
          console.error(e);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeJobId, activeBatchIndex, isProcessingAll, batches.length]);

  return (
    <div className="p-6 lg:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500 space-y-12 bg-[#FAFAFA] h-full overflow-y-auto">
      
      <div className="mb-10 text-center max-w-3xl mx-auto pt-16">
        <h1 className="text-[42px] font-black text-gray-900 tracking-tight leading-none mb-4">Enrichment Studio</h1>
        <p className="text-[16px] font-medium text-gray-500">Upload raw catalog data and configure extraction pipelines.</p>
      </div>

      {/* Steps Pipeline Indicator */}
      <div className="flex items-center justify-between mb-12 relative max-w-3xl mx-auto z-10">
        <div className="absolute top-[28px] left-[10%] w-[80%] h-[2px] bg-gray-200 -z-10"></div>
        {[
          { num: 1, label: "Upload Source", icon: FileUp },
          { num: 2, label: "Configure", icon: Settings2 },
          { num: 3, label: "Process", icon: Play }
        ].map(s => (
          <div key={s.num} className="flex flex-col items-center gap-4 bg-[#FAFAFA] px-6 relative">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm relative z-10 ${
              step >= s.num 
                ? 'bg-[#0f1115] border-2 border-gray-800 text-neon shadow-lg scale-110' 
                : 'bg-white border-2 border-gray-200 text-gray-400'
            }`}>
              <s.icon className="w-6 h-6" />
            </div>
            <span className={`text-[11px] font-bold uppercase tracking-widest ${
              step >= s.num ? 'text-gray-900' : 'text-gray-400'
            }`}>{s.label}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="bg-[#0f1115] border border-gray-800 rounded-3xl p-16 shadow-2xl text-center relative overflow-hidden group max-w-4xl mx-auto">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(44,255,5,0.08)_0%,transparent_70%)] pointer-events-none" />
          
          <div className="w-20 h-20 bg-[#16181d] border border-gray-800 rounded-2xl mx-auto flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-500 shadow-[0_0_30px_rgba(44,255,5,0.1)]">
            <Upload className="w-8 h-8 text-neon" />
          </div>
          
          <h2 className="text-2xl font-bold text-white tracking-tight mb-3">Upload Raw Catalog</h2>
          <p className="text-[15px] font-medium text-gray-400 mb-10 max-w-md mx-auto leading-relaxed">
            Upload a CSV or Excel file containing raw product descriptions and IDs to begin the enrichment pipeline.
          </p>
          
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            accept=".csv,.xlsx"
            onChange={handleUploadAnalyze} 
          />
          <label 
            htmlFor="file-upload" 
            className="cursor-pointer bg-neon hover:bg-[#23cc04] text-black px-10 py-4 rounded-xl text-[13px] font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(44,255,5,0.3)] transition-all hover:scale-105 inline-flex items-center gap-3"
          >
            <FileUp className="w-5 h-5" /> Browse & Analyze
          </label>
        </div>
      )}

      {step >= 2 && fileMeta && (
        <div className="bg-[#0f1115] border border-gray-800 rounded-3xl shadow-2xl overflow-hidden max-w-5xl mx-auto text-left relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-neon/5 rounded-full blur-[80px] pointer-events-none" />
          
          {/* Header Info */}
          <div className="p-8 border-b border-gray-800 bg-[#16181d] relative z-10 flex justify-between items-center">
            <div>
              <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Pipeline Configuration</h2>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-neon/10 flex items-center justify-center border border-neon/20">
                   <Database className="w-5 h-5 text-neon" />
                 </div>
                 <div>
                   <span className="text-lg font-mono font-bold text-white block">{fileMeta.filename}</span>
                   <span className="text-[13px] text-neon font-semibold">{fileMeta.total_rows} Rows Discovered</span>
                 </div>
              </div>
            </div>
            
            <div className="bg-[#0f1115] p-3 rounded-xl border border-gray-800 flex items-center gap-4">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-2">Batch Size:</label>
              <select 
                className="bg-[#16181d] border border-gray-700 text-white rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none focus:border-neon"
                value={batchSize}
                onChange={handleBatchSizeChange}
                disabled={step === 3}
              >
                <option value={50}>50 Rows</option>
                <option value={100}>100 Rows</option>
                <option value={250}>250 Rows</option>
                <option value={500}>500 Rows</option>
              </select>
            </div>
          </div>

          <div className="p-8 relative z-10">
            {/* Batch Grid */}
            <div className="mb-6 flex justify-between items-end">
               <h3 className="text-[13px] font-bold text-white uppercase tracking-widest">Execution Batches ({batches.length})</h3>
               {step === 2 && (
                 <button 
                  onClick={processAllBatches} 
                  className="bg-white hover:bg-gray-200 text-black px-6 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-widest flex items-center gap-2 transition-transform hover:scale-105"
                 >
                   <Play className="w-4 h-4" /> Process All Sequential
                 </button>
               )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
              {batches.map((batch, idx) => (
                <div 
                  key={idx} 
                  className={`relative overflow-hidden rounded-xl p-5 flex flex-col gap-4 transition-all duration-500 border ${
                    batch.status === 'Completed' ? 'bg-[#16181d] border-neon/30 shadow-[0_0_15px_rgba(44,255,5,0.05)]' : 
                    batch.status === 'Failed' ? 'bg-[#1a1315] border-[#ff2a5f] shadow-[0_0_30px_rgba(255,42,95,0.15)] scale-[1.02]' : 
                    batch.status === 'Processing' ? 'bg-[#1a1c23] border-neon shadow-[0_0_30px_rgba(44,255,5,0.15)] scale-[1.02]' : 
                    batch.status === 'Paused' ? 'bg-[#1a1c23] border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.15)] scale-[1.02]' :
                    batch.status === 'Stopped' ? 'bg-[#16181d] border-gray-600' :
                    'bg-[#16181d] border-gray-800 hover:border-gray-600'
                  }`}
                >
                  {/* Neural Scanline effect if processing */}
                  {batch.status === 'Processing' && (
                    <div className="absolute inset-0 pointer-events-none opacity-20">
                      <div className="w-full h-[2px] bg-neon shadow-[0_0_10px_#7dfa14] animate-[scan_2s_ease-in-out_infinite]" />
                    </div>
                  )}

                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        batch.status === 'Completed' ? 'bg-neon/20 text-neon' : 
                        batch.status === 'Failed' ? 'bg-[#ff2a5f]/20 text-[#ff2a5f]' : 
                        batch.status === 'Processing' ? 'bg-neon text-black' : 
                        batch.status === 'Paused' ? 'bg-yellow-500/20 text-yellow-500' : 
                        batch.status === 'Stopped' ? 'bg-gray-600/20 text-gray-500' : 
                        'bg-gray-800 text-gray-400'
                      }`}>
                        {batch.status === 'Processing' ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                         batch.status === 'Paused' ? <Pause className="w-5 h-5" /> :
                         batch.status === 'Stopped' ? <Square className="w-5 h-5" /> :
                         batch.status === 'Failed' ? <AlertTriangle className="w-5 h-5" /> : 
                         <Layers className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-[14px]">Batch {idx + 1}</h4>
                        <span className="text-gray-500 text-[11px] font-mono">Rows {batch.start + 1} - {batch.end}</span>
                      </div>
                    </div>
                    
                    {batch.status === 'Processing' && (
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-neon text-[10px] font-bold uppercase tracking-widest animate-pulse flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Processing...
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <button onClick={() => controlJob('pause', idx)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-yellow-500" title="Pause">
                            <Pause className="w-5 h-5" />
                          </button>
                          <button onClick={() => controlJob('stop', idx)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-red-500" title="Stop">
                            <Square className="w-5 h-5 fill-current" />
                          </button>
                        </div>
                      </div>
                    )}

                    {batch.status === 'Paused' && (
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-yellow-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                          Paused
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <button onClick={() => controlJob('resume', idx)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-neon" title="Resume">
                            <PlayCircle className="w-5 h-5" />
                          </button>
                          <button onClick={() => controlJob('stop', idx)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-red-500" title="Stop">
                            <Square className="w-5 h-5 fill-current" />
                          </button>
                        </div>
                      </div>
                    )}

                    {(batch.status === 'Idle' || batch.status === 'Stopped') && (
                      <button 
                        onClick={() => processBatch(idx)}
                        disabled={activeJobId !== null}
                        className="text-neon hover:text-black text-[11px] font-bold uppercase tracking-widest bg-neon/10 hover:bg-neon px-4 py-2 rounded-lg transition-all disabled:opacity-50 group flex items-center gap-2"
                      >
                        Start <Play className="w-3 h-3 group-hover:scale-110" />
                      </button>
                    )}
                    
                    {batch.status === 'Completed' && (
                      <span className="text-neon text-[11px] font-bold uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Done
                      </span>
                    )}

                    {batch.status === 'Failed' && (
                      <span className="text-[#ff2a5f] text-[11px] font-bold uppercase tracking-widest flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" /> Failed
                      </span>
                    )}
                  </div>

                  {/* Real Progress Bar for active/completed batches */}
                  {batch.status !== 'Idle' && (
                    <div className="w-full mt-2 relative z-10">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1.5">
                        <span className={batch.status === 'Processing' ? 'text-neon animate-pulse' : 'text-neon'}>Progress</span>
                        <span className="text-white">{batch.progress}% {batch.totalRows ? `(${batch.processedRows}/${batch.totalRows})` : ''}</span>
                      </div>
                      <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
                         <div 
                           className={`h-full rounded-full transition-all duration-300 ${batch.status === 'Failed' ? 'bg-[#ff2a5f] shadow-[0_0_10px_rgba(255,42,95,0.8)]' : batch.status === 'Processing' ? 'bg-neon shadow-[0_0_10px_rgba(44,255,5,0.8)]' : 'bg-neon shadow-[0_0_10px_rgba(44,255,5,0.6)]'}`}
                           style={{width: `${batch.progress}%`}}
                         ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Completion state */}
            {batches.length > 0 && batches.every(b => b.status === 'Completed') && (
              <div className="mt-8 pt-8 border-t border-gray-800 text-center animate-in zoom-in duration-500">
                <div className="w-16 h-16 bg-neon/10 rounded-full border border-neon mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(44,255,5,0.2)] mb-4">
                  <CheckCircle2 className="w-8 h-8 text-neon" />
                </div>
                <h2 className="text-xl font-bold text-white mb-6">All Batches Completed Successfully</h2>
                <button 
                  onClick={() => navigate('/catalog')}
                  className="bg-neon hover:bg-[#23cc04] text-black px-10 py-4 rounded-xl text-[13px] font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(44,255,5,0.3)] transition-all hover:scale-105 inline-flex items-center gap-3"
                >
                  <Database className="w-5 h-5" /> View Enriched Catalog
                </button>
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
}

export default EnrichmentStudio;
