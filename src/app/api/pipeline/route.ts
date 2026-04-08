import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-guard';
import { movePipelineSchema } from '@/validators';
import { validateCsrf, safeErrorResponse, isValidId, getClientIp, isRateLimited, rateLimitedResponse, sanitizeInput } from '@/lib/security';

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

  // Rate limit mutations
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 30, 60 * 1000)) {
    return rateLimitedResponse();
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

    const { companyId, stage, notes } = parsed.data;

    // Verify workspace ownership before moving company in pipeline
    const company = await db.targetCompany.findFirst({
      where: { id: companyId, workspaceId: authResult.workspaceId },
    });
    if (!company) {
      return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 });
    }

    // Delete old stages for this company to avoid duplication
    await db.pipelineStage.deleteMany({
      where: { companyId },
    });

    const pipelineStage = await db.pipelineStage.create({
      data: {
        companyId,
        stage: stage,
        notes: sanitizeInput(notes || '', 5000),
        movedAt: new Date(),
      },
    });

    await db.targetCompany.update({
      where: { id: companyId },
      data: { status: stage },
    });

    return NextResponse.json(pipelineStage);
  } catch (error) {
    console.error('Error updating pipeline:', error);
    return safeErrorResponse('Échec de la mise à jour du pipeline', 500);
  }
}

// PATCH /api/pipeline — update pipeline stage notes
export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  if (!validateCsrf(request)) {
    return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
  }

  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 30, 60 * 1000)) {
    return rateLimitedResponse();
  }

  try {
    const body = await request.json();
    const { stageId, notes } = body;

    if (!stageId || !isValidId(stageId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    // Verify the pipeline stage exists and belongs to user's workspace
    const stage = await db.pipelineStage.findFirst({
      where: { id: stageId, company: { workspaceId: authResult.workspaceId } },
    });

    if (!stage) {
      return NextResponse.json({ error: 'Étape introuvable' }, { status: 404 });
    }

    const updated = await db.pipelineStage.update({
      where: { id: stageId },
      data: { notes: sanitizeInput(notes || '', 5000) },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating pipeline notes:', error);
    return safeErrorResponse('Échec de la mise à jour', 500);
  }
}
