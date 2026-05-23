import type { TrustScoreResult } from '@/types';

export function TrustScoreCard({ trust }: { trust: TrustScoreResult | null }) {
  if (!trust) return null;

  return (
    <section className="glass-panel rounded-[24px] p-6 border border-white/10 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Trust score</h3>
          <p className="text-sm text-slate-400">How trustworthy the repository is for production use.</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-slate-100">{Math.round(trust.trustScore)}</div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{trust.recommendation}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
        <Metric label="Deployment confidence" value={Math.round(trust.deploymentConfidence)} />
        <Metric label="Operational stability" value={Math.round(trust.operationalStability)} />
        <Metric label="Security exposure" value={Math.round(trust.securityExposure)} />
        <Metric label="Architecture health" value={Math.round(trust.architectureHealth)} />
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-slate-300">
        {trust.reasons.map((reason) => (
          <span key={reason} className="rounded-full bg-white/5 px-3 py-1">{reason}</span>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-100">{value}</div>
    </div>
  );
}
