import type { SecurityFinding, VulnerabilitySeverity } from '@/types';
import { clampScore, severityRank } from '@/lib/security/security-utils';

export function calculateSecurityScore(counts: Record<VulnerabilitySeverity, number>): number {
  const raw =
    counts.critical * 25 +
    counts.high * 15 +
    counts.medium * 8 +
    counts.low * 3;

  return Math.round(clampScore(raw, 0, 100) * 10) / 10;
}

export function calculateFindingScore(finding: SecurityFinding): number {
  const severityBase = {
    critical: 25,
    high: 15,
    medium: 8,
    low: 3,
  }[finding.severity];

  return Math.round(clampScore(severityBase + finding.exploitability * 10, 0, 100) * 10) / 10;
}

export function calculateSecurityWeightedScore(params: {
  securityScore: number;
  blastRadius: number;
  vulnerabilityCount: number;
  criticalCount: number;
  hasSensitivePath: boolean;
}): number {
  const weighted =
    params.securityScore * 0.55 +
    Math.min(params.blastRadius * 1.8, 30) +
    Math.min(params.vulnerabilityCount * 2.5, 20) +
    params.criticalCount * 12 +
    (params.hasSensitivePath ? 10 : 0);

  return Math.round(clampScore(weighted, 0, 100) * 10) / 10;
}

export function computeSecurityAwarePriority(params: {
  debtScore: number;
  blastRadius: number;
  securityScore: number;
}): number {
  return Math.round((params.debtScore * params.blastRadius) + (params.securityScore * 1.5));
}

export function sortBySecurityRisk<T extends { securityScore: number; debtScore: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aScore = a.securityScore + a.debtScore * 0.3;
    const bScore = b.securityScore + b.debtScore * 0.3;
    return bScore - aScore || severityRank('low') - severityRank('low');
  });
}
