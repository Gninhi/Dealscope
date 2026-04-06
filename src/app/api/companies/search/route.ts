import { NextRequest, NextResponse } from 'next/server';
import { searchApiGouv } from '@/lib/api-gouv';
import { requireAuth } from '@/lib/api-guard';
import { isRateLimited, getClientIp, rateLimitedResponse, safeErrorResponse } from '@/lib/security';
import { buildSearchFilters, hasSearchParams } from '@/lib/search-utils';

// GET /api/companies/search - proxy to API Gouv
export async function GET(request: NextRequest) {
  // Rate limiting: 20 req/min per IP
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 20, 60 * 1000)) {
    return rateLimitedResponse();
  }

  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const filters = buildSearchFilters(new URL(request.url).searchParams);

    if (!hasSearchParams(filters)) {
      return NextResponse.json({ error: 'Au moins un paramètre est requis' }, { status: 400 });
    }

    const results = await searchApiGouv(filters);
    return NextResponse.json({ results, total: results.length });
  } catch (error) {
    console.error('Company search error:', error);
    return safeErrorResponse('Échec de la recherche', 500);
  }
}
