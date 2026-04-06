import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-guard';
import { movePipelineSchema } from '@/lib/validators';
import { validateCsrf, safeErrorResponse, getClientIp, isRateLimited, rateLimitedResponse } from '@/lib/security';

// GET /api/pipeline
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // Rate limit GET requests
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 60, 60 * 1000)) {
    return rateLimitedResponse();
  }

  try {
    const stages = await db.pipelineStage.findMany({
      where: { company: { workspaceId: authResult.workspaceId } },
      orderBy: { movedAt: 'desc' },
      take: 500,
      include: {
        company: {
          include: {
            signals: true,
            contacts: true,
            icpProfile: { select: { id: true, name: true } },
          },
        },
      },
    });

    const seen = new Set<string>();
    const grouped: Record<string, typeof stages> = {};

    for (const stage of stages) {
      if (seen.has(stage.companyId)) continue;
      seen.add(stage.companyId);

      const stageKey = stage.stage;
      if (!grouped[stageKey]) {
        grouped[stageKey] = [];
      }
      grouped[stageKey].push(stage);
    }

    return NextResponse.json(grouped);
  } catch (error) {
    console.error('Error fetching pipeline:', error);
    return safeErrorResponse('Échec du chargement du pipeline', 500);
  }
}

// PUT /api/pipeline
export async function PUT(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // CSRF protection
  if (!validateCsrf(request)) {
    return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = movePipelineSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 },
      );
    }

    const { companyId, newStage, notes } = parsed.data;

    // Verify workspace ownership before moving company in pipeline
    const company = await db.targetCompany.findFirst({
      where: { id: companyId, workspaceId: authResult.workspaceId },
    });
    if (!company) {
      return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 });
    }

    const pipelineStage = await db.pipelineStage.create({
      data: {
        companyId,
        stage: newStage,
        notes: notes || '',
        movedAt: new Date(),
      },
    });

    await db.targetCompany.update({
      where: { id: companyId },
      data: { status: newStage },
    });

    return NextResponse.json(pipelineStage);
  } catch (error) {
    console.error('Error updating pipeline:', error);
    return safeErrorResponse('Échec de la mise à jour du pipeline', 500);
  }
}
