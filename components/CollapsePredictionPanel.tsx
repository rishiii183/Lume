import type { CollapsePredictionResult } from '@/types';
import { RiskTimeline } from '@/components/RiskTimeline';

export function CollapsePredictionPanel({ prediction }: { prediction: CollapsePredictionResult | null }) {
  if (!prediction) return null;
  return (
    <section className="glass-panel rounded-[24px] p-6 border border-white/10 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Collapse prediction</h3>
          <p className="text-sm text-slate-400">Probability and trend for architectural collapse.</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-100">{Math.round(prediction.collapseProbability)}%</div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{prediction.predictedTimeline}</div>
        </div>
      </div>
      <RiskTimeline points={prediction.riskTrend} />
      <div className="grid gap-3 md:grid-cols-2 text-sm text-slate-300">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Critical modules</div>
          <div className="flex flex-wrap gap-2">{prediction.criticalModules.map((item) => <span key={item} className="rounded-full bg-white/5 px-3 py-1 text-xs">{item}</span>)}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">Drivers</div>
          <div className="flex flex-wrap gap-2">{prediction.instabilityDrivers.map((item) => <span key={item} className="rounded-full bg-rose-500/10 px-3 py-1 text-xs text-rose-200">{item}</span>)}</div>
        </div>
      </div>
    </section>
  );
}
