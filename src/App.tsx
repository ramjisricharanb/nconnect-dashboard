import { useState, useEffect, useMemo } from 'react';
import { UploadZone } from './components/UploadZone';
import { KPICards } from './components/KPICards';
import { parseExcelData, parseExcelBuffer } from './utils/excelParser';
import type { DashboardData, ModuleData } from './utils/excelParser';
import { Layers, Activity, Server, Search, ChevronDown, Star, ChevronRight } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

// Hardcoded Major Modules
const MAJOR_MODULES_DEPLOYED = [
  "HouseKeeping & Security(Flutter)",
  "HouseKeeping & Security(Admin&Web App)",
  "Parent Check - in Module",
  "nScribe Enhancements phase2",
  "GPS Dashboard",
  "GPS Device Management - nTransport"
];

const MAJOR_MODULES_ONGOING = [
  "Learning & Development",
  "Retention Calling",
  "Bus Tracking",
  "Branch Analytics",
  "AI Counsellor"
];

// Helper to fix grammar and spelling mistakes from the Excel sheet
const formatModuleName = (name: string) => {
  return name
    .replace('HouseKeeping', 'Housekeeping')
    .replace('(Admin&Web App)', ' (Admin & Web App)')
    .replace('Check - in', 'Check-in')
    .replace('enhancements phase2', 'Enhancements Phase 2')
    .replace('Enhancements phase2', 'Enhancements Phase 2')
    .replace(' - nTransport', '');
};

function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoLoading, setIsAutoLoading] = useState(true);
  
  // Explorer state
  const [activeFilter, setActiveFilter] = useState<string>('Ongoing');
  const [selectedModule, setSelectedModule] = useState<ModuleData | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Major Modules state
  const [activeMajorFilter, setActiveMajorFilter] = useState<'Deployed' | 'Ongoing' | 'Upcoming'>('Deployed');
  const [isMajorDropdownOpen, setIsMajorDropdownOpen] = useState(false);

  const filters = ['Ongoing', 'Recently Deployed', 'Upcoming'];
  const majorFilters = ['Deployed', 'Ongoing', 'Upcoming'] as const;

  useEffect(() => {
    const fetchDefaultData = async () => {
      try {
        const response = await fetch('./nConnect Module Status.xlsx');
        if (!response.ok) throw new Error('Default file not found');
        
        const arrayBuffer = await response.arrayBuffer();
        const parsedData = await parseExcelBuffer(arrayBuffer);
        setData(parsedData);
        
        const firstMajorName = MAJOR_MODULES_DEPLOYED[0];
        const foundMajor = parsedData.modules.find(m => m.name.toLowerCase() === firstMajorName.toLowerCase());
        
        if (foundMajor) {
          setSelectedModule(foundMajor);
          setActiveFilter(foundMajor.category);
        } else {
          const activeModules = parsedData.modules.filter(m => m.category === 'Ongoing');
          if (activeModules.length > 0) {
            setSelectedModule(activeModules[0]);
          }
        }
      } catch (err) {
        console.warn('Could not load default dataset. User must upload manually.', err);
      } finally {
        setIsAutoLoading(false);
      }
    };
    fetchDefaultData();
  }, []);

  const handleUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const parsedData = await parseExcelData(file);
      setData(parsedData);
      
      // Auto-select first major module if available, else first regular module
      const firstMajorName = MAJOR_MODULES_DEPLOYED[0];
      const foundMajor = parsedData.modules.find(m => m.name.toLowerCase() === firstMajorName.toLowerCase());
      
      if (foundMajor) {
        setSelectedModule(foundMajor);
        setActiveFilter(foundMajor.category);
      } else {
        const activeModules = parsedData.modules.filter(m => m.category === 'On Going');
        if (activeModules.length > 0) {
          setSelectedModule(activeModules[0]);
        }
      }
    } catch (err) {
      setError('Failed to parse the Excel file. Please make sure it is a valid execution sheet.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredModules = data?.modules.filter(m => m.category === activeFilter) || [];
  
  // Only show major modules that ACTUALLY exist in the uploaded Excel sheet
  // Dynamically compute the major modules to display
  const currentMajorModulesList = useMemo(() => {
    if (!data) return [];
    
    if (activeMajorFilter === 'Upcoming') {
      return data.modules.filter(m => m.category === 'Upcoming');
    }
    
    const rawMajorList = activeMajorFilter === 'Deployed' ? MAJOR_MODULES_DEPLOYED : MAJOR_MODULES_ONGOING;
    return rawMajorList.map(moduleName => {
      return data.modules.find(m => m.name.toLowerCase() === moduleName.toLowerCase());
    }).filter(Boolean) as ModuleData[];
  }, [data, activeMajorFilter]);

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

  const handleMajorFilterSelect = (filter: 'Deployed' | 'Ongoing' | 'Upcoming') => {
    setActiveMajorFilter(filter);
    setIsMajorDropdownOpen(false);
  };

  const handleMajorModuleClick = (moduleName: string) => {
    const foundModule = data?.modules.find(m => m.name.toLowerCase() === moduleName.toLowerCase());
    if (foundModule) {
      setSelectedModule(foundModule);
      setActiveFilter(foundModule.category);
    } else {
      // Fallback if not found
      let mappedCategory = 'Ongoing';
      if (activeMajorFilter === 'Deployed') mappedCategory = 'Recently Deployed';
      if (activeMajorFilter === 'Upcoming') mappedCategory = 'Upcoming';

      setSelectedModule({
        id: `mock-${moduleName}`,
        name: moduleName,
        category: mappedCategory,
        status: 'Data Not Found',
        feature: 'This module was not found in the currently uploaded Excel sheet. Please verify the spelling or upload an updated sheet.'
      });
      setActiveFilter(mappedCategory);
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
    <div className="min-h-screen relative bg-dashboard-bg pb-12">
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
                nConnect <span className="font-medium opacity-90">Overview</span>
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
            {isLoading || isAutoLoading ? (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-300 rounded-2xl bg-white shadow-lg">
                <div className="w-8 h-8 border-4 border-accent-purple border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-600 font-semibold tracking-wide">
                  {isAutoLoading ? 'Loading default data...' : 'Analyzing execution data...'}
                </p>
              </div>
            ) : (
              <UploadZone onUpload={handleUpload} />
            )}
          </div>
        ) : (
          <div className="animate-in fade-in duration-500 space-y-6">
            {/* Top KPIs */}
            <KPICards kpi={data.kpi} />

            {/* MAJOR MODULES SECTION */}
            <div className="bg-card-bg border border-card-border rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-accent-purple flex items-center justify-center border border-indigo-100">
                    <Star className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold text-text-main tracking-tight">Major Modules Highlights</h2>
                </div>

                {/* Major Modules Dropdown */}
                <div className="relative w-full md:w-64">
                  <button 
                    onClick={() => setIsMajorDropdownOpen(!isMajorDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-2 bg-dashboard-bg border border-card-border rounded-lg text-sm font-semibold text-text-main hover:bg-card-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent-purple/50"
                  >
                    <span>Major Modules <span className="text-accent-purple">{activeMajorFilter}</span></span>
                    <ChevronDown className={twMerge("w-4 h-4 text-slate-500 transition-transform", isMajorDropdownOpen && "rotate-180")} />
                  </button>
                  
                  {isMajorDropdownOpen && (
                    <div className="absolute z-30 w-full mt-2 bg-card-bg border border-card-border rounded-xl shadow-xl overflow-hidden py-1">
                      {majorFilters.map(filter => (
                        <button
                          key={filter}
                          onClick={() => handleMajorFilterSelect(filter)}
                          className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-card-hover hover:text-text-main transition-colors flex items-center justify-between"
                        >
                          Major Modules {filter}
                          {activeMajorFilter === filter && <div className="w-2 h-2 rounded-full bg-accent-purple" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Major Modules Grid */}
              {currentMajorModulesList.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-slate-400 bg-dashboard-bg/50 rounded-xl border border-dashed border-card-border">
                  <Star className="w-6 h-6 mb-2 opacity-50" />
                  <p className="text-sm font-medium">No major modules found in the current Excel sheet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                  {currentMajorModulesList.map((moduleItem, idx) => {
                    const isActive = selectedModule?.name.toLowerCase() === moduleItem.name.toLowerCase();
                    return (
                      <button
                        key={idx}
                        onClick={() => handleMajorModuleClick(moduleItem.name)}
                        className={twMerge(
                          "relative group flex flex-col items-start p-4 bg-white rounded-xl border transition-all duration-300 text-left overflow-hidden min-h-[90px]",
                          isActive 
                            ? "border-accent-purple/50 shadow-md ring-1 ring-accent-purple bg-accent-purple text-white" 
                            : "border-card-border hover:border-accent-purple/30 hover:shadow-md hover:-translate-y-0.5"
                        )}
                      >
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                        )}
                        <span className={twMerge(
                          "text-xs font-bold leading-tight",
                          isActive ? "text-white" : "text-slate-700"
                        )}>
                          {formatModuleName(moduleItem.name)}
                        </span>
                        <div className={twMerge(
                          "self-end mt-2 p-1 rounded-full",
                          isActive ? "bg-white/20" : "bg-dashboard-bg"
                        )}>
                          <ChevronRight className={twMerge(
                            "w-3 h-3",
                            isActive ? "text-white" : "text-slate-400"
                          )} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-420px)] min-h-[500px]">
              
              {/* LEFT COLUMN: Module Explorer */}
              <div className="lg:col-span-4 bg-card-bg border border-card-border rounded-2xl flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="p-5 border-b border-card-border bg-card-bg">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">All Modules</h2>
                  
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
                          {formatModuleName(module.name)}
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
                      <h2 className="text-3xl font-extrabold text-text-main mb-5 tracking-tight">{formatModuleName(selectedModule.name)}</h2>
                      <div className="flex items-center gap-4">
                        <span className={twMerge(
                          "px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-white rounded-md shadow-sm",
                          selectedModule.status === 'Data Not Found' ? 'bg-red-500' : 'bg-accent-purple'
                        )}>
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
                        <div className={twMerge(
                          "w-1.5 h-1.5 rounded-full",
                          selectedModule.status === 'Data Not Found' ? 'bg-red-500' : 'bg-accent-purple'
                        )}></div>
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
