import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-guard';
import { updateCompanySchema, ALLOWED_COMPANY_UPDATE_FIELDS } from '@/lib/validators';
import { validateCsrf, safeErrorResponse, isValidId } from '@/lib/security';

// GET /api/companies/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const company = await db.targetCompany.findFirst({
      where: { id, workspaceId: authResult.workspaceId },
      include: {
        signals: { orderBy: { detectedAt: 'desc' } },
        contacts: true,
        pipelineStages: { orderBy: { movedAt: 'desc' } },
        icpProfile: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Entreprise introuvable' },
        { status: 404 },
      );
    }

    const serialized = {
      ...company,
      revenue: Number(company.revenue),
      icpScore: Number(company.icpScore),
    };

    return NextResponse.json(serialized);
  } catch (error: unknown) {
    console.error('[GET /api/companies/[id]]', error);
    return safeErrorResponse('Échec du chargement de l\'entreprise', 500);
  }
}

// PUT /api/companies/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // CSRF protection
  if (!validateCsrf(request)) {
    return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
  }

  try {
    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const body = await request.json();

    // Verify workspace ownership before update
    const existing = await db.targetCompany.findFirst({
      where: { id, workspaceId: authResult.workspaceId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'Entreprise introuvable' },
        { status: 404 },
      );
    }

    // Zod validation for update fields
    const parsed = updateCompanySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 },
      );
    }

    // Whitelist fields
    const sanitizedData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      if (ALLOWED_COMPANY_UPDATE_FIELDS.has(key) && value !== undefined) {
        sanitizedData[key] = value;
      }
    }

    if (Object.keys(sanitizedData).length === 0) {
      return NextResponse.json(
        { error: 'Aucun champ valide à mettre à jour' },
        { status: 400 },
      );
    }

    const company = await db.targetCompany.update({
      where: { id },
      data: sanitizedData,
    });

    return NextResponse.json(company);
  } catch (error: unknown) {
    console.error('[PUT /api/companies/[id]]', error);
    return safeErrorResponse('Échec de la mise à jour de l\'entreprise', 500);
  }
}

// DELETE /api/companies/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // CSRF protection
  if (!validateCsrf(request)) {
    return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
  }

  try {
    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    // Verify workspace ownership before delete
    const company = await db.targetCompany.findFirst({ where: { id, workspaceId: authResult.workspaceId } });
    if (!company) {
      return NextResponse.json(
        { error: 'Entreprise introuvable' },
        { status: 404 },
      );
    }

    await db.$transaction(async (tx) => {
      await tx.pipelineStage.deleteMany({ where: { companyId: id } });
      await tx.companySignal.deleteMany({ where: { companyId: id } });
      await tx.contact.deleteMany({ where: { companyId: id } });
      await tx.targetCompany.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[DELETE /api/companies/[id]]', error);
    return safeErrorResponse('Échec de la suppression de l\'entreprise', 500);
  }
}
