'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Radar } from 'lucide-react';
import { RoadmapTable } from '@/components/RoadmapTable';
import { FingerprintCard } from '@/components/FingerprintCard';
import { LoadingState } from '@/components/LoadingState';
import { nodesToRoadmap } from '@/lib/csv';
import type { AnalysisRecord, DebtNode, RoadmapItem } from '@/types';

export default function RoadmapPage() {
  const params = useParams();
  const analysisId = params.id as string;
  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/analysis/${analysisId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setAnalysis(data.analysis);
        setItems(nodesToRoadmap((data.nodes ?? []) as DebtNode[]));
      } catch {
        /* handled by empty state */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [analysisId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <LoadingState title="Loading roadmap" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 fade-in-up">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/analyze/${analysisId}`}
          className="flex items-center justify-center p-2.5 bg-[#efe8de]/70 hover:bg-[#e5d9c8] border border-[rgba(176,123,79,0.2)] rounded-xl text-[#b07b4f] shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Radar className="w-5 h-5 text-accent-cyan" />
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Refactoring Roadmap</h1>
          </div>
          {analysis && (
            <p className="text-slate-500 text-sm mt-1.5 font-bold">
              {analysis.repo_owner}/{analysis.repo_name} — prioritized by debt score
              and blast radius
            </p>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <FingerprintCard
            label={analysis?.fingerprint_label ?? null}
            confidence={analysis?.fingerprint_confidence}
          />
          {analysis && (
            <div className="glass-panel rounded-3xl p-5 mt-4 space-y-3.5 text-sm border border-[rgba(176,123,79,0.12)] shadow-md bg-white/40">
              <Stat label="Total Nodes" value={analysis.total_nodes} />
              <Stat label="Avg Debt Score" value={analysis.avg_debt_score} />
              <Stat label="Files Scanned" value={analysis.total_files} />
            </div>
          )}
        </div>
        <div className="lg:col-span-3">
          <RoadmapTable items={items} analysisId={analysisId} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-slate-500 font-bold">{label}</span>
      <span className="text-slate-800 font-extrabold font-mono">{value}</span>
    </div>
  );
}
