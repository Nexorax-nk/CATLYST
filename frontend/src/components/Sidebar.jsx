import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Box, Search, 
  Wand2, ListTree, ShieldCheck, 
  BarChart2, Settings, Network, Layers 
} from 'lucide-react';

function Sidebar() {
  const navGroups = [
    {
      title: "OVERVIEW",
      links: [
        { name: "Dashboard", path: "/overview", icon: LayoutDashboard }
      ]
    },
    {
      title: "CATALOG",
      links: [
        { name: "Products", path: "/catalog", icon: Box },
        { name: "Search", path: "/search", icon: Search }
      ]
    },
    {
      title: "ENRICHMENT",
      links: [
        { name: "New Processing", path: "/enrichment", icon: Wand2 },
        { name: "Processing Jobs", path: "/jobs", icon: ListTree },
        { name: "Validation Center", path: "/validation", icon: ShieldCheck }
      ]
    },
    {
      title: "INSIGHTS",
      links: [
        { name: "Analytics", path: "/analytics", icon: BarChart2 }
      ]
    },
    {
      title: "SYSTEM",
      links: [
        { name: "Sources", path: "/sources", icon: Network }
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[#0a0b0e] text-gray-400 flex flex-col h-screen shrink-0">
      {/* Brand */}
      <div className="p-6 shrink-0 mt-2">
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0 flex items-center justify-center w-10 h-10 bg-[#16181d] border border-gray-800 rounded-xl shadow-[0_0_15px_rgba(44,255,5,0.05)] ring-1 ring-neon/10">
            <Layers className="w-5 h-5 text-neon" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[20px] font-bold text-white tracking-[0.15em] uppercase leading-none">
              CATLYST
            </h1>
            <p className="text-[8.5px] mt-1.5 text-neon/70 font-semibold tracking-[0.2em] uppercase whitespace-nowrap">Product Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {navGroups.map((group, idx) => (
          <div key={idx}>
            <h3 className="px-3 text-[10px] font-semibold text-gray-500/80 tracking-widest mb-3 uppercase">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.links.map((link, lidx) => (
                <NavLink
                  key={lidx}
                  to={link.path}
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all relative overflow-hidden group ${
                      isActive 
                        ? 'text-neon bg-gradient-to-r from-neon/20 to-transparent' 
                        : 'text-gray-400 hover:text-gray-100 hover:bg-gradient-to-r hover:from-white/5 hover:to-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-neon shadow-[0_0_15px_rgba(44,255,5,0.8)]"></div>}
                      <link.icon className={`w-4 h-4 transition-all duration-300 z-10 ${isActive ? 'text-neon' : 'text-gray-500 group-hover:text-gray-300 group-hover:scale-110'}`} />
                      <span className="transition-transform duration-300 group-hover:translate-x-1 z-10">{link.name}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border border-gray-800/60 m-4 rounded-xl bg-[#0e1015] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-neon shadow-[0_0_8px_rgba(44,255,5,0.8)]"></span>
          </span>
          <span className="text-[11px] font-bold tracking-wide text-gray-300 uppercase">System Live</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
