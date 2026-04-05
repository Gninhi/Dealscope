import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-guard';
import { createAlertSchema } from '@/lib/validators';
import { validateCsrf } from '@/lib/security';

// GET /api/news/alerts
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const workspaceId = authResult.workspaceId;
    const alerts = await db.newsAlert.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Alerts fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
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
        name,
        type: type || 'keyword',
        keywords: JSON.stringify(keywords || []),
        sector: sector || '',
        companyId: companyId || null,
      },
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error('Alert creation error:', error);
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
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

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });

    // Verify workspace ownership before delete
    const alert = await db.newsAlert.findFirst({ where: { id, workspaceId: authResult.workspaceId } });
    if (!alert) return NextResponse.json({ error: 'Alerte introuvable' }, { status: 404 });

    await db.newsAlert.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Alert deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 });
  }
}

// PATCH /api/news/alerts
export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // CSRF protection
  if (!validateCsrf(request)) {
    return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, isActive } = body;

    if (!id) return NextResponse.json({ error: 'Alert ID required' }, { status: 400 });

    // Verify workspace ownership before update
    const existing = await db.newsAlert.findFirst({ where: { id, workspaceId: authResult.workspaceId } });
    if (!existing) return NextResponse.json({ error: 'Alerte introuvable' }, { status: 404 });

    const alert = await db.newsAlert.update({
      where: { id },
      data: { isActive, lastTriggered: new Date() },
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error('Alert update error:', error);
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
  }
}
