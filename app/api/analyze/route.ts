import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, updateAnalysisProgress } from '@/lib/supabase/server';
import { parseGitHubUrl } from '@/lib/utils';
import { fetchRepositoryFiles } from '@/lib/github';
import { parseRepository, getCodeSnippet } from '@/lib/ast-parser';
import { computeDuplicationScores } from '@/lib/duplication';
import { computeBlastRadius, buildGraphData } from '@/lib/blast-radius';
import { scoreAllSymbols, averageScore } from '@/lib/debt-scorer';
import { classifyAgentCode } from '@/lib/huggingface';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const repoUrl = body.repoUrl as string;
    if (!repoUrl) {
      return NextResponse.json({ error: 'repoUrl is required' }, { status: 400 });
    }

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data: analysis, error: insertError } = await supabase
      .from('analyses')
      .insert({
        repo_url: repoUrl,
        repo_owner: parsed.owner,
        repo_name: parsed.repo,
        status: 'pending',
        progress: 0,
        progress_message: 'Starting analysis...',
      })
      .select()
      .single();

    if (insertError || !analysis) {
      return NextResponse.json(
        { error: insertError?.message ?? 'Failed to create analysis' },
        { status: 500 }
      );
    }

    const analysisId = analysis.id as string;

    runPipeline(analysisId, parsed.owner, parsed.repo).catch(async (err) => {
      await updateAnalysisProgress(analysisId, {
        status: 'failed',
        progress: 0,
        error_message: err instanceof Error ? err.message : 'Analysis failed',
        progress_message: 'Analysis failed',
      });
    });

    return NextResponse.json({ analysisId, status: 'pending' });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

async function runPipeline(
  analysisId: string,
  owner: string,
  repo: string
): Promise<void> {
  await updateAnalysisProgress(analysisId, {
    status: 'fetching',
    progress: 10,
    progress_message: 'Fetching repository files from GitHub...',
  });

  const files = await fetchRepositoryFiles(owner, repo);

  await updateAnalysisProgress(analysisId, {
    status: 'parsing',
    progress: 30,
    progress_message: `Parsing ${files.length} files with AST analysis...`,
    total_files: files.length,
  });

  const symbols = parseRepository(files);
  const fileMap = new Map(files.map((f) => [f.path, f.content]));

  const duplicationScores = computeDuplicationScores(files);
  const blastRadiusMap = computeBlastRadius(symbols);
  const debtScores = scoreAllSymbols(symbols, duplicationScores, blastRadiusMap);
  const avgScore = averageScore(debtScores);

  await updateAnalysisProgress(analysisId, {
    status: 'scoring',
    progress: 55,
    progress_message: `Scored ${symbols.length} symbols. Computing graph...`,
    total_nodes: symbols.length,
    avg_debt_score: avgScore,
  });

  const { topSymbols, links } = buildGraphData(symbols, debtScores, blastRadiusMap);

  let fingerprintLabel: string | null = null;
  let fingerprintConfidence: number | null = null;

  const worstSymbol = topSymbols[0];
  if (worstSymbol && process.env.HUGGINGFACE_API_KEY) {
    try {
      const content = fileMap.get(worstSymbol.filePath) ?? '';
      const snippet = getCodeSnippet(content, worstSymbol.lineStart, worstSymbol.lineEnd);
      const fp = await classifyAgentCode(snippet);
      fingerprintLabel = fp.label;
      fingerprintConfidence = fp.confidence;
    } catch {
      /* fingerprint optional */
    }
  }

  await updateAnalysisProgress(analysisId, {
    status: 'graphing',
    progress: 75,
    progress_message: 'Building dependency graph and saving nodes...',
    fingerprint_label: fingerprintLabel ?? undefined,
    fingerprint_confidence: fingerprintConfidence ?? undefined,
  });

  const topIds = new Set(topSymbols.map((s) => s.id));

  const nodesToInsert = topSymbols.map((sym) => ({
    analysis_id: analysisId,
    file_path: sym.filePath,
    symbol_name: sym.name,
    node_type: sym.type,
    line_start: sym.lineStart,
    line_end: sym.lineEnd,
    debt_score: debtScores.get(sym.id) ?? 0,
    complexity: sym.complexity,
    duplication_score: duplicationScores.get(sym.filePath) ?? 0,
    blast_radius: blastRadiusMap.get(sym.id) ?? 0,
    dependencies: sym.calls.filter((c) => topIds.has(c)),
    dependents: sym.calledBy.filter((c) => topIds.has(c)),
    explanation: null,
    fingerprint_tag: sym.id === worstSymbol?.id ? fingerprintLabel : null,
    x: null,
    y: null,
  }));

  const supabase = createServiceClient();
  const batchSize = 100;
  for (let i = 0; i < nodesToInsert.length; i += batchSize) {
    const batch = nodesToInsert.slice(i, i + batchSize);
    const { error } = await supabase.from('debt_nodes').insert(batch);
    if (error) throw new Error(`Failed to insert nodes: ${error.message}`);
  }

  await updateAnalysisProgress(analysisId, {
    status: 'complete',
    progress: 100,
    progress_message: 'Analysis complete!',
    total_nodes: topSymbols.length,
    avg_debt_score: avgScore,
    fingerprint_label: fingerprintLabel ?? undefined,
    fingerprint_confidence: fingerprintConfidence ?? undefined,
  });
}
