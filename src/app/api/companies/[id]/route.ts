import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ALLOWED_COMPANY_UPDATE_FIELDS } from '@/lib/validators';

/**
 * GET /api/companies/[id]
 * Returns a single company with all signals, contacts, and pipeline stages.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const company = await db.targetCompany.findUnique({
      where: { id },
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

    // Serialize Decimal fields
    const serialized = {
      ...company,
      revenue: Number(company.revenue),
      icpScore: Number(company.icpScore),
    };

    return NextResponse.json(serialized);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[GET /api/companies/[id]]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/companies/[id]
 * Updates a company. Only whitelisted fields are allowed.
 * CRITICAL FIX: Previously, raw body was passed to Prisma allowing
 * overwriting of id, workspaceId, createdAt, etc.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // CRITICAL: Only allow whitelisted fields to prevent overwriting protected fields
    const sanitizedData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (ALLOWED_COMPANY_UPDATE_FIELDS.has(key)) {
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[PUT /api/companies/[id]]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/companies/[id]
 * Deletes a company and all related data.
 * CRITICAL FIX: Uses Prisma transaction to prevent orphan data.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Verify company exists
    const company = await db.targetCompany.findUnique({ where: { id } });
    if (!company) {
      return NextResponse.json(
        { error: 'Entreprise introuvable' },
        { status: 404 },
      );
    }

    // Use transaction to prevent orphan data on failure
    await db.$transaction(async (tx) => {
      await tx.pipelineStage.deleteMany({ where: { companyId: id } });
      await tx.companySignal.deleteMany({ where: { companyId: id } });
      await tx.contact.deleteMany({ where: { companyId: id } });
      await tx.targetCompany.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[DELETE /api/companies/[id]]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
