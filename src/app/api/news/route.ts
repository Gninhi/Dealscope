import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { safeErrorResponse, getClientIp, isRateLimited, rateLimitedResponse } from '@/lib/security';
import { fetchNews } from '@/lib/services/news.service';

// GET /api/news — fetch M&A news by category or custom query
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // Rate limit news fetching
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 30, 60 * 1000)) {
    return rateLimitedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    const query = searchParams.get('query') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 50);
    const refresh = searchParams.get('refresh') === 'true';

    const result = await fetchNews(category, query, limit, refresh);

    return NextResponse.json({
      results: result.results.slice(0, limit),
      total: result.total,
      category: result.category,
      ...(result.cached ? { cached: true } : {}),
      ...(result.demo ? { demo: true } : {}),
    });
  } catch (error) {
    console.error('News error:', error);
    return safeErrorResponse('Erreur de chargement des actualités', 500);
  }
}
