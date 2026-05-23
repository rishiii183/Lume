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
  // 1. Startup validation (Requirement 2)
  if (!process.env.GITHUB_TOKEN) {
    console.error("[Startup Validation Failed] GITHUB_TOKEN environment variable is missing.");
    return NextResponse.json(
      { error: "Server Configuration Error: GITHUB_TOKEN environment variable is missing. Unauthenticated requests are disabled." },
      { status: 500 }
    );
  }

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

    console.log(`[Pipeline] Checking for active duplicate jobs for: ${parsed.owner}/${parsed.repo}`);
    const supabase = createServiceClient();

    // 2. Active-job deduplication & database queue locking (Requirement 7)
    const { data: existingActive, error: activeCheckError } = await supabase
      .from('analyses')
      .select('id, status, progress')
      .eq('repo_url', repoUrl)
      .in('status', ['pending', 'fetching', 'parsing', 'scoring', 'graphing'])
      .maybeSingle();

    if (existingActive) {
      console.log(`[Pipeline] Found active duplicate job running for: ${repoUrl} (ID: ${existingActive.id})`);
      return NextResponse.json({
        analysisId: existingActive.id,
        status: existingActive.status,
        message: 'An active analysis is already running for this repository.'
      });
    }
    
    // 3. Enqueue analysis job in Supabase database
    const { data: analysis, error: insertError } = await supabase
      .from('analyses')
      .insert({
        repo_url: repoUrl,
        repo_owner: parsed.owner,
        repo_name: parsed.repo,
        status: 'pending',
        progress: 0,
        progress_message: 'Enqueued in pipeline. Starting job...',
      })
      .select()
      .single();

    if (insertError || !analysis) {
      console.error('[Pipeline] Failed to insert initial queue record:', insertError);
      return NextResponse.json(
        { error: insertError?.message ?? 'Failed to queue analysis' },
        { status: 500 }
      );
    }

    const analysisId = analysis.id as string;
    console.log(`[Pipeline] Job enqueued successfully. Job ID: ${analysisId}`);

    // Offload parsing pipeline directly from the request lifecycle (Requirement 12)
    runPipelineWithTimeout(analysisId, parsed.owner, parsed.repo).catch(async (err) => {
      console.error(`[Pipeline Error] Critical worker error in Job ${analysisId}:`, err);
      try {
        const isRateLimit = err instanceof Error && err.message.toLowerCase().includes('rate limit');
        await updateAnalysisProgress(analysisId, {
          status: 'failed',
          progress: 0,
          error_message: err instanceof Error ? err.message : 'Job failed',
          progress_message: isRateLimit ? 'Waiting for GitHub API quota reset...' : 'Analysis job failed',
        });
        console.log(`[Pipeline] Job ${analysisId} finished with status: failed (Rate limit hit: ${isRateLimit})`);
      } catch (subErr) {
        console.error(`[Pipeline Error] Failed to update fail status for ${analysisId}:`, subErr);
      }
    });

    // Return immediate response with job status for client polling (Requirement 12)
    return NextResponse.json({ analysisId, status: 'pending' });
  } catch (err) {
    console.error('[Pipeline] POST error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

// Global Execution Timeout Protection: Terminates after 280 seconds (Requirement 19 & 14)
async function runPipelineWithTimeout(
  analysisId: string,
  owner: string,
  repo: string
): Promise<void> {
  const MAX_RUNTIME_MS = 280000; // 4.6 minutes

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Final execution timeout: Analysis job exceeded the maximum runtime of 5 minutes.`));
    }, MAX_RUNTIME_MS);
  });

  const pipelinePromise = runPipeline(analysisId, owner, repo);

  return Promise.race([pipelinePromise, timeoutPromise]);
}

async function runPipeline(
  analysisId: string,
  owner: string,
  repo: string
): Promise<void> {
  // 1. Fetch Repository files
  console.log("[Pipeline] Progress: 10");
  await updateAnalysisProgress(analysisId, {
    status: 'fetching',
    progress: 10,
    progress_message: 'fetching repo',
  });

  const files = await fetchRepositoryFiles(owner, repo, async (msg: string) => {
    await updateAnalysisProgress(analysisId, {
      status: 'fetching',
      progress: 15,
      progress_message: msg,
    });
  });

  console.log("[Pipeline] Progress: 25");
  await updateAnalysisProgress(analysisId, {
    status: 'fetching',
    progress: 25,
    progress_message: 'filtering files',
  });

  if (files.length === 0) {
    throw new Error("No valid source files found in repository matching search rules.");
  }

  // 2. Isolated file parsing and AST Extraction (Requirement 10)
  console.log("[Pipeline] Progress: 30");
  await updateAnalysisProgress(analysisId, {
    status: 'parsing',
    progress: 30,
    progress_message: 'parsing AST',
    total_files: files.length,
  });

  let symbols: any[] = [];
  try {
    for (const file of files) {
      console.log("[Parser] Processing:", file.path);
    }

    symbols = parseRepository(files);
    console.log("[Parser] AST success");
  } catch (astError) {
    console.error("[Pipeline Warning] AST parsing failed, building fallbacks:", astError);
    // Build generic fallback list of module symbols so the pipeline never crashes
    symbols = files.map(file => ({
      id: `${file.path}:__module__`,
      filePath: file.path,
      name: '__module__',
      type: 'module' as const,
      lineStart: 1,
      lineEnd: file.content.split('\n').length,
      complexity: 1,
      calls: [],
      calledBy: [],
    }));
  }

  const fileMap = new Map(files.map((f) => [f.path, f.content]));

  // 3. Isolated Duplication & Complexity Scoring (Requirement 10)
  console.log("[Pipeline] Progress: 45");
  await updateAnalysisProgress(analysisId, {
    status: 'parsing',
    progress: 45,
    progress_message: 'scoring',
  });

  let duplicationScores = new Map<string, number>();
  try {
    duplicationScores = computeDuplicationScores(files);
  } catch (dupErr) {
    console.error("[Pipeline Warning] Duplication analysis failed:", dupErr);
  }

  let blastRadiusMap = new Map<string, number>();
  try {
    blastRadiusMap = computeBlastRadius(symbols);
  } catch (brErr) {
    console.error("[Pipeline Warning] Blast radius traversal failed:", brErr);
  }

  let debtScores = new Map<string, number>();
  try {
    debtScores = scoreAllSymbols(symbols, duplicationScores, blastRadiusMap);
  } catch (scoreErr) {
    console.error("[Pipeline Warning] Debt scoring formulas failed:", scoreErr);
  }

  const avgScore = averageScore(debtScores);

  // 4. Isolated dependency graph generation (Requirement 10)
  console.log("[Pipeline] Progress: 60");
  await updateAnalysisProgress(analysisId, {
    status: 'graphing',
    progress: 60,
    progress_message: 'generating graph',
    total_nodes: symbols.length,
    avg_debt_score: avgScore,
  });

  let topSymbols: any[] = [];
  let links: any[] = [];
  try {
    const graphData = buildGraphData(symbols, debtScores, blastRadiusMap);
    topSymbols = graphData.topSymbols;
    links = graphData.links;
  } catch (graphErr) {
    console.error("[Pipeline Warning] Graph builder crashed, building stub:", graphErr);
    topSymbols = symbols.slice(0, 150);
  }

  // 5. Hugging Face AI classifier
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
    } catch (hfErr) {
      console.warn('[Pipeline Warning] Hugging Face optional service failed:', hfErr);
    }
  }

  // 6. DB Batched Nodes Insertion
  console.log("[Pipeline] Progress: 75");
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
    dependencies: sym.calls.filter((c: string) => topIds.has(c)),
    dependents: sym.calledBy.filter((c: string) => topIds.has(c)),
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
    if (error) {
      console.error(`[Pipeline Error] Nodes insertion batch failed:`, error);
      throw new Error(`Failed to save nodes in database: ${error.message}`);
    }
  }

  // 7. Complete successfully
  console.log("[Pipeline] Progress: 100");
  await updateAnalysisProgress(analysisId, {
    status: 'complete',
    progress: 100,
    progress_message: 'completed',
    total_nodes: topSymbols.length,
    avg_debt_score: avgScore,
    fingerprint_label: fingerprintLabel ?? undefined,
    fingerprint_confidence: fingerprintConfidence ?? undefined,
  });
  
  console.log(`[Pipeline] Job ${analysisId} completed successfully.`);
}
