import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, updateNodeExplanation } from '@/lib/supabase/server';
import { generateDebtExplanation } from '@/lib/huggingface';
import { fetchRepositoryFiles } from '@/lib/github';
import { getCodeSnippet } from '@/lib/ast-parser';

export async function POST(request: NextRequest) {
  try {
    const { nodeId, analysisId } = await request.json();
    if (!nodeId || !analysisId) {
      return NextResponse.json(
        { error: 'nodeId and analysisId are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const { data: node, error: nodeError } = await supabase
      .from('debt_nodes')
      .select('*')
      .eq('id', nodeId)
      .single();

    if (nodeError || !node) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 });
    }

    if (node.explanation) {
      return NextResponse.json({ explanation: node.explanation });
    }

    const { data: analysis } = await supabase
      .from('analyses')
      .select('repo_owner, repo_name')
      .eq('id', analysisId)
      .single();

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    let codeSnippet = `// ${node.symbol_name} in ${node.file_path}\n// Lines ${node.line_start}-${node.line_end}`;
    try {
      const files = await fetchRepositoryFiles(
        analysis.repo_owner,
        analysis.repo_name
      );
      const file = files.find((f) => f.path === node.file_path);
      if (file) {
        codeSnippet = getCodeSnippet(file.content, node.line_start, node.line_end);
      }
    } catch {
      /* use placeholder snippet */
    }

    const explanation = await generateDebtExplanation({
      filePath: node.file_path,
      symbolName: node.symbol_name,
      debtScore: node.debt_score,
      complexity: node.complexity,
      blastRadius: node.blast_radius,
      codeSnippet,
    });

    await updateNodeExplanation(nodeId, explanation);

    return NextResponse.json({ explanation });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate explanation' },
      { status: 500 }
    );
  }
}
