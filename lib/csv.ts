import Papa from 'papaparse';
import type { DebtNode, RoadmapItem } from '@/types';
import { computePriority } from '@/lib/debt-scorer';

export function nodesToRoadmap(nodes: DebtNode[]): RoadmapItem[] {
  return nodes
    .map((node, index) => ({
      rank: index + 1,
      nodeId: node.id,
      filePath: node.file_path,
      symbolName: node.symbol_name,
      debtScore: node.debt_score,
      blastRadius: node.blast_radius,
      priority: computePriority(node.debt_score, node.blast_radius),
      explanation: node.explanation,
    }))
    .sort((a, b) => b.priority - a.priority)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

export function exportToCSV(nodes: DebtNode[]): string {
  const roadmap = nodesToRoadmap(nodes);
  const rows = roadmap.map((item) => ({
    Rank: item.rank,
    'File Path': item.filePath,
    Symbol: item.symbolName,
    'Debt Score': item.debtScore,
    'Blast Radius': item.blastRadius,
    Priority: item.priority,
    Explanation: item.explanation ?? '',
  }));
  return Papa.unparse(rows);
}
