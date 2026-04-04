import { NextRequest, NextResponse } from 'next/server';
import { searchApiGouv } from '@/lib/api-gouv';
import type { SearchFilters } from '@/lib/types';

// GET /api/companies/search - proxy to API Gouv
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
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

    const hasSearchParams = !!(
      filters.query || filters.departement || filters.region ||
      filters.codePostal || filters.commune || filters.sectionNaf ||
      filters.codeNaf || filters.categorieEntreprise || filters.natureJuridique ||
      filters.effectifMin || filters.effectifMax
    );

    if (!hasSearchParams) {
      return NextResponse.json({ error: 'Au moins un paramètre est requis' }, { status: 400 });
    }

    const results = await searchApiGouv(filters);
    return NextResponse.json({ results, total: results.length });
  } catch (error) {
    console.error('Company search error:', error);
    return NextResponse.json({ error: 'Search failed', details: String(error) }, { status: 500 });
  }
}
