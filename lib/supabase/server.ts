import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { AnalysisRecord, DebtNode } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export function createServiceClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          /* Server Component context */
        }
      },
    },
  });
}

export async function updateAnalysisProgress(
  analysisId: string,
  updates: Partial<{
    status: AnalysisRecord['status'];
    progress: number;
    progress_message: string;
    error_message: string;
    total_files: number;
    total_nodes: number;
    avg_debt_score: number;
    fingerprint_label: string;
    fingerprint_confidence: number;
    security_summary: AnalysisRecord['security_summary'];
    security_collapse: boolean;
    critical_vulnerabilities: number;
    repo_security_score: number;
  }>
) {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('analyses')
      .update(updates)
      .eq('id', analysisId);
    if (error) {
      const errorMessage = error.message ?? '';
      const isSchemaCacheError = /schema cache|Could not find the '.+' column/i.test(errorMessage);
      if (!isSchemaCacheError) {
        console.error(`[Supabase Error] Failed to update progress for ${analysisId}: ${errorMessage}`);
        return;
      }

      const fallbackUpdates = {
        ...updates,
      } as Record<string, unknown>;
      delete fallbackUpdates.security_summary;
      delete fallbackUpdates.security_collapse;
      delete fallbackUpdates.critical_vulnerabilities;
      delete fallbackUpdates.repo_security_score;

      const fallback = await supabase
        .from('analyses')
        .update(fallbackUpdates)
        .eq('id', analysisId);

      if (fallback.error) {
        console.error(`[Supabase Error] Failed to update progress for ${analysisId}: ${fallback.error.message}`);
      }
    }
  } catch (err) {
    console.error(`[Supabase Error] Exception thrown during update progress for ${analysisId}:`, err);
  }
}

export async function getAnalysis(id: string): Promise<AnalysisRecord | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return data as AnalysisRecord;
}

export async function getDebtNodes(analysisId: string): Promise<DebtNode[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('debt_nodes')
    .select('*')
    .eq('analysis_id', analysisId)
    .order('debt_score', { ascending: false });
  if (error) throw new Error(`Failed to fetch nodes: ${error.message}`);
  return (data ?? []) as DebtNode[];
}

export async function insertDebtNodes(
  nodes: Omit<DebtNode, 'id'>[]
): Promise<void> {
  const supabase = createServiceClient();
  const batchSize = 100;
  for (let i = 0; i < nodes.length; i += batchSize) {
    const batch = nodes.slice(i, i + batchSize);
    const { error } = await supabase.from('debt_nodes').insert(batch);
    if (!error) continue;

    const errorMessage = error.message ?? '';
    const isSchemaCacheError = /schema cache|Could not find the '.+' column/i.test(errorMessage);
    if (!isSchemaCacheError) {
      throw new Error(`Failed to insert nodes: ${errorMessage}`);
    }

    const fallbackBatch = batch.map(({ security_score, security_weighted_score, has_critical_security, vulnerability_count, security_risk_level, owasp_categories, cwe_categories, security_findings, ...rest }) => rest as Omit<DebtNode, 'id' | 'security_score' | 'security_weighted_score' | 'has_critical_security' | 'vulnerability_count' | 'security_risk_level' | 'owasp_categories' | 'cwe_categories' | 'security_findings'>);
    const fallbackInsert = await supabase.from('debt_nodes').insert(fallbackBatch);
    if (fallbackInsert.error) {
      throw new Error(`Failed to insert nodes: ${fallbackInsert.error.message}`);
    }
  }
}

export async function updateNodeExplanation(
  nodeId: string,
  explanation: string
): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('debt_nodes')
    .update({ explanation })
    .eq('id', nodeId);
  if (error) throw new Error(`Failed to update explanation: ${error.message}`);
}
