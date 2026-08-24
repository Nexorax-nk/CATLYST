import { API_BASE } from '../config';
import React, { useState } from 'react';
import axios from 'axios';
import { Search, SlidersHorizontal, Zap, Loader2, Package, Tag, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function IntelligentSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    setHasSearched(true);
    try {
      const response = await axios.get(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`);
      setResults(response.data);
    } catch (error) {
      console.error(error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="h-full w-full max-w-[1600px] mx-auto p-6 lg:p-8 flex flex-col items-center justify-center animate-in fade-in duration-500 overflow-hidden relative bg-[#FAFAFA]">
      
      {/* Very subtle green ambient glow for a premium feel */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-green-400/5 rounded-full blur-[120px] pointer-events-none" />

      <div className={`text-center mb-10 relative z-10 w-full max-w-3xl transition-all duration-500 ease-in-out ${hasSearched ? 'mt-10' : 'mt-[-10vh]'}`}>
        <div className="flex items-center justify-center mb-6">
          <h1 className="text-[42px] font-black text-gray-900 tracking-tight flex items-center gap-3">
            CATLYST
            <span className="text-[24px] font-bold bg-[#0f1115] text-neon border border-gray-800 px-4 py-1.5 rounded-xl shadow-sm uppercase tracking-widest leading-none">
              SEARCH
            </span>
          </h1>
        </div>
        <p className="text-[16px] font-medium text-gray-500 max-w-xl mx-auto">
          Semantic natural language search across your entire enriched catalog.
        </p>
      </div>

      <div className="w-full max-w-3xl relative z-10">
        <form onSubmit={handleSearch} className="relative group">
          <Search className="w-5 h-5 text-gray-400 absolute left-6 top-1/2 -translate-y-1/2 group-focus-within:text-green-500 transition-colors" />
          <input 
            type="text" 
            placeholder="e.g. 'Stainless steel refrigerators under 36 inches with ice maker'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white border-2 border-gray-200 rounded-2xl py-4 pl-14 pr-36 text-[15px] font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-green-400 focus:ring-4 focus:ring-green-500/10 transition-all shadow-sm hover:shadow-md"
          />
          <button 
            type="submit"
            className="absolute right-2 top-2 bottom-2 bg-[#0f1115] hover:bg-black text-white px-6 rounded-xl text-[13px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm"
          >
            <Zap className="w-4 h-4 text-neon" /> Search
          </button>
        </form>

        <div className="flex items-center justify-between mt-6 px-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white border border-gray-200 shadow-sm px-2.5 py-1 rounded-md">Suggested</span>
            <button type="button" onClick={() => { setQuery("7-1/4 inch saw blade"); handleSearch(); }} className="text-xs font-medium text-gray-600 hover:text-green-600 transition-colors">"7-1/4 inch saw blade"</button>
            <span className="text-gray-300">•</span>
            <button type="button" onClick={() => { setQuery("refrigerator"); handleSearch(); }} className="text-xs font-medium text-gray-600 hover:text-green-600 transition-colors">"refrigerators"</button>
          </div>
          <button className="text-[11px] text-gray-500 hover:text-gray-900 flex items-center gap-1.5 font-bold uppercase tracking-widest transition-colors">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Advanced
          </button>
        </div>
      </div>

      <div className={`w-full max-w-4xl transition-all duration-500 ease-in-out ${hasSearched ? 'mt-8 flex-1 overflow-y-auto' : 'mt-16 pointer-events-none'}`}>
        {isSearching ? (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
            <Loader2 className="w-10 h-10 text-neon animate-spin mb-4" />
            <p className="text-[13px] font-bold text-gray-400 uppercase tracking-widest">Searching catalog...</p>
          </div>
        ) : hasSearched ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-20 px-2">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-6">
              <h2 className="text-[13px] font-bold text-gray-900 tracking-tight">
                Search Results <span className="text-gray-400 font-medium ml-2">({results.length})</span>
              </h2>
            </div>
            
            {results.length === 0 ? (
              <div className="text-center py-16 bg-white border border-gray-100 rounded-3xl shadow-sm">
                <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-[15px] font-bold text-gray-900 mb-1">No products found</p>
                <p className="text-[13px] text-gray-500">Try adjusting your search terms or using broader keywords.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((product) => (
                  <div 
                    key={product.id} 
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="bg-white border border-gray-100 hover:border-green-400/50 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-400/5 rounded-bl-full translate-x-12 -translate-y-12 group-hover:translate-x-0 group-hover:-translate-y-0 transition-transform duration-500 pointer-events-none" />
                    
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-3 relative z-10">
                        <h3 className="text-[14px] font-bold text-gray-900 leading-snug group-hover:text-green-600 transition-colors line-clamp-2">
                          {product.title}
                        </h3>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-4 relative z-10">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-gray-50 text-gray-600 border border-gray-100">
                          <Building2 className="w-3 h-3" /> {product.manufacturer}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-gray-50 text-gray-600 border border-gray-100">
                          <Tag className="w-3 h-3" /> {product.brand}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50 relative z-10">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="text-[11px] font-medium text-gray-500 truncate max-w-[150px]">{product.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Confidence</span>
                        <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                          product.confidence > 0.8 ? 'bg-green-100 text-green-700' : 
                          product.confidence > 0.5 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {Math.round(product.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-200 pb-3 inline-flex items-center justify-center gap-2 w-full max-w-[200px] mx-auto">
              Waiting for query...
            </p>
          </div>
        )}
      </div>

    </div>
  );
}

export default IntelligentSearch;
