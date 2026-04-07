// ─── Company Service ─────────────────────────────────────────────
// Shared company-related constants and helpers.
// No NextRequest/NextResponse dependencies.

import { VALID_STATUSES } from '@/constants';
import type { SearchFilters } from '@/lib/types';

// ── Allowed fields for company PATCH updates ─────────────────────
export const ALLOWED_COMPANY_UPDATE_FIELDS = new Set([
  'notes',
  'icpScore',
  'status',
  'sector',
  'revenue',
  'employeeCount',
  'source',
]);

// ── Valid statuses for company pipeline (derived from single source of truth) ──
export const VALID_STATUSES_SET = new Set(VALID_STATUSES as readonly string[]);

/**
 * Parse search filters from URLSearchParams.
 * Shared between /api/companies/search and /api/companies/combined-search.
 */
export function parseSearchFilters(searchParams: URLSearchParams, extended: boolean = false): SearchFilters {
  const filters: SearchFilters = {
    query: searchParams.get('q') || '',
    departement: searchParams.get('departement') || undefined,
    codePostal: searchParams.get('codePostal') || undefined,
    commune: searchParams.get('commune') || undefined,
    region: searchParams.get('region') || undefined,
    sectionNaf: searchParams.get('sectionNaf') || undefined,
    codeNaf: searchParams.get('codeNaf') || undefined,
    natureJuridique: searchParams.get('natureJuridique') || undefined,
    categorieEntreprise: searchParams.get('categorieEntreprise') || undefined,
    effectifMin: searchParams.get('effectifMin') ? Number(searchParams.get('effectifMin')) : undefined,
    effectifMax: searchParams.get('effectifMax') ? Number(searchParams.get('effectifMax')) : undefined,
    excludeAssociations: searchParams.get('excludeAssociations') === 'true',
    excludeAutoEntrepreneurs: searchParams.get('excludeAutoEntrepreneurs') === 'true',
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
  };

  if (extended) {
    filters.trancheCA = searchParams.get('trancheCA') || undefined;
    filters.statutEntreprise = searchParams.get('statutEntreprise') || undefined;
    filters.dateImmatBefore = searchParams.get('dateImmatBefore') || undefined;
    filters.dateImmatAfter = searchParams.get('dateImmatAfter') || undefined;
    filters.caMin = searchParams.get('caMin') ? Number(searchParams.get('caMin')) : undefined;
    filters.caMax = searchParams.get('caMax') ? Number(searchParams.get('caMax')) : undefined;
    filters.sortBy = searchParams.get('sortBy') || undefined;
    filters.source = searchParams.get('source') || 'all';
  }

  return filters;
}

/**
 * Check if search params contain any meaningful search criteria.
 */
export function hasSearchParams(filters: SearchFilters, extended: boolean = false): boolean {
  const basic = !!(
    filters.query || filters.departement || filters.region ||
    filters.codePostal || filters.commune || filters.sectionNaf ||
    filters.codeNaf || filters.categorieEntreprise || filters.natureJuridique ||
    filters.effectifMin || filters.effectifMax
  );

  if (extended) {
    return basic || !!(
      filters.statutEntreprise || filters.trancheCA ||
      filters.dateImmatBefore || filters.dateImmatAfter ||
      filters.caMin || filters.caMax
    );
  }

  return basic;
}
