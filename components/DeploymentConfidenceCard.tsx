import type { DeploymentConfidenceResult } from '@/types';

export function DeploymentConfidenceCard({ confidence }: { confidence: DeploymentConfidenceResult | null }) {
  if (!confidence) return null;

  return (
    <section className="glass-panel rounded-[24px] p-6 border border-white/10 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Deployment confidence</h3>
          <p className="text-sm text-slate-400">Decision support for shipping safely.</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-slate-100">{Math.round(confidence.deploymentConfidence)}</div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{confidence.deploymentRecommendation}</div>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 text-sm text-slate-300">
        <Info label="Production readiness" value={confidence.productionReadiness} />
        <Info label="Customer risk" value={confidence.customerRiskLevel} />
        <Info label="Operational stability" value={confidence.operationalStability} />
        <Info label="Architecture health" value={confidence.architectureHealth} />
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-slate-300">
        {confidence.factors.map((factor) => (
          <span key={factor} className="rounded-full bg-white/5 px-3 py-1">{factor}</span>
        ))}
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-1 text-slate-100">{value}</div>
    </div>
  );
}
