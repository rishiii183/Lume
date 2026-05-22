'use client';

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Map, Download, AlertCircle } from 'lucide-react';
import { HeatMap } from '@/components/HeatMap';
import { NodeSidebar } from '@/components/NodeSidebar';
import { FilterBar } from '@/components/FilterBar';
import { FingerprintCard } from '@/components/FingerprintCard';
import { LoadingState } from '@/components/LoadingState';
import { ProgressBar } from '@/components/ProgressBar';
import type {
  AnalysisRecord,
  DebtNode,
  GraphLink,
  FilterState,
} from '@/types';

function AnalyzeContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisId = params.id as string;

  const [analysis, setAnalysis] = useState<AnalysisRecord | null>(null);
  const [nodes, setNodes] = useState<DebtNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [selected, setSelected] = useState<DebtNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterState>({
    minScore: 0,
    maxScore: 100,
    nodeTypes: ['function', 'class', 'module', 'variable'],
    search: '',
  });

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/analysis/${analysisId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load');

      setAnalysis(data.analysis);
      setNodes(data.nodes ?? []);
      setLinks(data.links ?? []);

      if (data.analysis.status === 'failed') {
        setError(data.analysis.error_message ?? 'Analysis failed');
        return false;
      }
      return data.analysis.status !== 'complete';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
      return false;
    }
  }, [analysisId]);

  useEffect(() => {
    let active = true;
    let interval: ReturnType<typeof setInterval>;

    const run = async () => {
      const shouldContinue = await poll();
      if (!active) return;
      if (shouldContinue) {
        interval = setInterval(async () => {
          const cont = await poll();
          if (!cont) clearInterval(interval);
        }, 2000);
      }
    };

    run();
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [poll]);

  useEffect(() => {
    const nodeId = searchParams.get('node');
    if (nodeId && nodes.length > 0) {
      const found = nodes.find((n) => n.id === nodeId);
      if (found) setSelected(found);
    }
  }, [searchParams, nodes]);

  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      if (n.debt_score < filter.minScore) return false;
      if (!filter.nodeTypes.includes(n.node_type)) return false;
      if (filter.search) {
        const q = filter.search.toLowerCase();
        if (
          !n.symbol_name.toLowerCase().includes(q) &&
          !n.file_path.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [nodes, filter]);

  const filteredLinks = useMemo(() => {
    const ids = new Set(filteredNodes.map((n) => n.id));
    return links.filter(
      (l) => ids.has(l.source as string) && ids.has(l.target as string)
    );
  }, [links, filteredNodes]);

  const isLoading =
    !analysis ||
    (analysis.status !== 'complete' && analysis.status !== 'failed');

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <AlertCircle className="w-12 h-12 text-accent-rose mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Analysis Failed</h2>
        <p className="text-slate-400 mb-6">{error}</p>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="text-accent-cyan hover:underline"
        >
          Try another repo
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <LoadingState
          progress={analysis?.progress ?? 0}
          message={analysis?.progress_message}
          title={`Analyzing ${analysis?.repo_owner ?? ''}/${analysis?.repo_name ?? 'repository'}`}
        />
        {analysis && (
          <div className="mt-6">
            <ProgressBar
              progress={analysis.progress}
              message={analysis.progress_message}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col max-w-[100vw]">
      <div className="px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-white/5">
        <div>
          <h1 className="font-semibold text-lg">
            {analysis.repo_owner}/{analysis.repo_name}
          </h1>
          <p className="text-sm text-slate-500">
            {analysis.total_nodes} nodes · avg score {analysis.avg_debt_score}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/roadmap/${analysisId}`}
            className="flex items-center gap-2 glass-panel px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-accent-cyan transition-colors"
          >
            <Map className="w-4 h-4" />
            Roadmap
          </Link>
          <a
            href={`/api/export/${analysisId}`}
            download
            className="flex items-center gap-2 glass-panel px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-accent-cyan transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV
          </a>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0">
        <div className="lg:w-[70%] flex flex-col gap-4 min-h-0">
          <div className="flex-1 min-h-[400px] relative">
            <HeatMap
              nodes={filteredNodes}
              links={filteredLinks}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
            />
          </div>
          <div className="lg:hidden">
            <NodeSidebar
              node={selected}
              analysisId={analysisId}
              onClose={() => setSelected(null)}
            />
          </div>
        </div>

        <div className="lg:w-[30%] flex flex-col gap-4 min-h-0 overflow-y-auto scrollbar-thin">
          <FingerprintCard
            label={analysis.fingerprint_label}
            confidence={analysis.fingerprint_confidence}
          />
          <FilterBar
            filter={filter}
            onChange={setFilter}
            nodeCount={filteredNodes.length}
          />
          <div className="hidden lg:block flex-1 min-h-[200px]">
            <NodeSidebar node={selected} analysisId={analysisId} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnalyzeClient() {
  return (
    <Suspense fallback={<LoadingState title="Loading analysis" />}>
      <AnalyzeContent />
    </Suspense>
  );
}
