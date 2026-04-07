import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-guard';
import { createCompanySchema } from '@/validators';
import { patchCompanySchema, ALLOWED_COMPANY_UPDATE_FIELDS } from '@/lib/validators';
import { validateCsrf, safeErrorResponse, getClientIp, isRateLimited, rateLimitedResponse, isValidId, sanitizeInput } from '@/lib/security';

// GET /api/companies - list all companies with relations (paginated)
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // Rate limit GET requests
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 60, 60 * 1000)) {
    return rateLimitedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '100', 10) || 100), 200);
    const skip = (page - 1) * limit;

    const [companies, total] = await Promise.all([
      db.targetCompany.findMany({
        where: { workspaceId: authResult.workspaceId },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
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
      }),
      db.targetCompany.count({
        where: { workspaceId: authResult.workspaceId },
      }),
    ]);

    return NextResponse.json({ companies, total, page, limit });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return safeErrorResponse('Échec du chargement des entreprises', 500);
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

    // Use authenticated user's workspace for consistent isolation
    const workspaceId = authResult.workspaceId;

    // Check SIREN uniqueness within workspace
    const existing = await db.targetCompany.findFirst({ where: { siren, workspaceId } });
    if (existing) {
      return NextResponse.json(
        { error: 'Cette entreprise existe déjà dans votre workspace' },
        { status: 409 },
      );
    }

    // Determine initial status
    const status = 'identifiees';

    const company = await db.targetCompany.create({
      data: {
        workspaceId,
        siren,
        name: sanitizeInput(name, 500),
        legalName: sanitizeInput(parsed.data.legalName || name, 500),
        sector: sanitizeInput(parsed.data.sector || '', 100),
        nafCode: sanitizeInput(parsed.data.nafCode || '', 20),
        revenue: parsed.data.revenue != null ? Number(parsed.data.revenue) : null,
        employeeCount: parsed.data.employeeCount != null ? Number(parsed.data.employeeCount) : null,
        city: sanitizeInput(parsed.data.city || '', 200),
        postalCode: sanitizeInput(parsed.data.postalCode || '', 20),
        region: sanitizeInput(parsed.data.region || '', 200),
        address: sanitizeInput(parsed.data.address || '', 500),
        latitude: parsed.data.latitude != null ? Number(parsed.data.latitude) : null,
        longitude: parsed.data.longitude != null ? Number(parsed.data.longitude) : null,
        icpScore: parsed.data.icpScore != null ? Number(parsed.data.icpScore) : null,
        source: sanitizeInput(parsed.data.source || 'manual', 50),
        status,
        notes: sanitizeInput(parsed.data.notes || '', 50000),
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
    // Use internal auth header to authenticate the background fetch
    const authHeader = request.headers.get('authorization');
    const reqUrl = new URL(request.url);
    const enrichBaseUrl = `${reqUrl.protocol}//${reqUrl.host}`;
    fetch(`${enrichBaseUrl}/api/companies/enrich?id=${company.id}`, {
      headers: authHeader ? { 'Authorization': authHeader } : {},
      signal: AbortSignal.timeout(30000),
    }).catch(() => {
      console.warn('Background enrichment failed for company:', company.siren);
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error('Error creating company:', error);
    return safeErrorResponse('Échec de la création de l\'entreprise', 500);
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
    if (!id || !isValidId(id)) {
      return NextResponse.json({ error: 'Company ID invalide' }, { status: 400 });
    }

    // Verify workspace ownership before delete
    const company = await db.targetCompany.findFirst({ where: { id, workspaceId: authResult.workspaceId } });
    if (!company) {
      return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 });
    }

    await db.$transaction(async (tx) => {
      await tx.pipelineStage.deleteMany({ where: { companyId: id } });
      await tx.companySignal.deleteMany({ where: { companyId: id } });
      await tx.contact.deleteMany({ where: { companyId: id } });
      await tx.targetCompany.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting company:', error);
    return safeErrorResponse('Échec de la suppression de l\'entreprise', 500);
  }
}

// PATCH /api/companies - update company notes/status (strict whitelist)
export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // CSRF protection
  if (!validateCsrf(request)) {
    return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = patchCompanySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 },
      );
    }

    const { id } = parsed.data;

    if (!isValidId(id)) {
      return NextResponse.json({ error: 'Company ID invalide' }, { status: 400 });
    }

    // Build update data from ONLY validated & whitelisted fields
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
      if (key !== 'id' && ALLOWED_COMPANY_UPDATE_FIELDS.has(key) && value !== undefined) {
        updateData[key] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Aucun champ valide à mettre à jour' },
        { status: 400 },
      );
    }

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
    return safeErrorResponse('Échec de la mise à jour', 500);
  }
}
