import { useState } from 'react';
import { UploadZone } from './components/UploadZone';
import { KPICards } from './components/KPICards';
import { parseExcelData } from './utils/excelParser';
import type { DashboardData, ModuleData } from './utils/excelParser';
import { Layers, Activity, Server, Search, ChevronDown } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Explorer state
  const [activeFilter, setActiveFilter] = useState<string>('On Going');
  const [selectedModule, setSelectedModule] = useState<ModuleData | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filters = ['On Going', 'Recently Deployed', 'Up Coming'];

  const handleUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const parsedData = await parseExcelData(file);
      setData(parsedData);
      // Auto-select first module of active filter if available
      const activeModules = parsedData.modules.filter(m => m.category === 'On Going');
      if (activeModules.length > 0) {
        setSelectedModule(activeModules[0]);
      }
    } catch (err) {
      setError('Failed to parse the Excel file. Please make sure it is a valid execution sheet.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredModules = data?.modules.filter(m => m.category === activeFilter) || [];

  const handleFilterSelect = (filter: string) => {
    setActiveFilter(filter);
    setIsDropdownOpen(false);
    const newActiveModules = data?.modules.filter(m => m.category === filter) || [];
    if (newActiveModules.length > 0) {
      setSelectedModule(newActiveModules[0]);
    } else {
      setSelectedModule(null);
    }
  };

  const formatFeatureContent = (text: string) => {
    if (!text || text.trim() === '') return '<p>No details provided.</p>';
    
    const lines = text.split('\n');
    let html = '';
    let inList = false;
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      if (/^[-*•]\s+/.test(trimmed) || /^[-*•]/.test(trimmed) || /^\d+\./.test(trimmed)) {
        if (!inList) { html += '<ul>'; inList = true; }
        const cleanItem = trimmed.replace(/^([-*•]\s*|\d+\.\s*)/, '');
        html += `<li>${cleanItem}</li>`;
      } else {
        if (inList) { html += '</ul>'; inList = false; }
        if (trimmed.length < 60 && !trimmed.endsWith('.') && trimmed !== trimmed.toLowerCase()) {
          html += `<strong>${trimmed}</strong>`;
        } else {
          html += `<p>${trimmed}</p>`;
        }
      }
    });
    if (inList) html += '</ul>';
    return html;
  };

  return (
    <div className="min-h-screen relative bg-dashboard-bg">
      {/* Light Corporate Top Banner */}
      <div className="absolute top-0 left-0 right-0 h-[280px] bg-gradient-to-r from-accent-purple to-indigo-700 shadow-md" />

      <div className="max-w-[1400px] mx-auto px-6 py-8 relative z-10">
        <header className="mb-10 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-sm">
                NConnect <span className="font-medium opacity-90">Overview</span>
              </h1>
            </div>
            <p className="text-indigo-100 text-sm ml-14 font-medium">Executive command center for module deployment tracking.</p>
          </div>
          
          {data && (
            <button 
              onClick={() => setData(null)}
              className="px-5 py-2.5 text-sm font-semibold text-accent-purple bg-white border border-white rounded-lg hover:bg-slate-50 transition-colors shadow-lg"
            >
              Upload New Sheet
            </button>
          )}
        </header>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium shadow-sm">
            {error}
          </div>
        )}

        {!data ? (
          <div className="max-w-2xl mx-auto mt-24">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-300 rounded-2xl bg-white shadow-lg">
                <div className="w-8 h-8 border-4 border-accent-purple border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-600 font-semibold tracking-wide">Analyzing execution data...</p>
              </div>
            ) : (
              <UploadZone onUpload={handleUpload} />
            )}
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            {/* Top KPIs */}
            <KPICards kpi={data.kpi} />

            {/* 2-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-320px)] min-h-[600px]">
              
              {/* LEFT COLUMN: Module Explorer */}
              <div className="lg:col-span-4 bg-card-bg border border-card-border rounded-2xl flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="p-5 border-b border-card-border bg-card-bg">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">Modules</h2>
                  
                  {/* Dropdown Filter */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-dashboard-bg border border-card-border rounded-xl text-sm font-semibold text-text-main hover:bg-card-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent-purple/50 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <Layers className="w-5 h-5 text-accent-purple" />
                        {activeFilter}
                      </div>
                      <ChevronDown className={twMerge("w-4 h-4 text-slate-500 transition-transform", isDropdownOpen && "rotate-180")} />
                    </button>
                    
                    {isDropdownOpen && (
                      <div className="absolute z-20 w-full mt-2 bg-card-bg border border-card-border rounded-xl shadow-xl overflow-hidden py-1">
                        {filters.map(filter => (
                          <button
                            key={filter}
                            onClick={() => handleFilterSelect(filter)}
                            className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-card-hover hover:text-text-main transition-colors flex items-center justify-between"
                          >
                            {filter}
                            {activeFilter === filter && <div className="w-2 h-2 rounded-full bg-accent-purple" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* List Container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5 bg-dashboard-bg/30">
                  {filteredModules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <Search className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm font-medium">No modules found</p>
                    </div>
                  ) : (
                    filteredModules.map(module => (
                      <button
                        key={module.id}
                        onClick={() => setSelectedModule(module)}
                        className={twMerge(
                          "w-full text-left px-4 py-4 rounded-xl flex items-center justify-between transition-all duration-200 border",
                          selectedModule?.id === module.id 
                            ? "bg-accent-purple/5 border-accent-purple/30 shadow-sm" 
                            : "bg-card-bg border-transparent hover:border-card-border hover:shadow-sm"
                        )}
                      >
                        <span className={twMerge(
                          "font-semibold truncate pr-4 text-sm tracking-wide",
                          selectedModule?.id === module.id ? "text-accent-purple" : "text-text-main"
                        )}>
                          {module.name}
                        </span>
                        <span className={twMerge(
                          "shrink-0 px-2.5 py-1 text-[10px] uppercase tracking-widest font-bold rounded-md border",
                          selectedModule?.id === module.id
                            ? "bg-white text-accent-purple border-accent-purple/20 shadow-sm"
                            : "bg-dashboard-bg text-slate-500 border-card-border"
                        )}>
                          {module.status}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Feature Viewer */}
              <div className="lg:col-span-8 bg-card-bg border border-card-border rounded-2xl flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {selectedModule ? (
                  <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="p-8 border-b border-card-border bg-card-bg">
                      <h2 className="text-3xl font-extrabold text-text-main mb-5 tracking-tight">{selectedModule.name}</h2>
                      <div className="flex items-center gap-4">
                        <span className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest bg-accent-purple text-white rounded-md shadow-sm">
                          {selectedModule.status}
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className="text-slate-500 text-sm flex items-center gap-2 font-bold tracking-wide uppercase">
                          <Server className="w-4 h-4" />
                          {selectedModule.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-white">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-purple"></div>
                        Feature / Requirement Details
                      </h3>
                      <div 
                        className="formatted-text"
                        dangerouslySetInnerHTML={{ __html: formatFeatureContent(selectedModule.feature) }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                    <Activity className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">Select a module to view details.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
