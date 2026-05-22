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
  }>
) {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from('analyses')
    .update(updates)
    .eq('id', analysisId);
  if (error) throw new Error(`Failed to update analysis: ${error.message}`);
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
    if (error) throw new Error(`Failed to insert nodes: ${error.message}`);
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
