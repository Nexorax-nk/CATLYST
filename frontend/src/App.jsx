import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import EnrichmentStudio from './pages/ProcessingHub'; 
import ProductIntelligence from './pages/ProductIntelligence';
import ProcessingJobs from './pages/ProcessingJobs';
import ValidationCenter from './pages/ValidationCenter';
import IntelligentSearch from './pages/IntelligentSearch';
import Analytics from './pages/Analytics';
import Sources from './pages/Sources';
import LandingPage from './pages/LandingPage';
import { Search, Bell, HelpCircle } from 'lucide-react';

// Placeholder components for Settings
const Settings = () => <div className="p-8">Settings coming soon</div>;

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route - No Sidebar */}
        <Route path="/" element={<LandingPage />} />

        {/* App Routes - With Sidebar */}
        <Route path="/*" element={
          <div className="flex h-screen bg-[#0a0b0e]">
            {/* Dark Charcoal Sidebar */}
            <Sidebar />
            
            {/* Main View */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#FAFAFA] rounded-l-[40px] overflow-hidden shadow-[-10px_0_30px_rgba(0,0,0,0.5)] relative border-l border-gray-800/30">
              {/* Main Content Area */}
              <main className="flex-1 overflow-hidden relative">
                <Routes>
                  {/* Overview */}
                  <Route path="/overview" element={<Dashboard />} />
                  
                  {/* Catalog */}
                  <Route path="/catalog" element={<Catalog />} />
                  <Route path="/product/:id" element={<ProductIntelligence />} />
                  <Route path="/search" element={<IntelligentSearch />} />
                  
                  {/* Enrichment */}
                  <Route path="/enrichment" element={<EnrichmentStudio />} />
                  <Route path="/jobs" element={<ProcessingJobs />} />
                  <Route path="/validation" element={<ValidationCenter />} />
                  
                  {/* Insights */}
                  <Route path="/analytics" element={<Analytics />} />
                  
                  {/* System */}
                  <Route path="/sources" element={<Sources />} />
                  
                  {/* Redirect legacy routes */}
                  <Route path="/process" element={<Navigate to="/enrichment" />} />
                </Routes>
              </main>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
