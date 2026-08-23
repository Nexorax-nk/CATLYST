import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database, ShieldCheck, Zap, Activity, BrainCircuit, Box, Workflow, Layers,
  ArrowRight, ChevronRight, FileCode2, AlertTriangle, CheckCircle2, Download,
  Server, ListTree, SlidersHorizontal, UserCheck, CheckCircle, Link2,
  FileText, Factory, Search, Package, Settings, Ruler,
  Network, Scan, Sparkles, PackageCheck, Grip, DatabaseZap
} from 'lucide-react';

function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-neon/30 selection:text-neon overflow-x-hidden font-sans">

      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-neon/5 blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-md border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10">
              <Layers className="w-8 h-8 text-neon" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white tracking-wider uppercase leading-none">
                CATALYST
              </span>
              <span className="text-[10px] mt-1 text-gray-400 font-semibold tracking-widest uppercase">
                Product Intelligence
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            <div className="flex flex-col items-center gap-1 cursor-pointer">
              <span className="text-neon text-xs font-bold tracking-widest uppercase">Overview</span>
              <div className="flex items-center w-full justify-center gap-1">
                <div className="h-px bg-neon/50 w-full"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-neon"></div>
                <div className="h-px bg-neon/50 w-full"></div>
              </div>
            </div>
            {['Product', 'Platform', 'Solutions', 'Resources', 'About'].map((item) => (
              <span key={item} className="text-gray-300 hover:text-white text-xs font-bold tracking-widest uppercase cursor-pointer transition-colors">
                {item}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/overview')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-700 rounded-full hover:border-neon/50 transition-colors bg-[#0a0b0e]"
            >
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon shadow-[0_0_8px_rgba(44,255,5,0.8)]"></span>
              </div>
              <span className="text-xs font-bold tracking-widest text-white uppercase">
                Live System
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="relative z-10 pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 min-h-screen flex items-center border-b border-white/5">

        {/* Full-width Absolute Background Container */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            src="/upscaled-video.mp4"
            className="w-full h-full object-cover mix-blend-screen opacity-90"
          />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10 pointer-events-none">
          {/* Left Text Content */}
          <div className="flex flex-col items-start text-left max-w-3xl pointer-events-auto -translate-y-6 lg:-translate-x-8 lg:-translate-y-12 xl:-translate-x-12 xl:-translate-y-16">
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span>Intelligence.</span> <span>Accuracy.</span> <span className="text-neon">Impact.</span>
            </div>

            <h1 className="text-5xl lg:text-[5.5rem] font-black tracking-tight mb-2 leading-none animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100 uppercase">
              <span className="text-white block mb-[-5px]">PRODUCT</span>
              <span className="text-neon block">INTELLIGENCE</span>
            </h1>

            <div className="flex items-center gap-4 mt-8 mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              <div className="w-8 h-px bg-neon"></div>
              <p className="text-xs font-bold tracking-[0.2em] text-gray-300 uppercase">
                Real-Time. Trusted. Commerce-Ready.
              </p>
            </div>

            <div className="border-l-2 border-neon pl-6 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              <p className="text-xl lg:text-2xl text-gray-300 font-serif italic max-w-lg">
                “Clean data doesn't happen.<br />
                Intelligent systems <span className="text-neon font-bold">create</span> it.”
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-400">
              <button
                onClick={() => navigate('/overview')}
                className="group relative px-6 py-4 bg-[#0a0b0e] border-2 border-neon text-white text-xs font-bold tracking-[0.15em] uppercase rounded-full hover:bg-neon hover:text-black transition-all shadow-[0_0_20px_rgba(44,255,5,0.1)] hover:shadow-[0_0_40px_rgba(44,255,5,0.3)] inline-flex items-center justify-center gap-3"
              >
                Enter Command Center <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => { document.getElementById('pipeline').scrollIntoView({ behavior: 'smooth' }) }}
                className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase hover:text-white transition-colors flex items-center gap-2 group"
              >
                Scroll to explore <div className="w-6 h-6 rounded-full border border-gray-700 flex items-center justify-center group-hover:border-white transition-colors"><ChevronRight className="w-3 h-3 rotate-90" /></div>
              </button>
            </div>
          </div>
        </div>

        {/* HERO BOTTOM STRIP (Floating Glass Bar) */}
        <div className="absolute bottom-0 lg:bottom-8 left-0 right-0 lg:left-12 lg:right-12 z-20 border-y lg:border border-white/10 bg-black/40 backdrop-blur-2xl py-6 lg:rounded-2xl overflow-x-auto overflow-y-hidden whitespace-nowrap shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <div className="max-w-7xl mx-auto px-8 flex items-center justify-between gap-6 min-w-max">
            {[
              { step: "RAW INPUT", desc: "Messy supplier data", icon: Database },
              { step: "CLASSIFY", desc: "Taxonomy intelligence", icon: ListTree },
              { step: "ENRICH", desc: "Product attributes", icon: Zap },
              { step: "VALIDATE", desc: "Rules + evidence", icon: ShieldCheck },
              { step: "COMMERCE READY", desc: "Structured output", icon: CheckCircle2 }
            ].map((item, i, arr) => (
              <React.Fragment key={i}>
                <div className="flex items-center gap-4 group cursor-default">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neon group-hover:scale-110 group-hover:bg-neon/10 group-hover:border-neon/30 transition-all duration-300">
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-neon text-[10px] font-bold tracking-widest uppercase mb-1">{item.step}</span>
                    <span className="text-white text-sm font-semibold tracking-wide group-hover:text-neon transition-colors duration-300">{item.desc}</span>
                  </div>
                </div>
                {i < arr.length - 1 && <div className="text-white/20 font-light text-2xl px-1 lg:px-2">/</div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </main>

      {/* SECTION 02 */}
      <section className="relative z-10 min-h-screen w-full bg-white flex items-center overflow-hidden border-t border-white/5">
        {/* Background Image - Align to right to reduce empty space */}
        <div className="absolute inset-0 pointer-events-none p-4 lg:py-12 lg:pl-12 lg:pr-4">
          <img
            src="/second bg.png"
            alt="Section 2 Background"
            className="w-full h-full object-contain object-right"
          />
        </div>

        {/* Floating Boxes Around Cube */}
        <div className="hidden xl:flex absolute inset-y-0 right-0 w-[55%] pointer-events-none items-center justify-center p-8 z-10">
          <div className="relative w-full max-w-[800px] aspect-[4/3]">
            {[
              { title: "Cryptic Descriptions", desc: "3/8 CPLG BRS 150#", icon: FileText, pos: "top-[10%] left-[5%]" },
              { title: "Missing Attributes", desc: "Critical product specifications left empty", icon: Search, pos: "top-[50%] left-[-5%] -translate-y-1/2" },
              { title: "Uncontrolled Values", desc: "Different units, abbreviations and terminology", icon: Settings, pos: "bottom-[10%] left-[5%]" },
              { title: "Inconsistent Manufacturers", desc: "Multiple spellings for the same company", icon: Factory, pos: "top-[10%] right-[0%]" },
              { title: "Wrong Classification", desc: "Products mapped to the wrong taxonomy", icon: Package, pos: "top-[50%] right-[-5%] -translate-y-1/2" },
              { title: "Unverified Enrichment", desc: "Generated information without reliable evidence", icon: Ruler, pos: "bottom-[10%] right-[0%]" }
            ].map((box, i) => (
              <div key={i} className={`absolute ${box.pos} bg-white rounded-xl border border-green-500 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-3 flex items-start gap-3 w-[240px] pointer-events-auto hover:shadow-[0_15px_40px_rgba(0,0,0,0.1)] transition-all duration-300`}>
                <box.icon className="w-5 h-5 text-gray-800 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5">
                  <p className="font-bold text-[13px] text-black leading-tight">{box.title}</p>
                  <p className="text-[11px] text-gray-600 leading-tight">{box.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Area - Made more compact vertically */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-6 py-12 lg:py-16 pointer-events-auto flex items-center">
          <div className="flex flex-col max-w-xl xl:max-w-2xl bg-white/60 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none p-6 lg:p-0 rounded-2xl lg:-translate-x-16 xl:-translate-x-18">
            {/* Overline */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-green-600 font-bold tracking-[0.2em] uppercase text-xs lg:text-sm">The Catalog Problem</span>
              <div className="h-px bg-green-600/30 flex-1 max-w-[100px]"></div>
            </div>

            {/* Headline */}
            <h2 className="text-5xl lg:text-7xl font-black text-black tracking-tight mb-4 leading-none">
              Why Product<br />Data Fails
            </h2>

            {/* Subheadline */}
            <p className="text-lg lg:text-xl text-gray-600 font-medium mb-4">
              Industrial product catalogs are<br />rarely ready for commerce.
            </p>

            <p className="text-black font-semibold text-base mb-4">
              A single raw record can contain:
            </p>

            {/* List */}
            <div className="flex flex-col gap-4 mb-8 border-l-2 border-green-500 py-1 pl-5">
              {[
                { title: "Cryptic descriptions", desc: "3/8 CPLG BRS 150#" },
                { title: "Inconsistent manufacturers", desc: "Multiple spellings for the same company" },
                { title: "Missing attributes", desc: "Critical product specifications left empty" },
                { title: "Uncontrolled values", desc: "Different units, abbreviations and terminology" },
                { title: "Wrong classification", desc: "Products mapped to the wrong taxonomy" },
                { title: "Unverified enrichment", desc: "Generated information without reliable evidence" }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 lg:w-5 lg:h-5 text-green-600 shrink-0 mt-0.5 lg:mt-0" />
                  <p className="text-black text-sm lg:text-base leading-tight">
                    <span className="font-bold">{item.title}:</span> <span className="text-gray-700">{item.desc}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* Highlight Box */}
            <div className="bg-gradient-to-r from-[#eaf9e6] to-[#f4fbf1] backdrop-blur-md rounded-xl p-4 flex items-center gap-4 border border-green-200 border-l-[6px] border-l-green-600 shadow-sm max-w-md">
              <Link2 className="w-5 h-5 lg:w-6 lg:h-6 text-green-700 shrink-0" />
              <p className="text-black text-sm lg:text-base font-medium leading-snug">
                <span className="font-bold text-green-700">CATALYST</span> connects the context behind every product record.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 03 — THE TRANSFORMATION PIPELINE */}
      <section className="relative z-10 min-h-screen w-full bg-[#030504] flex items-center overflow-hidden border-t border-white/5 py-12 lg:py-16">
        {/* Background Image */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src="/third bg.png"
            alt="Pipeline Background"
            className="w-full h-full object-cover mix-blend-screen opacity-90"
          />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-6 z-10">
          {/* Header */}
          <div className="text-center mb-12 lg:mb-16">
            <span className="inline-block py-1.5 px-4 rounded-full border border-[#39ff14]/30 bg-[#39ff14]/10 text-[#39ff14] font-bold tracking-[0.2em] uppercase text-[10px] lg:text-xs mb-6 backdrop-blur-md">
              From raw data to commerce-ready
            </span>
            <h2 className="text-4xl lg:text-6xl font-bold text-white tracking-tight">
              One pipeline.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#39ff14] to-[#12a102]">Six</span> transformations.
            </h2>
          </div>

          {/* Graphic Pipeline */}
          <div className="relative flex flex-col md:flex-row justify-between items-center w-full max-w-6xl mx-auto mb-12 lg:mb-20 gap-6 md:gap-0">
            {/* The glowing line (visible only on desktop) */}
            <div className="hidden md:block absolute top-[60%] left-[4%] right-[4%] h-[1px] bg-gradient-to-r from-transparent via-[#39ff14]/20 to-transparent -translate-y-1/2 z-0">
              <div className="absolute top-1/2 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-[#39ff14] to-transparent shadow-[0_0_15px_rgba(57,255,20,0.5)] -translate-y-1/2"></div>
            </div>

            {[
              { label: 'RAW', icon: Grip },
              { label: 'PARSED', icon: ListTree },
              { label: 'CLASSIFIED', icon: Network },
              { label: 'ENRICHED', icon: DatabaseZap },
              { label: 'VALIDATED', icon: ShieldCheck },
              { label: 'COMMERCE READY', icon: PackageCheck }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-4 z-10 relative">
                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{step.label}</span>

                {/* Main Node Box */}
                <div className="w-16 h-16 md:w-20 md:h-20 bg-[#090b0a] border border-white/5 rounded-2xl flex items-center justify-center relative shadow-xl">

                  {/* Subtle top reflection for the node */}
                  <div className="absolute inset-x-1 top-1 h-1/3 bg-gradient-to-b from-white/[0.03] to-transparent rounded-t-xl pointer-events-none" />

                  {/* Arrows between items */}
                  {i > 0 && (
                    <div className="hidden md:flex absolute -left-[2.25rem] lg:-left-[3rem] top-1/2 -translate-y-1/2 w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-gradient-to-b from-[#1c221e] to-[#050706] border border-black shadow-[0_5px_10px_rgba(0,0,0,0.5)] items-center justify-center z-20">
                      {/* Inner glossy reflection for arrow button */}
                      <div className="absolute inset-x-1 top-0.5 h-[35%] bg-gradient-to-b from-white/10 to-transparent rounded-t-full pointer-events-none" />
                      <ChevronRight className="w-3 h-3 lg:w-4 lg:h-4 text-[#7dfa14]" strokeWidth={3} />
                    </div>
                  )}

                  <step.icon className="w-6 h-6 md:w-8 md:h-8 text-[#7dfa14] relative z-10" strokeWidth={1.5} />
                </div>
              </div>
            ))}
          </div>

          {/* 6 Details Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-5 mb-4 lg:mb-8">
            {[
              { num: "01", title: "Parse", desc: "Understand messy descriptions, identifiers and supplier fields.", icon: FileText },
              { num: "02", title: "Classify", desc: "Map products to the appropriate taxonomy and classpath.", icon: Network },
              { num: "03", title: "Extract", desc: "Identify product attributes, values, dimensions and specifications.", icon: Scan },
              { num: "04", title: "Enrich", desc: "Expand incomplete product information using available evidence.", icon: DatabaseZap },
              { num: "05", title: "Normalize", desc: "Standardize manufacturers, brands, UOMs and controlled values.", icon: SlidersHorizontal },
              { num: "06", title: "Validate", desc: "Check confidence, rules, consistency and source-backed information before delivery.", icon: ShieldCheck }
            ].map((card, i) => (
              <div key={i} className="group relative bg-[#060907] border border-white/5 rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:border-[#39ff14]/30 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(57,255,20,0.1)] flex flex-col h-full cursor-default">

                {/* Top highlight line on hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#39ff14] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="flex justify-between items-start mb-6 relative z-10">
                  <span className="text-[#39ff14] font-bold text-xl lg:text-2xl">{card.num}</span>
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                    <card.icon className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                  </div>
                </div>

                <h3 className="text-white font-bold text-base lg:text-lg mb-3 relative z-10">{card.title}</h3>
                <p className="text-gray-400 text-[13px] leading-relaxed relative z-10">{card.desc}</p>

                {/* Subtle dotted pattern overlay */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-20 group-hover:opacity-40 pointer-events-none transition-opacity duration-300" style={{ maskImage: 'linear-gradient(to bottom, transparent, black)' }}></div>
              </div>
            ))}
          </div>

        </div>
      </section>



      {/* SECTION 05 — INTELLIGENCE ARCHITECTURE */}
      <section className="relative z-10 w-full min-h-[calc(100vh-80px)] flex flex-col justify-center items-center overflow-hidden pt-10 pb-16 lg:pb-24">
        {/* Background Image */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <img
            src="/fourth bg.png"
            alt="Architecture Background"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="w-full max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-8 lg:mb-12 relative z-30">
            <h2 className="text-[10px] font-bold tracking-widest text-neon drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)] uppercase mb-3">ONE PLATFORM. MULTIPLE INTELLIGENCE LAYERS.</h2>
            <h3 className="text-3xl lg:text-5xl font-black text-gray-900 tracking-tight">Intelligence Architecture</h3>
          </div>

          <div className="relative flex flex-col lg:flex-row items-center justify-center lg:justify-between w-full max-w-5xl mx-auto lg:h-[500px]">
            
            {/* Intricate SVG Neural Web Connectors */}
            <div className="absolute inset-0 pointer-events-none hidden lg:block z-0">
              <svg viewBox="0 0 1024 500" preserveAspectRatio="xMidYMid meet" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="grad-left" x1="100%" y1="50%" x2="0%" y2="50%">
                    <stop offset="0%" stopColor="#7dfa14" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="grad-right" x1="0%" y1="50%" x2="100%" y2="50%">
                    <stop offset="0%" stopColor="#7dfa14" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                  </linearGradient>
                  
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>

                {/* Spinning Geometric Architecture (Behind Core) */}
                <g style={{ transformOrigin: '512px 250px', animation: 'spin 40s linear infinite' }}>
                  <polygon points="512,125 665,175 665,325 512,375 359,325 359,175" fill="none" stroke="#7dfa14" strokeWidth="1" strokeDasharray="3 8" opacity="0.4" />
                </g>
                <g style={{ transformOrigin: '512px 250px', animation: 'spin 60s linear infinite reverse' }}>
                  <polygon points="512,75 765,150 765,350 512,425 259,350 259,150" fill="none" stroke="black" strokeWidth="1" strokeDasharray="2 4" opacity="0.15" />
                </g>

                {/* Structural Foundation Lines (Black Bezier Curves) */}
                <g stroke="black" strokeWidth="1.5" opacity="0.15" fill="none">
                  <path d="M 512,250 C 400,250 400,35 308,35" />
                  <path d="M 512,250 L 236,250" />
                  <path d="M 512,250 C 400,250 400,466 308,466" />
                  
                  <path d="M 512,250 C 624,250 624,35 716,35" />
                  <path d="M 512,250 L 788,250" />
                  <path d="M 512,250 C 624,250 624,466 716,466" />
                </g>

                {/* Active Data Streams (Neon Green Data Packets) */}
                <g strokeWidth="2.5" fill="none">
                  <path d="M 512,250 C 400,250 400,35 308,35" stroke="url(#grad-left)" pathLength="100" strokeDasharray="15 100" className="animate-[packet_2.5s_linear_infinite]" style={{ animationDelay: '0s' }} filter="url(#glow)" />
                  <path d="M 512,250 L 236,250" stroke="url(#grad-left)" pathLength="100" strokeDasharray="15 100" className="animate-[packet_2.5s_linear_infinite]" style={{ animationDelay: '0.4s' }} filter="url(#glow)" />
                  <path d="M 512,250 C 400,250 400,466 308,466" stroke="url(#grad-left)" pathLength="100" strokeDasharray="15 100" className="animate-[packet_2.5s_linear_infinite]" style={{ animationDelay: '0.8s' }} filter="url(#glow)" />
                  
                  <path d="M 512,250 C 624,250 624,35 716,35" stroke="url(#grad-right)" pathLength="100" strokeDasharray="15 100" className="animate-[packet_2.5s_linear_infinite]" style={{ animationDelay: '0.2s' }} filter="url(#glow)" />
                  <path d="M 512,250 L 788,250" stroke="url(#grad-right)" pathLength="100" strokeDasharray="15 100" className="animate-[packet_2.5s_linear_infinite]" style={{ animationDelay: '0.6s' }} filter="url(#glow)" />
                  <path d="M 512,250 C 624,250 624,466 716,466" stroke="url(#grad-right)" pathLength="100" strokeDasharray="15 100" className="animate-[packet_2.5s_linear_infinite]" style={{ animationDelay: '1.0s' }} filter="url(#glow)" />
                </g>
                
                {/* Connection Nodes (Glowing Dots at exact target edges) */}
                <circle cx="308" cy="35" r="4" fill="#7dfa14" filter="url(#glow)" className="animate-pulse" />
                <circle cx="236" cy="250" r="4" fill="#7dfa14" filter="url(#glow)" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
                <circle cx="308" cy="466" r="4" fill="#7dfa14" filter="url(#glow)" className="animate-pulse" style={{ animationDelay: '0.8s' }} />
                
                <circle cx="716" cy="35" r="4" fill="#7dfa14" filter="url(#glow)" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
                <circle cx="788" cy="250" r="4" fill="#7dfa14" filter="url(#glow)" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
                <circle cx="716" cy="466" r="4" fill="#7dfa14" filter="url(#glow)" className="animate-pulse" style={{ animationDelay: '1.0s' }} />
              </svg>
              
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes packet {
                  0% { stroke-dashoffset: 115; opacity: 0; }
                  10% { opacity: 1; }
                  90% { opacity: 1; }
                  100% { stroke-dashoffset: -15; opacity: 0; }
                }
              `}} />
            </div>
            
            {/* Concentric Dotted Circles (Adapted for Light Background) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 hidden lg:flex items-center justify-center pointer-events-none">
              <div className="absolute w-[220px] h-[220px] rounded-full border border-dashed border-[#7dfa14]/50" style={{ animation: 'spin 30s linear infinite' }}></div>
              <div className="absolute w-[450px] h-[450px] rounded-full border border-dashed border-black/10" style={{ animation: 'spin 45s linear infinite reverse' }}></div>
              <div className="absolute w-[650px] h-[650px] rounded-full border border-dashed border-black/5" style={{ animation: 'spin 60s linear infinite' }}></div>
            </div>

            {/* LEFT COLUMN: Nodes 01, 02, 03 */}
            <div className="flex flex-col gap-4 lg:justify-between lg:h-full w-full lg:w-[260px] z-10 mb-10 lg:mb-0">
              {[
                { num: "01", title: "EXTRACTION", subtitle: "SEMANTIC INTELLIGENCE", transform: "lg:translate-x-12 lg:-translate-y-6" },
                { num: "02", title: "TAXONOMY", subtitle: "CLASSIFICATION", transform: "lg:-translate-x-6" },
                { num: "03", title: "ENRICHMENT", subtitle: "PRODUCT CONTENT", transform: "lg:translate-x-12 lg:translate-y-6" }
              ].map((item, i) => (
                <div key={i} className={`bg-[#050608] border border-white/5 border-l-[3px] border-l-[#7dfa14] p-5 lg:p-6 shadow-[0_15px_40px_rgba(0,0,0,0.15)] relative transition-all duration-300 hover:bg-[#0a0c0f] hover:-translate-y-1 hover:border-white/10 hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] group overflow-hidden ${item.transform || ''}`}>
                  {/* Scanner beam effect */}
                  <div className="absolute top-0 left-[-3px] w-[3px] h-0 bg-white shadow-[0_0_10px_white] group-hover:h-full transition-all duration-700 ease-out z-20"></div>
                  
                  <span className="text-[#7dfa14] text-[10px] font-bold mb-2 block">{item.num}</span>
                  <h4 className="text-white text-2xl lg:text-3xl font-black uppercase tracking-tight mb-1 group-hover:text-[#7dfa14] transition-colors duration-300">{item.title}</h4>
                  <p className="text-gray-500 text-[9px] tracking-widest uppercase">{item.subtitle}</p>
                </div>
              ))}
            </div>

            {/* CENTER NODE (Adapted for Light Background) */}
            <div className="lg:absolute lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 z-20 mb-10 lg:mb-0">
              <div className="w-56 h-56 lg:w-[220px] lg:h-[220px] rounded-full bg-[#050608] border-2 border-[#7dfa14] shadow-[0_20px_50px_rgba(0,0,0,0.2),_0_0_30px_rgba(125,250,20,0.3)] flex flex-col items-center justify-center relative mx-auto group">
                {/* Core Rings */}
                <div className="absolute inset-[10px] rounded-full border border-[#7dfa14]/20 pointer-events-none border-t-[#7dfa14]" style={{ animation: 'spin 4s linear infinite' }}></div>
                <div className="absolute inset-[20px] rounded-full border border-[#7dfa14]/10 pointer-events-none border-b-[#7dfa14]" style={{ animation: 'spin 6s linear infinite reverse' }}></div>
                
                <span className="text-[#7dfa14] text-[8px] lg:text-[9px] font-bold tracking-[0.2em] mb-1.5 uppercase relative z-10 transition-all duration-300 group-hover:text-white">MULTI-AGENT SYSTEM</span>
                <h3 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-1 relative z-10">CORE</h3>
                <span className="text-gray-500 text-[8px] uppercase tracking-widest relative z-10">CATALYST ORCHESTRATOR</span>
              </div>
            </div>

            {/* RIGHT COLUMN: Nodes 04, 05, 06 */}
            <div className="flex flex-col gap-4 lg:justify-between lg:h-full w-full lg:w-[260px] z-10">
              {[
                { num: "04", title: "NORMALIZE", subtitle: "CATALOG CONSISTENCY", transform: "lg:-translate-x-12 lg:-translate-y-6" },
                { num: "05", title: "VALIDATION", subtitle: "QUALITY & COMPLIANCE", transform: "lg:translate-x-6" },
                { num: "06", title: "HUMAN", subtitle: "HUMAN-IN-THE-LOOP", transform: "lg:-translate-x-12 lg:translate-y-6" }
              ].map((item, i) => (
                <div key={i} className={`bg-[#050608] border border-white/5 border-l-[3px] border-l-[#7dfa14] p-5 lg:p-6 shadow-[0_15px_40px_rgba(0,0,0,0.15)] relative transition-all duration-300 hover:bg-[#0a0c0f] hover:-translate-y-1 hover:border-white/10 hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)] group overflow-hidden ${item.transform || ''}`}>
                  {/* Scanner beam effect */}
                  <div className="absolute top-0 left-[-3px] w-[3px] h-0 bg-white shadow-[0_0_10px_white] group-hover:h-full transition-all duration-700 ease-out z-20"></div>
                  
                  <span className="text-[#7dfa14] text-[10px] font-bold mb-2 block">{item.num}</span>
                  <h4 className="text-white text-2xl lg:text-3xl font-black uppercase tracking-tight mb-1 group-hover:text-[#7dfa14] transition-colors duration-300">{item.title}</h4>
                  <p className="text-gray-500 text-[9px] tracking-widest uppercase">{item.subtitle}</p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>



      {/* SECTION 09 & 10 — SCALE & BATCH PROCESSING */}
      <section className="relative z-10 pb-24 lg:pb-32 pt-16 lg:pt-20 px-6 bg-[#050608] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[10px] font-bold tracking-widest text-neon uppercase mb-4">BUILT FOR THE CATALOG. NOT JUST THE DEMO.</h2>
            <h3 className="text-3xl lg:text-5xl font-bold">Process at Catalog Scale</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-8 mb-16">
            {[
              { val: "1,000+", label: "Raw product records" },
              { val: "252", label: "Output fields supported" },
              { val: "161K+", label: "Controlled LOV values" },
              { val: "27K+", label: "Manufacturer / brand records" }
            ].map((stat, i) => (
              <div key={i} className="text-center p-6 border border-gray-800 rounded-xl bg-gradient-to-b from-gray-900/50 to-transparent">
                <span className="text-3xl lg:text-4xl font-extrabold text-white block mb-2">{stat.val}</span>
                <span className="text-xs text-gray-400 uppercase tracking-widest">{stat.label}</span>
              </div>
            ))}
          </div>

          <p className="text-center text-lg text-gray-400 max-w-3xl mx-auto mb-20">
            From a handful of products to thousands of catalog records, the pipeline processes data dynamically rather than relying on hardcoded examples. <span className="text-white">Upload once. Enrich in controlled batches.</span>
          </p>

          {/* Batch Processing Flow */}
          <div className="bg-[#16181d] rounded-2xl p-8 border border-gray-800 max-w-4xl mx-auto text-center">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 relative">
              {/* Desktop connecting line */}
              <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-gray-800 -translate-y-1/2 z-0"></div>

              {[
                "1,000 PRODUCTS",
                "10 BATCHES",
                "100 PROD / BATCH",
                "AI ENRICHMENT",
                "VALIDATION",
                "MERGED OUTPUT"
              ].map((step, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[#0a0b0e] border-2 border-gray-700 flex items-center justify-center mb-3 text-neon">
                    {i === 0 ? <Database className="w-5 h-5" /> :
                      i === 1 ? <Layers className="w-5 h-5" /> :
                        i === 2 ? <Box className="w-5 h-5" /> :
                          i === 3 ? <BrainCircuit className="w-5 h-5" /> :
                            i === 4 ? <ShieldCheck className="w-5 h-5" /> :
                              <Server className="w-5 h-5" />}
                  </div>
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest w-24 text-center">{step}</span>
                  {i < 5 && <ArrowRight className="md:hidden w-4 h-4 text-gray-600 my-2 rotate-90" />}
                </div>
              ))}
            </div>

            <div className="mt-12 flex justify-center flex-wrap gap-4 lg:gap-12 text-[10px] lg:text-xs text-gray-400 uppercase tracking-widest font-bold">
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-neon" /> Automatic processing</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-neon" /> Retryable jobs</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-neon" /> Progress tracking</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-neon" /> Failure isolation</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 11 — OUTPUT & FINAL */}
      <section className="relative z-10 py-32 lg:py-48 px-6 text-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <img
            src="/fourth bg.png"
            alt="Final Output Background"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="text-4xl lg:text-6xl font-black mb-6 leading-tight text-gray-900 tracking-tight">
            RAW DATA IN. <br /><span className="text-neon drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">COMMERCE-READY DATA OUT.</span>
          </h2>
          <p className="text-xl text-gray-600 font-semibold mb-12">CATALYST turns product complexity into catalog intelligence.</p>

          <button
            onClick={() => navigate('/overview')}
            className="px-10 py-5 bg-[#050608] text-white text-sm font-bold tracking-[0.2em] uppercase rounded-xl hover:bg-neon hover:text-black transition-all shadow-[0_15px_40px_rgba(0,0,0,0.2)] hover:shadow-[0_0_60px_rgba(44,255,5,0.4)] group inline-flex items-center gap-3"
          >
            Enter Command Center <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 py-8 border-t border-white/5 bg-[#050608] text-center">
        <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase block mb-2">CATALYST · PRODUCT INTELLIGENCE</span>
        <span className="text-xs text-gray-600 tracking-widest">PARSE · CLASSIFY · ENRICH · NORMALIZE · VALIDATE</span>
      </footer>

    </div>
  );
}

export default LandingPage;
