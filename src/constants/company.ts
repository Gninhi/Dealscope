// ─── Enterprise Categories ────────────────────────────────────────

export const CATEGORIES_ENTREPRISE = [
  { value: 'TPE', label: 'TPE (0-19 salariés)' },
  { value: 'PME', label: 'PME (20-249 salariés)' },
  { value: 'ETI', label: 'ETI (250-4999 salariés)' },
  { value: 'GE', label: 'GE (5000+ salariés)' },
] as const;

// ─── Legal Forms ──────────────────────────────────────────────────

export const FORMES_JURIDIQUES = [
  'SAS', 'SA', 'SARL', 'SNC', 'EURL', 'SASU', 'Auto-entrepreneur',
  'Association', 'Société civile', 'Coopérative', 'GIE', 'SEP',
  'SOCIÉTÉ ANONYME', 'SOCIÉTÉ PAR ACTIONS SIMPLIFIÉE',
  'SOCIÉTÉ À RESPONSABILITÉ LIMITÉE',
  'ENTREPRISE INDIVIDUELLE',
] as const;

// ─── Company Statuses ────────────────────────────────────────────
// Re-exported from pipeline.ts as single source of truth.
// Use PIPELINE_STAGES from @/constants for the canonical list.
export { PIPELINE_STAGES as COMPANY_STATUSES } from './pipeline';

// ─── Tranches de CA ──────────────────────────────────────────────

export const TRANCHES_CA = [
  { value: '<100K', label: '< 100 k€' },
  { value: '100K-500K', label: '100 k€ - 500 k€' },
  { value: '500K-1M', label: '500 k€ - 1 M€' },
  { value: '1M-5M', label: '1 M€ - 5 M€' },
  { value: '5M-10M', label: '5 M€ - 10 M€' },
  { value: '10M-50M', label: '10 M€ - 50 M€' },
  { value: '>50M', label: '> 50 M€' },
] as const;

// ─── Statuts d'entreprise InfoGreffe ─────────────────────────────

export const STATUTS_ENTREPRISE = [
  { value: 'active', label: 'Active' },
  { value: 'cessee', label: 'Cessée' },
  { value: 'radiee', label: 'Radiée' },
] as const;

// ─── Sort Options ────────────────────────────────────────────────

export const SORT_OPTIONS = [
  { value: 'name', label: 'Nom (A-Z)' },
  { value: 'ca_desc', label: 'CA décroissant' },
  { value: 'ca_asc', label: 'CA croissant' },
  { value: 'date_desc', label: 'Date immatriculation récente' },
  { value: 'date_asc', label: 'Date immatriculation ancienne' },
  { value: 'effectif_desc', label: 'Effectifs décroissant' },
] as const;
