import { NextRequest, NextResponse } from 'next/server';
import { searchInfoGreffe, getInfoGreffeBySiren } from '@/lib/infogreffe';
import type { SearchFilters } from '@/lib/types';

// GET /api/companies/infogreffe - search InfoGreffe
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Check if searching by SIREN specifically
    const siren = searchParams.get('siren');
    
    if (siren) {
      const result = await getInfoGreffeBySiren(siren);
      return NextResponse.json({ results: result ? [result] : [], total: result ? 1 : 0 });
    }

    const filters: SearchFilters = {
      query: searchParams.get('q') || '',
      departement: searchParams.get('departement') || undefined,
      codePostal: searchParams.get('codePostal') || undefined,
      region: searchParams.get('region') || undefined,
      commune: searchParams.get('commune') || undefined,
      codeNaf: searchParams.get('codeNaf') || undefined,
      natureJuridique: searchParams.get('natureJuridique') || undefined,
      excludeAssociations: false,
      excludeAutoEntrepreneurs: false,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20,
    };

    if (!filters.query && !filters.departement && !filters.region && !filters.codePostal && !filters.commune && !filters.codeNaf && !filters.natureJuridique) {
      return NextResponse.json({ error: 'Au moins un paramètre est requis' }, { status: 400 });
    }

    const results = await searchInfoGreffe(filters);
    return NextResponse.json({ results, total: results.length });
  } catch (error) {
    console.error('InfoGreffe search error:', error);
    return NextResponse.json({ error: 'Search failed', details: String(error) }, { status: 500 });
  }
}
