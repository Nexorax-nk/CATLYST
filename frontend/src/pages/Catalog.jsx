import { API_BASE } from '../config';
import React, { useEffect, useState, useRef } from 'react';
import { Search, Filter, Shield, Box, Plus, CheckCircle2, ChevronDown, Download, AlertTriangle, MoreHorizontal, ChevronLeft, ChevronRight, X, ChevronsUpDown, Building2, Tag, Layers } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Catalog() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const [activeFilters, setActiveFilters] = useState({
    Manufacturer: [],
    Brand: [],
    Status: []
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCatalog();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchCatalog = () => {
    axios.get(`${API_BASE}/api/catalog`)
      .then(res => {
        setProducts(res.data.items);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  // Compute unique values for filters
  const uniqueManufacturers = [...new Set(products.map(p => p.canonical_manufacturer || 'Unknown'))].sort();
  const uniqueBrands = [...new Set(products.map(p => p.canonical_brand === 'UNBRANDED' || !p.canonical_brand ? 'Unbranded' : p.canonical_brand))].sort();
  const filterOptions = {
    Manufacturer: uniqueManufacturers,
    Brand: uniqueBrands,
    Status: ['Validated', 'Pending']
  };

  const toggleFilter = (category, value) => {
    setActiveFilters(prev => {
      const current = prev[category];
      if (current.includes(value)) {
        return { ...prev, [category]: current.filter(v => v !== value) };
      } else {
        return { ...prev, [category]: [...current, value] };
      }
    });
  };

  const removeFilter = (category, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [category]: prev[category].filter(v => v !== value)
    }));
  };

  const clearAllFilters = () => {
    setActiveFilters({ Manufacturer: [], Brand: [], Status: [] });
  };

  const getProductDerivedData = (p) => {
    return {
      manufacturer: p.canonical_manufacturer || 'Unknown',
      brand: p.canonical_brand === 'UNBRANDED' || !p.canonical_brand ? 'Unbranded' : p.canonical_brand,
      status: p.status === 'ai-enriched' ? 'Validated' : 'Pending'
    };
  };

  const filtered = products.filter(p => {
    // Search Term
    const searchMatch = p.product_title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.canonical_brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!searchMatch) return false;

    // Derived Data for Filters
    const d = getProductDerivedData(p);

    // Filters
    if (activeFilters.Manufacturer.length > 0 && !activeFilters.Manufacturer.includes(d.manufacturer)) return false;
    if (activeFilters.Brand.length > 0 && !activeFilters.Brand.includes(d.brand)) return false;
    if (activeFilters.Status.length > 0 && !activeFilters.Status.includes(d.status)) return false;

    return true;
  });

  const hasAnyActiveFilters = Object.values(activeFilters).some(arr => arr.length > 0);

  return (
    <div className="h-full w-full max-w-[1600px] mx-auto flex flex-col p-6 lg:p-8 gap-5 animate-in fade-in duration-500 overflow-hidden bg-[#FAFAFA] text-gray-900">
      
      {/* Header */}
      <div className="shrink-0 flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f1115] flex items-center justify-center border border-gray-800 shadow-sm">
              <Layers className="w-5 h-5 text-neon" />
            </div>
            <h1 className="text-[28px] font-bold tracking-tight leading-none text-gray-900">Product Catalog</h1>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-gray-500 font-medium ml-1">
            <span>{products.length.toLocaleString()} products</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            <span>Last updated 2 min ago</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => window.open(`${API_BASE}/api/export?format=csv`, '_blank')}
            className="bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button 
            onClick={() => window.open(`${API_BASE}/api/export?format=excel`, '_blank')}
            className="bg-green-50 border border-green-200 hover:border-green-300 text-green-700 px-4 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <button 
            onClick={() => navigate('/enrichment')}
            className="bg-[#0f1115] hover:bg-black text-white px-4 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 text-neon" /> New Enrichment
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="shrink-0 flex flex-col gap-3">
        <div className="flex gap-3" ref={dropdownRef}>
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by product, MPN, SKU, manufacturer or brand..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg py-2.5 pl-9 pr-12 text-[13px] font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-300 focus:ring-4 focus:ring-gray-100 transition-all shadow-sm"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
               <span className="text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">⌘</span>
               <span className="text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">K</span>
            </div>
          </div>
          {['Manufacturer', 'Brand', 'Status'].map(filter => (
            <div key={filter} className="relative">
              <button 
                onClick={() => setOpenDropdown(openDropdown === filter ? null : filter)}
                className={`bg-white border ${activeFilters[filter].length > 0 ? 'border-green-400 bg-green-50/30' : 'border-gray-200'} text-gray-700 font-semibold px-4 py-2.5 rounded-lg text-[13px] flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm`}
              >
                {filter} 
                {activeFilters[filter].length > 0 && (
                  <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">{activeFilters[filter].length}</span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${openDropdown === filter ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === filter && (
                <div className={`absolute top-full mt-1.5 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden ${(filter === 'Confidence' || filter === 'Status') ? 'right-0' : 'left-0'}`}>
                  <div className="max-h-64 overflow-y-auto p-2 flex flex-col gap-1">
                    {filterOptions[filter].map(opt => (
                      <label key={opt} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group">
                        <input 
                          type="checkbox" 
                          checked={activeFilters[filter].includes(opt)}
                          onChange={() => toggleFilter(filter, opt)}
                          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer" 
                        />
                        <span className="text-[13px] font-medium text-gray-700 group-hover:text-gray-900 truncate">{opt}</span>
                      </label>
                    ))}
                    {filterOptions[filter].length === 0 && (
                      <div className="px-3 py-4 text-[12px] text-gray-500 text-center font-medium">No options available</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Active Filters Row */}
        {(showFilters || hasAnyActiveFilters) && (
          <div className="flex items-center gap-4 mt-1 animate-in fade-in slide-in-from-top-2 duration-300 flex-wrap">
            <button 
              onClick={() => setShowFilters(false)}
              className="flex items-center gap-1.5 text-gray-900 text-[13px] font-bold shrink-0"
            >
               <Filter className="w-4 h-4" /> Hide filters
            </button>
            {hasAnyActiveFilters && (
              <button onClick={clearAllFilters} className="text-[13px] font-bold text-green-600 hover:text-green-700 shrink-0">
                 Clear filters
              </button>
            )}
            
            {(showFilters || hasAnyActiveFilters) && <div className="w-px h-4 bg-gray-300 mx-1 shrink-0"></div>}
            
            <div className="flex flex-wrap gap-2">
              {Object.entries(activeFilters).map(([category, values]) => 
                values.map(val => (
                  <div key={`${category}-${val}`} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-full text-[12px] font-medium text-gray-600 animate-in fade-in zoom-in-95 duration-200">
                    {category}: <span className="font-bold text-gray-900">{val}</span>
                    <X onClick={() => removeFilter(category, val)} className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-pointer ml-1" />
                  </div>
                ))
              )}
              {!hasAnyActiveFilters && showFilters && (
                <div className="text-[12px] font-medium text-gray-400 py-1.5 px-1 italic">No active filters</div>
              )}
            </div>
          </div>
        )}
        
        {(!showFilters && !hasAnyActiveFilters) && (
          <div className="flex items-center gap-4 mt-1">
            <button 
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-1.5 text-gray-700 hover:text-gray-900 text-[13px] font-bold"
            >
               <Filter className="w-4 h-4" /> More filters
            </button>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden mt-2">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm font-medium">Loading catalog data...</div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm font-medium">No products found.</div>
        ) : (
          <div className="flex-1 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <table className="w-full text-left text-[13px] whitespace-nowrap">
              <thead className="bg-gray-50/80 sticky top-0 z-10 border-b border-gray-200">
                <tr className="text-gray-500 text-[10px] font-black uppercase tracking-widest">
                  <th className="px-6 py-4">Product details</th>
                  <th className="px-6 py-4">Manufacturer</th>
                  <th className="px-6 py-4">Brand</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((product, idx) => {
                  const isEnriched = product.status === "ai-enriched";
                  
                  const confidenceScore = product.confidence_scores?.extraction;
                  const hasConfidence = confidenceScore !== undefined && confidenceScore !== null;
                  const confVal = hasConfidence ? Math.round(confidenceScore * 100) : null;
                  
                  let statusText = isEnriched ? "Validated" : "Pending";
                  let statusColor = isEnriched ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200";

                  let confColor = confVal > 90 ? "bg-green-500" : (confVal > 70 ? "bg-orange-500" : "bg-red-500");
                  let confLevel = confVal > 90 ? "High" : (confVal > 70 ? "Medium" : "Low");
                  
                  const isUnbranded = product.canonical_brand === 'UNBRANDED' || !product.canonical_brand;
                  const brandText = isUnbranded ? 'Unbranded' : product.canonical_brand;

                  return (
                    <tr 
                      key={idx} 
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="hover:bg-gray-50/80 hover:shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] relative z-0 hover:z-10 cursor-pointer transition-all duration-200 group bg-white"
                    >
                      <td className="px-6 py-4 max-w-md">
                        <div className="font-bold text-gray-900 text-[13px] leading-snug line-clamp-2 group-hover:text-green-700 transition-colors">
                          {product.product_title || 'Unknown Product'}
                        </div>
                        <div className="mt-2">
                           <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200 uppercase tracking-wider">
                              {product.id}
                           </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                           <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0 group-hover:border-gray-300 transition-colors">
                             <Building2 className="w-3.5 h-3.5 text-gray-400" />
                           </div>
                           <span className="font-semibold text-gray-800 text-[13px]">{product.canonical_manufacturer || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${isUnbranded ? 'bg-gray-50 text-gray-500 border-gray-200' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                           <Tag className={`w-3 h-3 ${isUnbranded ? 'text-gray-400' : 'text-blue-500'}`} />
                           {brandText}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide border shadow-sm ${statusColor}`}>
                           {statusText}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button className="text-gray-400 hover:text-gray-900 p-1.5 rounded-md hover:bg-gray-200 border border-transparent hover:border-gray-300 transition-all shadow-sm opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                           <MoreHorizontal className="w-4 h-4" />
                         </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

export default Catalog;
