'use client';

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Map, Download, AlertCircle, Radar, Github, Sparkles } from 'lucide-react';
import { HeatMap } from '@/components/HeatMap';
import { NodeSidebar } from '@/components/NodeSidebar';
import { FilterBar } from '@/components/FilterBar';
import { FingerprintCard } from '@/components/FingerprintCard';
import { LoadingState } from '@/components/LoadingState';
import { ProgressBar } from '@/components/ProgressBar';
import { SecurityCollapseBanner } from '@/components/SecurityCollapseBanner';
import { SecurityOverview } from '@/components/SecurityOverview';
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
    criticalSecurityOnly: false,
    owaspCategories: [],
    cweCategories: [],
    securityScoreThreshold: 0,
    secretLeaksOnly: false,
    injectionOnly: false,
  });

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/analysis/${analysisId}?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load');

      console.log("Analysis API response:", data);
      if (data.analysis) {
        console.log("Polling update:", data.analysis.status, data.analysis.progress);
      }

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
    let timeoutId: ReturnType<typeof setTimeout>;
    let currentDelay = 3000; // Start at 3 seconds (Requirement 6)

    const tick = async () => {
      if (!active) return;
      const shouldContinue = await poll();
      if (!active) return;
      if (shouldContinue) {
        // Exponential backoff: scale polling interval up to 15s max (Requirement 6)
        currentDelay = Math.min(currentDelay * 1.25, 15000);
        timeoutId = setTimeout(tick, currentDelay);
      }
    };

    tick();
    return () => {
      active = false;
      clearTimeout(timeoutId);
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
      if (n.debt_score > filter.maxScore) return false;
      if (n.debt_score < filter.minScore) return false;
      if (n.security_score < filter.securityScoreThreshold) return false;
      if (!filter.nodeTypes.includes(n.node_type)) return false;
      if (filter.criticalSecurityOnly && !n.has_critical_security) return false;
      if (filter.owaspCategories.length > 0 && !n.owasp_categories.some((category) => filter.owaspCategories.includes(category))) return false;
      if (filter.cweCategories.length > 0 && !n.cwe_categories.some((category) => filter.cweCategories.includes(category))) return false;
      if (filter.secretLeaksOnly && !n.security_findings.some((finding) => finding.category === 'Secrets')) return false;
      if (filter.injectionOnly && !n.security_findings.some((finding) => finding.category === 'Injection' || finding.owaspIds.includes('A03'))) return false;
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

  const availableOwaspCategories = useMemo(
    () => [...new Set(nodes.flatMap((node) => node.owasp_categories ?? []))].sort(),
    [nodes]
  );

  const availableCweCategories = useMemo(
    () => [...new Set(nodes.flatMap((node) => node.cwe_categories ?? []))].sort(),
    [nodes]
  );

  const securityFindings = useMemo(
    () => nodes.flatMap((node) => node.security_findings ?? []),
    [nodes]
  );

  const collapseBanner = useMemo(() => {
    if (!analysis?.security_collapse) return null;
    const affectedCoreModules = [...new Set(nodes.filter((node) => node.has_critical_security).map((node) => node.file_path))].slice(0, 8);
    const reasons = [
      `Critical vulnerabilities: ${analysis.critical_vulnerabilities}`,
      `Repository security score: ${analysis.repo_security_score.toFixed(1)}/100`,
      `Affected modules: ${affectedCoreModules.length}`,
    ];
    const severity: 'critical' | 'high' | 'moderate' = analysis.repo_security_score > 85 ? 'critical' : 'high';
    return {
      isCollapsed: true,
      severity,
      reasons,
      affectedCoreModules,
      propagationRisk: Math.min(100, Math.round(analysis.repo_security_score * 0.8 + analysis.critical_vulnerabilities * 6)),
    };
  }, [analysis, nodes]);

  const isLoading =
    !analysis ||
    (analysis.status !== 'complete' && analysis.status !== 'failed');

  if (error) {
    const isRateLimit = error.toLowerCase().includes('rate limit') || error.toLowerCase().includes('quota');
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center glass-panel rounded-xl border border-white/5 p-8 shadow-2xl">
        <AlertCircle className={`w-12 h-12 ${isRateLimit ? 'text-amber-500' : 'text-accent-rose'} mx-auto mb-4 animate-pulse`} />
        <h2 className="text-xl font-semibold mb-2 text-slate-100">
          {isRateLimit ? 'GitHub Quota Paused' : 'Analysis Failed'}
        </h2>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">{error}</p>

        {isRateLimit ? (
          <div className="flex flex-col gap-3 items-center">
            <button
              type="button"
              onClick={() => {
                setError(null);
                // Perform a reload or dynamic fetch retry
                window.location.reload();
              }}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg text-sm font-semibold transition-all hover:scale-105 active:scale-95"
            >
              Check Quota & Resume Job
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-slate-500 hover:text-slate-300 text-xs transition-colors mt-2"
            >
              Analyze another repository
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-accent-cyan hover:underline text-sm font-medium"
          >
            Try another repo
          </button>
        )}
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
    <div className="max-w-[1600px] mx-auto px-6 py-6 flex gap-6 min-h-[calc(100vh-8rem)] fade-in-up">
      {/* Left Floating Vertical Sidebar */}
      <aside className="hidden md:flex w-20 bg-white/60 backdrop-blur border border-[rgba(176,122,77,0.14)] rounded-[32px] py-8 flex-col items-center gap-8 shadow-sm shrink-0 sticky top-24 h-[calc(100vh-10rem)]">
        {/* Centered Icons with Hover Animations */}
        <div className="bg-[#efe8de] text-[#9a6a43] p-3.5 rounded-[20px] shadow-inner cursor-pointer hover:scale-105 active:scale-95 transition-all">
          <Radar className="w-5 h-5" />
        </div>
        <div className="text-[#8f8175] hover:text-[#2b2622] hover:bg-[#f5eee6]/50 p-3.5 rounded-[20px] cursor-pointer transition-all">
          <Map className="w-5 h-5" />
        </div>
        <div className="text-[#8f8175] hover:text-[#2b2622] hover:bg-[#f5eee6]/50 p-3.5 rounded-[20px] cursor-pointer transition-all">
          <Sparkles className="w-5 h-5" />
        </div>
      </aside>

      {/* Main content grid area */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        {/* Repository Header Section */}
        <div className="glass-panel rounded-[24px] p-6 flex flex-wrap items-center justify-between gap-4 border border-[rgba(176,122,77,0.14)] bg-white/40 shadow-sm">
          <div className="flex items-center gap-3">
            <Github className="w-6 h-6 text-[#9a6a43] shrink-0" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-extrabold text-2xl text-slate-900 tracking-tight leading-tight">
                  {analysis.repo_owner}/{analysis.repo_name}
                </h1>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fffdf9] border border-[rgba(176,122,77,0.14)] rounded-full text-xs font-bold text-[#93ab68] shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#93ab68] inline-block animate-pulse" />
                  <span>Analyzed</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-bold mt-1.5 flex items-center gap-2">
                <span>{analysis.total_nodes} nodes</span>
                <span className="text-slate-300">•</span>
                <span>avg score <span className="text-[#9a6a43] font-mono font-bold">{analysis.avg_debt_score}</span></span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/roadmap/${analysisId}`}
              className="flex items-center gap-2 bg-[#f5eee6]/70 hover:bg-[#eadecf] border border-[rgba(176,122,77,0.25)] px-4.5 py-2.5 rounded-xl text-sm text-[#9a6a43] font-bold shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Map className="w-4 h-4" />
              Roadmap
            </Link>
            <a
              href={`/api/export/${analysisId}`}
              download
              className="flex items-center gap-2 bg-[#f5eee6]/70 hover:bg-[#eadecf] border border-[rgba(176,122,77,0.25)] px-4.5 py-2.5 rounded-xl text-sm text-[#9a6a43] font-bold shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              <Download className="w-4 h-4" />
              CSV
            </a>
          </div>
        </div>

        {collapseBanner && (
          <SecurityCollapseBanner collapse={collapseBanner} criticalFindings={analysis.critical_vulnerabilities} />
        )}

        <SecurityOverview analysis={analysis} nodes={nodes} />

        {/* Dynamic visual graph and filters block */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
          <div className="lg:w-[70%] flex flex-col gap-6 min-h-0">
            <div className="flex-1 min-h-[480px] relative">
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

          <div className="lg:w-[30%] flex flex-col gap-6 min-h-0 overflow-y-auto scrollbar-thin">
            <FingerprintCard
              label={analysis.fingerprint_label}
              confidence={analysis.fingerprint_confidence}
            />
            <FilterBar
              filter={filter}
              onChange={setFilter}
              nodeCount={filteredNodes.length}
              availableOwaspCategories={availableOwaspCategories}
              availableCweCategories={availableCweCategories}
            />
            <div className="hidden lg:block flex-1 min-h-[200px]">
              <NodeSidebar node={selected} analysisId={analysisId} />
            </div>
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
