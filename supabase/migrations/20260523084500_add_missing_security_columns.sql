-- Migration: Add missing security, exploitability, and attack graph columns to analyses and debt_nodes
-- Run in Supabase SQL editor or via Supabase CLI

-- 1. Alter public.analyses to add missing metrics
ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS collapse_score numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS collapse_prediction jsonb,
  ADD COLUMN IF NOT EXISTS attack_graph jsonb,
  ADD COLUMN IF NOT EXISTS repo_exploitability_score numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS high_risk_attack_paths jsonb;

-- 2. Alter public.debt_nodes to add missing exploitability, propagation, and autofix columns
ALTER TABLE public.debt_nodes
  ADD COLUMN IF NOT EXISTS exploitability_score numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS collapse_risk numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS autofix_available boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS attack_surface_score numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS propagation_risk numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS public_exposure boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS critical_attack_paths jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS fix_patch text,
  ADD COLUMN IF NOT EXISTS fix_confidence numeric(5,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS merge_risk text;
