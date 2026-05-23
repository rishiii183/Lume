import { NextRequest, NextResponse } from 'next/server';
import { getAnalysis, getDebtNodes } from '@/lib/supabase/server';
import type { GraphLink } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const analysis = await getAnalysis(params.id);
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    const nodes = await getDebtNodes(params.id);

    const symbolToNodeId = new Map<string, string>();
    for (const node of nodes) {
      symbolToNodeId.set(`${node.file_path}::${node.symbol_name}`, node.id);
    }

    const links: GraphLink[] = [];
    const seen = new Set<string>();

    for (const node of nodes) {
      const deps = (node.dependencies as string[]) ?? [];
      for (const depKey of deps) {
        const targetId = symbolToNodeId.get(depKey) ?? depKey;
        const targetNode = nodes.find((n) => n.id === targetId);
        if (!targetNode) continue;
        const key = [node.id, targetNode.id].sort().join('->');
        if (!seen.has(key)) {
          seen.add(key);
          links.push({
            source: node.id,
            target: targetNode.id,
            weight: node.debt_score,
          });
        }
      }
    }

    return NextResponse.json({
      analysis,
      nodes,
      links,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
