import Papa from 'papaparse';
import type { DebtNode, RoadmapItem } from '@/types';
import { computePriority } from '@/lib/debt-scorer';
import { computeSecurityAwarePriority } from '@/lib/security/security-scorer';

export function nodesToRoadmap(nodes: DebtNode[]): RoadmapItem[] {
  return nodes
    .map((node, index) => ({
      rank: index + 1,
      nodeId: node.id,
      filePath: node.file_path,
      symbolName: node.symbol_name,
      debtScore: node.debt_score,
      securityScore: node.security_score,
      vulnerabilityCount: node.vulnerability_count,
      criticalSecurity: node.has_critical_security,
      owaspCategories: node.owasp_categories,
      cweCategories: node.cwe_categories,
      blastRadius: node.blast_radius,
      securityPriority: computeSecurityAwarePriority({
        debtScore: node.debt_score,
        blastRadius: node.blast_radius,
        securityScore: node.security_score,
      }),
      priority: computePriority(node.debt_score, node.blast_radius),
      explanation: node.explanation,
    }))
    .sort((a, b) => b.securityPriority - a.securityPriority || b.priority - a.priority)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}

export function exportToCSV(nodes: DebtNode[]): string {
  const roadmap = nodesToRoadmap(nodes);
  const rows = roadmap.map((item) => ({
    Rank: item.rank,
    'File Path': item.filePath,
    Symbol: item.symbolName,
    'Debt Score': item.debtScore,
    'Security Score': item.securityScore,
    'Vulnerability Count': item.vulnerabilityCount,
    'Critical Security': item.criticalSecurity,
    OWASP: item.owaspCategories.join('; '),
    'CWE Categories': item.cweCategories.join('; '),
    'Blast Radius': item.blastRadius,
    'Security Priority': item.securityPriority,
    Priority: item.priority,
    Explanation: item.explanation ?? '',
  }));
  return Papa.unparse(rows);
}
