import type { CompanySearchResult, SearchFilters } from './types';

const API_GOUV_BASE = 'https://recherche-entreprises.api.gouv.fr/search';

export async function searchApiGouv(filters: SearchFilters): Promise<CompanySearchResult[]> {
  const params: Record<string, string> = {
    per_page: filters.limit ? String(filters.limit) : '20',
    page: String(filters.page || 1),
  };

  if (filters.query) {
    params.q = filters.query;
  }

  // Build conditions for advanced filters
  const conditions: string[] = [];

  if (filters.departement) {
    conditions.push(`departement:"${filters.departement}"`);
  }
  if (filters.codePostal) {
    conditions.push(`code_postal:"${filters.codePostal}"`);
  }
  if (filters.commune) {
    conditions.push(`commune:"${filters.commune}"`);
  }
  if (filters.region) {
    conditions.push(`region:"${filters.region}"`);
  }
  if (filters.sectionNaf) {
    conditions.push(`section_activites_principales:"${filters.sectionNaf}"`);
  }
  if (filters.codeNaf) {
    conditions.push(`naf:"${filters.codeNaf}"`);
  }
  if (filters.natureJuridique) {
    conditions.push(`nature_juridique:"${filters.natureJuridique}"`);
  }
  if (filters.categorieEntreprise) {
    conditions.push(`categorie_entreprise:"${filters.categorieEntreprise}"`);
  }

  // Exclusions
  if (filters.excludeAssociations) {
    conditions.push('(nature_juridique:NOT "Association")');
  }
  if (filters.excludeAutoEntrepreneurs) {
    conditions.push('(nature_juridique:NOT "Auto-entrepreneur")');
  }

  // Employee count filters - use tranche_effectifs if available
  // API Gouv uses categories, not exact numbers

  if (conditions.length > 0) {
    const conditionsStr = conditions.join(' AND ');
    if (filters.query) {
      params.q = `${filters.query} AND ${conditionsStr}`;
    } else {
      params.q = conditionsStr;
    }
  } else if (!filters.query) {
    // Aucun terme de recherche ni filtre
    return [];
  }

  const url = new URL(API_GOUV_BASE);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error('API Gouv search error:', response.status);
      return [];
    }

    const text = await response.text();
    if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
      console.error('API returned HTML instead of JSON');
      return [];
    }
    const data = JSON.parse(text);
    return data.results || [];
  } catch (error) {
    console.error('API Gouv search error:', error);
    return [];
  }
}

export async function getCompanyBySiren(siren: string): Promise<CompanySearchResult | null> {
  try {
    const response = await fetch(`${API_GOUV_BASE}?q=siren:${siren}`, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error('API Gouv error:', response.status);
      return null;
    }

    const text2 = await response.text();
    if (text2.startsWith('<!DOCTYPE') || text2.startsWith('<html')) {
      console.error('API returned HTML instead of JSON');
      return null;
    }
    const data = JSON.parse(text2);
    if (data.results && data.results.length > 0) {
      return data.results[0];
    }
    return null;
  } catch (error) {
    console.error('API Gouv SIREN lookup error:', error);
    return null;
  }
}
