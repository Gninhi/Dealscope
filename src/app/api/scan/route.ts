import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-guard';
import { isRateLimited, validateCsrf, getClientIp, rateLimitedResponse, safeErrorResponse } from '@/lib/security';
import { executeScan, type ScanInput } from '@/lib/services/scan.service';
import { scanSchema } from '@/lib/validators';

// POST /api/scan — AI-powered company scanning
export async function POST(request: NextRequest) {
  // Rate limiting: 10 req/min per IP
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 10, 60 * 1000)) {
    return rateLimitedResponse();
  }

  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  if (!validateCsrf(request)) {
    return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = scanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 },
      );
    }

    const { query, sector, icpProfileId, model, limit = 10 } = parsed.data;

    const result = await executeScan({
      query: query || undefined,
      sector: sector || undefined,
      icpProfileId: icpProfileId || undefined,
      model: model || undefined,
      limit,
      workspaceId: authResult.workspaceId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Scan error:', error);
    return safeErrorResponse('Scan failed', 500);
  }
}
