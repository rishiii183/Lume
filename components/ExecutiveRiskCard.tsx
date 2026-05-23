import type { AnalysisRecord } from '@/types';

export function ExecutiveRiskCard({ analysis }: { analysis: AnalysisRecord | null }) {
  if (!analysis) return null;

  return (
    <section className="glass-panel rounded-[24px] p-6 border border-white/10 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-100">Executive risk summary</h3>
        <p className="text-sm text-slate-400">A concise trust and deployment view for decision makers.</p>
      </div>
      <p className="text-sm text-slate-200 leading-relaxed">{analysis.executiveSummary ?? 'Executive summary not yet available.'}</p>
      <div className="grid gap-3 md:grid-cols-4 text-sm text-slate-300">
        <Metric label="Trust score" value={analysis.trustScore ?? 0} />
        <Metric label="Deployment confidence" value={analysis.deploymentConfidence ?? 0} />
        <Metric label="Operational risks" value={analysis.operationalRisks?.length ?? 0} />
        <Metric label="Customer impact" value={analysis.customerImpact?.length ?? 0} />
      </div>
      {analysis.deploymentRecommendation && (
        <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100">
          Deployment recommendation: {analysis.deploymentRecommendation}
        </div>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-1 text-slate-100 font-semibold">{value}</div>
    </div>
  );
}
