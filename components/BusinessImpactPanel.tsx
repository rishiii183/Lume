import type { BusinessTranslationResult } from '@/types';

export function BusinessImpactPanel({
  risks,
  operationalRisks,
  customerImpact,
  ignoreConsequences,
}: {
  risks: BusinessTranslationResult[];
  operationalRisks: string[];
  customerImpact: string[];
  ignoreConsequences: string[];
}) {
  const top = risks[0] ?? null;

  return (
    <section className="glass-panel rounded-[24px] p-6 border border-white/10 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-100">Business impact</h3>
        <p className="text-sm text-slate-400">How the repository risk affects customers, operations, and the business.</p>
      </div>
      {top && (
        <div className="rounded-2xl bg-white/5 p-4 text-sm text-slate-300 space-y-2">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Executive summary</div>
          <div className="text-slate-100 font-medium">{top.executiveSummary}</div>
          <div className="text-slate-300">{top.businessImpact}</div>
          <div className="text-slate-400 text-xs">Urgency: {top.urgency}</div>
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-3 text-sm text-slate-300">
        <ListCard title="Customer impact" items={customerImpact} accent="text-cyan-100" />
        <ListCard title="Operational risks" items={operationalRisks} accent="text-amber-100" />
        <ListCard title="If ignored" items={ignoreConsequences} accent="text-rose-100" />
      </div>
    </section>
  );
}

function ListCard({ title, items, accent }: { title: string; items: string[]; accent: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4 space-y-2">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{title}</div>
      <div className={`space-y-1 text-sm ${accent}`}>
        {items.length > 0 ? items.map((item) => <div key={item}>{item}</div>) : <div className="text-slate-400">No additional notes.</div>}
      </div>
    </div>
  );
}
