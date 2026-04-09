import { VALID_STATUSES } from '@/constants';
import type { SearchFilters } from '@/lib/types';
import { ALLOWED_COMPANY_UPDATE_FIELDS } from '@/lib/validators';

export { ALLOWED_COMPANY_UPDATE_FIELDS };

export const VALID_STATUSES_SET = new Set(VALID_STATUSES as readonly string[]);

export function parseSearchFilters(searchParams: URLSearchParams, extended: boolean = false): SearchFilters {
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const effectifMin = searchParams.get('effectifMin') ? Number(searchParams.get('effectifMin')) : undefined;
  const effectifMax = searchParams.get('effectifMax') ? Number(searchParams.get('effectifMax')) : undefined;

  const filters: SearchFilters = {
    query: searchParams.get('q')?.trim() || '',
    departement: searchParams.get('departement')?.trim() || undefined,
    codePostal: searchParams.get('codePostal')?.trim() || undefined,
    commune: searchParams.get('commune')?.trim() || undefined,
    region: searchParams.get('region')?.trim() || undefined,
    sectionNaf: searchParams.get('sectionNaf')?.trim() || undefined,
    codeNaf: searchParams.get('codeNaf')?.trim() || undefined,
    natureJuridique: searchParams.get('natureJuridique')?.trim() || undefined,
    categorieEntreprise: searchParams.get('categorieEntreprise')?.trim() || undefined,
    effectifMin: !isNaN(effectifMin as number) ? effectifMin : undefined,
    effectifMax: !isNaN(effectifMax as number) ? effectifMax : undefined,
    excludeAssociations: searchParams.get('excludeAssociations') === 'true',
    excludeAutoEntrepreneurs: searchParams.get('excludeAutoEntrepreneurs') === 'true',
    page: !isNaN(page) && page > 0 ? page : 1,
    limit: !isNaN(limit) && limit > 0 && limit <= 100 ? limit : 20,
  };

  if (extended) {
    const caMin = searchParams.get('caMin') ? Number(searchParams.get('caMin')) : undefined;
    const caMax = searchParams.get('caMax') ? Number(searchParams.get('caMax')) : undefined;

    filters.trancheCA = searchParams.get('trancheCA')?.trim() || undefined;
    filters.statutEntreprise = searchParams.get('statutEntreprise')?.trim() || undefined;
    filters.dateImmatBefore = searchParams.get('dateImmatBefore')?.trim() || undefined;
    filters.dateImmatAfter = searchParams.get('dateImmatAfter')?.trim() || undefined;
    filters.caMin = !isNaN(caMin as number) ? caMin : undefined;
    filters.caMax = !isNaN(caMax as number) ? caMax : undefined;
    filters.sortBy = searchParams.get('sortBy')?.trim() || undefined;
    filters.source = searchParams.get('source')?.trim() || 'all';
  }

  return filters;
}

export function hasSearchParams(filters: SearchFilters, extended: boolean = false): boolean {
  const basic = !!(
    filters.query ||
    filters.departement ||
    filters.region ||
    filters.codePostal ||
    filters.commune ||
    filters.sectionNaf ||
    filters.codeNaf ||
    filters.categorieEntreprise ||
    filters.natureJuridique ||
    filters.effectifMin ||
    filters.effectifMax
  );

  if (extended) {
    return basic || !!(
      filters.statutEntreprise ||
      filters.trancheCA ||
      filters.dateImmatBefore ||
      filters.dateImmatAfter ||
      filters.caMin ||
      filters.caMax
    );
  }

  return basic;
}
