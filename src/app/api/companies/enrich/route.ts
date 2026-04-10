import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-guard';
import { validateCsrf, safeErrorResponse, getClientIp, isRateLimited, rateLimitedResponse, isValidId } from '@/lib/security';
import { enrichCompany, batchEnrich, type BatchEnrichResult } from '@/lib/services/enrich.service';
import { batchEnrichSchema } from '@/lib/validators';

// GET /api/companies/enrich?id=xxx — enrich a single company
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // Rate limit enrichment (hits external APIs)
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 10, 60 * 1000)) {
    return rateLimitedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !isValidId(id)) {
      return NextResponse.json({ error: 'Company ID invalide' }, { status: 400 });
    }

    // Verify workspace ownership
    const company = await db.targetCompany.findFirst({
      where: { id, workspaceId: authResult.workspaceId },
    });
    if (!company) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 });
    }

    const result = await enrichCompany(id, authResult.workspaceId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const updated = await db.targetCompany.findUnique({ where: { id } });
    return NextResponse.json({ success: true, company: updated });
  } catch (error) {
    console.error('Enrich error:', error);
    return safeErrorResponse("Échec de l'enrichissement", 500);
  }
}

// POST /api/companies/enrich — batch enrich
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  if (!validateCsrf(request)) {
    return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
  }

  // Rate limit batch enrichment
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 5, 60 * 1000)) {
    return rateLimitedResponse();
  }

  try {
    const body = await request.json();
    const parsed = batchEnrichSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 },
      );
    }

    const result: BatchEnrichResult = await batchEnrich(parsed.data.forceAll ?? false, authResult.workspaceId);

    return NextResponse.json({
      total: result.total,
      enriched: result.enriched,
      failed: result.failed,
      message: result.message,
    });
  } catch (error) {
    console.error('Batch enrich error:', error);
    return safeErrorResponse("Échec de l'enrichissement batch", 500);
  }
}
