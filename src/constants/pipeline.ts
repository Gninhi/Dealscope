// ─── Pipeline Stages ─────────────────────────────────────────────

export const PIPELINE_STAGES = [
  { key: 'identifiees', label: 'Identifiées', color: '#6B7280', icon: 'Search' },
  { key: 'a_contacter', label: 'A contacter', color: '#3B82F6', icon: 'Phone' },
  { key: 'contactees', label: 'Contactées', color: '#F59E0B', icon: 'Mail' },
  { key: 'qualifiees', label: 'Qualifiées', color: '#10B981', icon: 'CheckCircle' },
  { key: 'opportunite', label: 'Opportunité', color: '#8B5CF6', icon: 'Star' },
  { key: 'deal', label: 'Deal', color: '#EC4899', icon: 'Trophy' },
  { key: 'annule', label: 'Annulé', color: '#EF4444', icon: 'XCircle' },
] as const;

export type PipelineStageKey = (typeof PIPELINE_STAGES)[number]['key'];

// ─── Valid status values (used in DB + validators) ───────────────
export const VALID_STATUSES = [
  'identifiees',
  'a_contacter',
  'contactees',
  'qualifiees',
  'opportunite',
  'deal',
  'annule',
] as const;
