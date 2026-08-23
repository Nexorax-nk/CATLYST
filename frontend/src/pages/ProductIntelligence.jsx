import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, CheckCircle2, ShieldCheck, AlertTriangle, FileText, Search, ExternalLink, Box, X } from 'lucide-react';

function ProductIntelligence() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("Attributes");
  const [evidenceDrawer, setEvidenceDrawer] = useState(null);

  useEffect(() => {
    axios.get(`http://127.0.0.1:8080/api/product/${id}`)
      .then(res => setProduct(res.data))
      .catch(console.error);
  }, [id]);

  if (!product) return <div className="p-8 text-gray-500">Loading Product Intelligence...</div>;

  const isEnriched = product.status === "ai-enriched";
  
  // Convert attributes for table display
  let attributesList = [];
  if (Array.isArray(product.attributes)) {
    attributesList = product.attributes.map(attr => ({
      label: attr.label || attr.key,
      value: `${attr.value || ''} ${attr.uom || ''}`.trim(),
      confidence: attr.confidence || product.confidence_score,
      source: attr.source || (isEnriched ? "AI LLM Extraction" : "Regex Extraction"),
      snippet: attr.evidence_snippet || `... extracted ${attr.label}: ${attr.value} from text...`
    }));
  } else {
    attributesList = Object.entries(product.attributes || {}).map(([key, val]) => {
      const ev = product.evidence && product.evidence[key] ? product.evidence[key] : {};
      return {
        label: key,
        value: typeof val === 'object' ? JSON.stringify(val) : val,
        confidence: ev.confidence || product.confidence_score, 
        source: ev.source || (isEnriched ? "Manufacturer Technical Document" : "Regex Extraction"),
        snippet: ev.snippet || `... extracted ${key}: ${val} from text...`
      };
    });
  }

  const tabs = ["Overview", "Attributes", "Descriptions", "Sources", "Validation"];

  return (
    <div className="flex h-full max-w-[1600px] mx-auto overflow-hidden animate-in fade-in duration-500">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 p-6 lg:p-8">
        
        <button onClick={() => navigate('/catalog')} className="shrink-0 flex items-center gap-2 text-gray-500 hover:text-neon font-bold text-[11px] uppercase tracking-wider mb-6 transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </button>

        {/* Header */}
        <div className="shrink-0 mb-8">
          <h1 className="text-[28px] lg:text-[32px] font-bold text-gray-900 tracking-tight leading-none mb-3">{product.product_title}</h1>
          <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest">
            {isEnriched ? (
               <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-900 text-white shadow-sm">
                 <CheckCircle2 className="w-4 h-4 text-neon" /> Validated
               </span>
            ) : (
               <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-50 text-red-700 border border-red-200">
                 <AlertTriangle className="w-4 h-4 text-red-500" /> Needs Review
               </span>
            )}
            
            <span className="text-gray-600 bg-gray-100 px-3 py-1.5 rounded-md border border-gray-200 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Verified
            </span>
          </div>
        </div>

        <div className="shrink-0 grid grid-cols-2 gap-8 mb-6 pb-6 border-b border-gray-200">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Manufacturer</p>
            <p className="text-gray-900 font-medium">{product.canonical_manufacturer}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">MPN</p>
            <p className="text-gray-900 font-mono bg-gray-50 px-2 py-0.5 rounded inline-block border border-gray-200">{product.id}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 flex gap-8 border-b border-gray-200 mb-6">
          {tabs.map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors ${
                activeTab === tab 
                  ? 'border-neon text-gray-900' 
                  : 'border-transparent text-gray-400 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-2">
          {activeTab === "Overview" && (
            <div className="space-y-6">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Product Overview</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 font-mono text-sm text-gray-700 leading-relaxed">
                {product.raw_desc}
              </div>
            </div>
          )}

          {activeTab === "Attributes" && (
            <div className="h-full flex flex-col">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 shrink-0">Technical Attributes</h3>
              {attributesList.length === 0 ? (
                 <div className="flex-1 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg text-gray-500 text-sm font-bold uppercase tracking-wider">
                   No attributes extracted.
                 </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden shrink-0">
                  <table className="w-full text-left text-[11px] lg:text-xs whitespace-nowrap">
                    <thead className="bg-white border-b border-gray-200">
                      <tr className="text-gray-400 text-[10px] uppercase tracking-widest font-bold">
                        <th className="px-5 py-4">Attribute</th>
                        <th className="px-5 py-4">Value</th>
                        <th className="px-5 py-4">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {attributesList.map((attr, idx) => (
                        <tr 
                          key={idx} 
                          onClick={() => setEvidenceDrawer(attr)}
                          className="hover:bg-gray-50/80 cursor-pointer transition-colors group"
                        >
                          <td className="px-5 py-4 font-bold text-gray-900 text-xs">{attr.label}</td>
                          <td className="px-5 py-4 text-gray-700 font-medium">{attr.value}</td>
                          <td className="px-5 py-4 text-gray-500 font-medium flex items-center gap-2 group-hover:text-neon transition-colors">
                            {attr.source} <Search className="w-3.5 h-3.5" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4 text-right shrink-0">
                Click any attribute to view AI extraction evidence
              </p>
            </div>
          )}

        {activeTab === "Descriptions" && (
          <div className="space-y-6">
             <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Commerce Content</h3>
             <div className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm">
                <p className="text-xs font-semibold text-gray-500 mb-1">INVOICE DESCRIPTION</p>
                <p className="font-mono text-gray-900 mb-3">{product.descriptions?.invoice_description || product.raw_desc.substring(0, 40).toUpperCase()}</p>
                <div className="flex gap-4 text-xs font-medium text-emerald-600">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> 40 char limit</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Required casing</span>
                </div>
             </div>
             <div className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm">
                <p className="text-xs font-semibold text-gray-500 mb-1">MARKETING DESCRIPTION</p>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{product.descriptions?.marketing_description || product.product_title}</p>
                <div className="flex gap-4 text-xs font-medium text-emerald-600">
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Tone approved</span>
                </div>
             </div>
          </div>
        )}

        {activeTab === "Sources" && (
          <div className="space-y-4">
             <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Ingested Source Documents</h3>
             {(product.sources || []).map((source, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm group">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-gray-400 group-hover:text-neon transition-colors" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{source.name}</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{source.type}</p>
                    </div>
                  </div>
                  <a href={source.url} className="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
             ))}
             {(!product.sources || product.sources.length === 0) && (
                <div className="p-8 text-center bg-gray-50 text-gray-500 text-sm font-medium rounded-lg border border-gray-200">
                  No source documents available.
                </div>
             )}
          </div>
        )}

        {activeTab === "Validation" && (
          <div className="space-y-4">
             <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Data Quality Rules</h3>
             <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
               <table className="w-full text-left text-sm">
                 <thead className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase font-bold text-gray-500 tracking-widest">
                   <tr>
                     <th className="px-5 py-3">Rule Name</th>
                     <th className="px-5 py-3 text-right">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {(product.validation || []).map((rule, idx) => (
                     <tr key={idx}>
                       <td className="px-5 py-3 font-medium text-gray-900">{rule.step}</td>
                       <td className="px-5 py-3 text-right">
                         <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold ${rule.status === 'passed' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                           {rule.status === 'passed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                           {rule.status.toUpperCase()}
                         </span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
               {(!product.validation || product.validation.length === 0) && (
                 <div className="p-8 text-center text-gray-500 text-sm font-medium">
                   No validation rules executed.
                 </div>
               )}
             </div>
          </div>
        )}

        </div>
      </div>

      {/* Evidence Drawer */}
      {evidenceDrawer && (
        <div className="w-[400px] shrink-0 bg-[#0a0b0e] border-l border-gray-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 relative z-20">
          <div className="absolute top-0 right-0 w-48 h-48 bg-neon/5 rounded-full blur-[60px] pointer-events-none" />
          
          <div className="p-6 lg:p-8 border-b border-gray-800 bg-[#16181d] flex justify-between items-start shrink-0 relative z-10">
            <div>
              <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Attribute Evidence</h2>
              <h3 className="text-lg font-bold text-gray-200">{evidenceDrawer.label}</h3>
            </div>
            <button onClick={() => setEvidenceDrawer(null)} className="text-gray-500 hover:text-neon transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6 lg:p-8 flex-1 overflow-y-auto space-y-10 custom-scrollbar relative z-10">
            <div>
              <p className="text-[32px] leading-tight font-black text-white mb-4">{evidenceDrawer.value}</p>
              <span className="text-gray-400 font-medium text-sm">Validating</span>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">Source</h4>
              <div className="flex items-center gap-4 bg-[#16181d] p-4 rounded-xl border border-gray-800">
                <FileText className="w-8 h-8 text-gray-400" />
                <div>
                  <p className="text-sm font-bold text-gray-200">{evidenceDrawer.source}</p>
                  <p className="text-xs font-medium text-gray-500 mt-0.5">Page 4</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">Evidence Snippet</h4>
              <div className="bg-[#16181d] border border-gray-800 p-5 rounded-xl font-mono text-sm text-gray-400 shadow-inner leading-relaxed">
                {evidenceDrawer.snippet.split(evidenceDrawer.value).map((part, i, arr) => (
                  <React.Fragment key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <mark className="bg-neon text-black font-bold px-1.5 py-0.5 rounded-sm shadow-[0_0_10px_rgba(44,255,5,0.3)]">
                        {evidenceDrawer.value}
                      </mark>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">Validation Chain</h4>
              <div className="space-y-4">
                {(product.validation || []).map((rule, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm font-medium text-gray-300">
                    {rule.status === 'passed' ? <CheckCircle2 className="w-4 h-4 text-neon shrink-0" /> : <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
                    <span>{rule.step}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
          
          <div className="p-6 lg:p-8 border-t border-gray-800 bg-[#16181d] shrink-0 z-10">
            {evidenceDrawer.source === 'WEB' ? (
              <button 
                onClick={() => {
                  const webSource = product.sources?.find(s => s.type === 'Manufacturer Website' || s.name === 'Web Scrape' || s.url);
                  if (webSource && webSource.url) {
                    window.open(webSource.url, '_blank');
                  } else {
                    alert('Source URL not found.');
                  }
                }}
                className="w-full bg-gray-900 border border-gray-700 hover:border-neon hover:text-neon text-gray-300 text-sm font-bold uppercase tracking-wider py-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2">
                <ExternalLink className="w-4 h-4" /> Open Source Document
              </button>
            ) : (
              <button 
                disabled
                className="w-full bg-gray-800 border border-gray-700/50 text-gray-500 text-sm font-bold uppercase tracking-wider py-3 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed">
                <FileText className="w-4 h-4" /> Extracted from CSV Input
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductIntelligence;
