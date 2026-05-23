import type { BusinessTranslationResult } from '@/types';

export function NonTechnicalExplanation({ translation }: { translation: BusinessTranslationResult | null }) {
  if (!translation) return null;

  return (
    <section className="rounded-[24px] border border-white/10 bg-slate-950/40 p-5 space-y-3">
      <div>
        <h4 className="text-base font-semibold text-slate-100">Business explanation</h4>
        <p className="text-sm text-slate-400">Plain language summary for non-technical stakeholders.</p>
      </div>
      <p className="text-sm text-slate-200 leading-relaxed">{translation.executiveSummary}</p>
      <div className="grid gap-2 text-sm text-slate-300 md:grid-cols-2">
        <Line label="Customer impact" value={translation.customerImpact} />
        <Line label="Operational risk" value={translation.operationalRisk} />
        <Line label="Financial risk" value={translation.financialRisk} />
        <Line label="Recommended action" value={translation.recommendedAction} />
      </div>
    </section>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-3">
      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-1 text-slate-100">{value}</div>
    </div>
  );
}
