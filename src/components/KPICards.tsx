import { Layers, CheckCircle2, Clock } from 'lucide-react';

interface KPICardsProps {
  kpi: {
    ongoing: number;
    deployed: number;
    upcoming: number;
  };
}

export const KPICards: React.FC<KPICardsProps> = ({ kpi }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* On Going Card */}
      <div className="bg-card-bg border border-card-border rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2.5 rounded-lg bg-blue-50 text-accent-blue border border-blue-100">
            <Layers className="w-5 h-5" />
          </div>
          <span className="px-2.5 py-1 text-[10px] font-bold text-accent-blue bg-blue-50 rounded border border-blue-100">
            Active
          </span>
        </div>
        <div>
          <p className="text-text-muted text-[11px] font-bold mb-1.5 uppercase tracking-widest">On Going</p>
          <h3 className="text-3xl font-extrabold text-text-main tracking-tight">{kpi.ongoing}</h3>
        </div>
      </div>

      {/* Recently Deployed Card */}
      <div className="bg-card-bg border border-card-border rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-accent-green border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="px-2.5 py-1 text-[10px] font-bold text-accent-green bg-emerald-50 rounded border border-emerald-100">
            Completed
          </span>
        </div>
        <div>
          <p className="text-text-muted text-[11px] font-bold mb-1.5 uppercase tracking-widest">Recently Deployed</p>
          <h3 className="text-3xl font-extrabold text-text-main tracking-tight">{kpi.deployed}</h3>
        </div>
      </div>

      {/* Up Coming Card */}
      <div className="bg-card-bg border border-card-border rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2.5 rounded-lg bg-amber-50 text-accent-amber border border-amber-100">
            <Clock className="w-5 h-5" />
          </div>
          <span className="px-2.5 py-1 text-[10px] font-bold text-accent-amber bg-amber-50 rounded border border-amber-100">
            Planned
          </span>
        </div>
        <div>
          <p className="text-text-muted text-[11px] font-bold mb-1.5 uppercase tracking-widest">Up Coming</p>
          <h3 className="text-3xl font-extrabold text-text-main tracking-tight">{kpi.upcoming}</h3>
        </div>
      </div>
    </div>
  );
};
