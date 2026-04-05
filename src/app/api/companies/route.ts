import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-guard';
import { getWorkspace } from '@/lib/workspace';
import { createCompanySchema } from '@/lib/validators';
import { validateCsrf } from '@/lib/security';

// GET /api/companies - list all companies with relations
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const companies = await db.targetCompany.findMany({
      where: { workspaceId: authResult.workspaceId },
      orderBy: { updatedAt: 'desc' },
      include: {
        signals: true,
        contacts: true,
        pipelineStages: {
          orderBy: { movedAt: 'desc' },
          take: 1,
        },
        icpProfile: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
  }
}

// POST /api/companies - add a company
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // CSRF protection
  if (!validateCsrf(request)) {
    return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = createCompanySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 },
      );
    }

    const { siren, name } = parsed.data;

    // Use workspace helper for consistent resolution
    const workspaceId = await getWorkspace();

    // Check SIREN uniqueness
    const existing = await db.targetCompany.findUnique({ where: { siren } });
    if (existing) {
      return NextResponse.json({ error: 'Company with this SIREN already exists', company: existing }, { status: 409 });
    }

    // Determine initial status
    const status = 'identifiees';

    const company = await db.targetCompany.create({
      data: {
        workspaceId,
        siren,
        name,
        legalName: parsed.data.legalName || name,
        sector: parsed.data.sector || '',
        nafCode: parsed.data.nafCode || '',
        revenue: parsed.data.revenue != null ? Number(parsed.data.revenue) : null,
        employeeCount: parsed.data.employeeCount != null ? Number(parsed.data.employeeCount) : null,
        city: parsed.data.city || '',
        postalCode: parsed.data.postalCode || '',
        region: parsed.data.region || '',
        address: parsed.data.address || '',
        latitude: parsed.data.latitude != null ? Number(parsed.data.latitude) : null,
        longitude: parsed.data.longitude != null ? Number(parsed.data.longitude) : null,
        icpScore: parsed.data.icpScore != null ? Number(parsed.data.icpScore) : null,
        source: parsed.data.source || 'manual',
        status,
        notes: body.notes || '',
        icpProfileId: body.icpProfileId || null,
        natureJuridique: body.natureJuridique || '',
        categorieEntreprise: body.categorieEntreprise || '',
        nafLabel: body.nafLabel || '',
        dateImmatriculation: body.dateImmatriculation || '',
        statutEntreprise: body.statutEntreprise || '',
        greffe: body.greffe || '',
        trancheCA: body.trancheCA || '',
        dateClotureExercice: body.dateClotureExercice || '',
        adresseComplete: body.adresseComplete || (body.adresse || parsed.data.address || ''),
        sizeRange: body.sizeRange || '',
        pipelineStages: {
          create: {
            stage: status,
            movedAt: new Date(),
          },
        },
      },
      include: {
        signals: true,
        contacts: true,
        pipelineStages: true,
        icpProfile: { select: { id: true, name: true } },
      },
    });

    // Enrichissement asynchrone en arrière-plan
    const reqUrl = new URL(request.url);
    const enrichBaseUrl = `${reqUrl.protocol}//${reqUrl.host}`;
    fetch(`${enrichBaseUrl}/api/companies/enrich?id=${company.id}`).catch(() => {
      console.warn('Background enrichment failed for company:', company.siren);
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
  }
}

// DELETE /api/companies - delete a company
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
    if (!id) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    // Verify workspace ownership before delete
    const company = await db.targetCompany.findFirst({ where: { id, workspaceId: authResult.workspaceId } });
    if (!company) {
      return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 });
    }

    await db.pipelineStage.deleteMany({ where: { companyId: id } });
    await db.companySignal.deleteMany({ where: { companyId: id } });
    await db.contact.deleteMany({ where: { companyId: id } });
    await db.targetCompany.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 });
  }
}

// PATCH /api/companies - update company notes/status
export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // CSRF protection
  if (!validateCsrf(request)) {
    return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, notes, status, icpScore } = body;

    if (!id) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;
    if (icpScore !== undefined) updateData.icpScore = icpScore;

    // Verify workspace ownership before update
    const existing = await db.targetCompany.findFirst({ where: { id, workspaceId: authResult.workspaceId } });
    if (!existing) {
      return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 });
    }

    const company = await db.targetCompany.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    return NextResponse.json({ error: 'Failed to update company' }, { status: 500 });
  }
}
