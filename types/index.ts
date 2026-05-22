export type AnalysisStatus =
  | 'pending'
  | 'fetching'
  | 'parsing'
  | 'scoring'
  | 'graphing'
  | 'complete'
  | 'failed';

export interface AnalysisRecord {
  id: string;
  user_id: string | null;
  repo_url: string;
  repo_owner: string;
  repo_name: string;
  status: AnalysisStatus;
  progress: number;
  progress_message: string | null;
  error_message: string | null;
  total_files: number;
  total_nodes: number;
  avg_debt_score: number;
  fingerprint_label: string | null;
  fingerprint_confidence: number | null;
  created_at: string;
  updated_at: string;
}

export interface DebtNode {
  id: string;
  analysis_id: string;
  file_path: string;
  symbol_name: string;
  node_type: 'function' | 'class' | 'module' | 'variable';
  line_start: number;
  line_end: number;
  debt_score: number;
  complexity: number;
  duplication_score: number;
  blast_radius: number;
  dependencies: string[];
  dependents: string[];
  explanation: string | null;
  fingerprint_tag: string | null;
  x: number | null;
  y: number | null;
}

export interface GraphLink {
  source: string;
  target: string;
  weight: number;
}

export interface GraphData {
  nodes: DebtNode[];
  links: GraphLink[];
}

export interface AnalyzeRequest {
  repoUrl: string;
}

export interface ExplainRequest {
  nodeId: string;
  analysisId: string;
}

export interface FingerprintRequest {
  codeSnippet: string;
  nodeId?: string;
  analysisId?: string;
}

export interface RoadmapItem {
  rank: number;
  nodeId: string;
  filePath: string;
  symbolName: string;
  debtScore: number;
  blastRadius: number;
  priority: number;
  explanation: string | null;
}

export interface FilterState {
  minScore: number;
  maxScore: number;
  nodeTypes: DebtNode['node_type'][];
  search: string;
}

export interface ParsedFile {
  path: string;
  content: string;
}

export interface ASTSymbol {
  id: string;
  filePath: string;
  name: string;
  type: DebtNode['node_type'];
  lineStart: number;
  lineEnd: number;
  complexity: number;
  calls: string[];
  calledBy: string[];
}
