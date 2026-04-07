import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-guard';
import { createAlertSchema, updateAlertSchema as patchAlertSchema } from '@/validators';
import { validateCsrf, safeErrorResponse, isValidId, getClientIp, isRateLimited, rateLimitedResponse, sanitizeInput } from '@/lib/security';

// GET /api/news/alerts
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // Rate limit reads
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 60, 60 * 1000)) {
    return rateLimitedResponse();
  }

  try {
    const workspaceId = authResult.workspaceId;
    const alerts = await db.newsAlert.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Alerts fetch error:', error);
    return safeErrorResponse('Échec du chargement des alertes', 500);
  }
}

// POST /api/news/alerts
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // CSRF protection
  if (!validateCsrf(request)) {
    return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
  }

  // Rate limit mutations
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 20, 60 * 1000)) {
    return rateLimitedResponse();
  }

  try {
    const body = await request.json();
    const parsed = createAlertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 },
      );
    }

    const { name, type, keywords, sector, companyId } = parsed.data;

    const workspaceId = authResult.workspaceId;

    const alert = await db.newsAlert.create({
      data: {
        workspaceId,
        name: sanitizeInput(name, 100),
        type: type || 'keyword',
        keywords: JSON.stringify(keywords || []),
        sector: sanitizeInput(sector || '', 100),
        companyId: companyId || null,
      },
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error('Alert creation error:', error);
    return safeErrorResponse('Échec de la création de l\'alerte', 500);
  }
}

// DELETE /api/news/alerts?id=xxx
export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // CSRF protection
  if (!validateCsrf(request)) {
    return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
  }

  // Rate limit mutations
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 30, 60 * 1000)) {
    return rateLimitedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !isValidId(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    // Verify workspace ownership before delete
    const alert = await db.newsAlert.findFirst({ where: { id, workspaceId: authResult.workspaceId } });
    if (!alert) return NextResponse.json({ error: 'Alerte introuvable' }, { status: 404 });

    await db.newsAlert.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Alert deletion error:', error);
    return safeErrorResponse('Échec de la suppression de l\'alerte', 500);
  }
}

// PATCH /api/news/alerts — NOW with proper Zod validation
export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // CSRF protection
  if (!validateCsrf(request)) {
    return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
  }

  // Rate limit mutations
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 20, 60 * 1000)) {
    return rateLimitedResponse();
  }

  try {
    const body = await request.json();
    const parsed = patchAlertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 },
      );
    }

    const { id, isActive } = parsed.data;

    if (!isValidId(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    // Verify workspace ownership before update
    const existing = await db.newsAlert.findFirst({ where: { id, workspaceId: authResult.workspaceId } });
    if (!existing) return NextResponse.json({ error: 'Alerte introuvable' }, { status: 404 });

    const alert = await db.newsAlert.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error('Alert update error:', error);
    return safeErrorResponse('Échec de la mise à jour de l\'alerte', 500);
  }
}
