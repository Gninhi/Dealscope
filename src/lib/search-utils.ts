import type { SearchFilters } from './types';

/**
 * Build SearchFilters from URL search params.
 * Shared by /api/companies/search and /api/companies/combined-search.
 */
export function buildSearchFilters(searchParams: URLSearchParams): SearchFilters {
  return {
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
    trancheCA: searchParams.get('trancheCA') || undefined,
    statutEntreprise: searchParams.get('statutEntreprise') || undefined,
    dateImmatBefore: searchParams.get('dateImmatBefore') || undefined,
    dateImmatAfter: searchParams.get('dateImmatAfter') || undefined,
    caMin: searchParams.get('caMin') ? Number(searchParams.get('caMin')) : undefined,
    caMax: searchParams.get('caMax') ? Number(searchParams.get('caMax')) : undefined,
    sortBy: searchParams.get('sortBy') || undefined,
    source: searchParams.get('source') || 'all',
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
  };
}

/**
 * Check if search filters have at least one active search parameter.
 */
export function hasSearchParams(filters: SearchFilters): boolean {
  return !!(
    filters.query || filters.departement || filters.region ||
    filters.codePostal || filters.commune || filters.sectionNaf ||
    filters.codeNaf || filters.categorieEntreprise || filters.natureJuridique ||
    filters.effectifMin || filters.effectifMax ||
    filters.statutEntreprise || filters.trancheCA ||
    filters.dateImmatBefore || filters.dateImmatAfter ||
    filters.caMin || filters.caMax
  );
}
