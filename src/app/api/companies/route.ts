import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-guard';
import { createCompanySchema, updateCompanySchema, isAllowedUpdateField, ALLOWED_COMPANY_UPDATE_FIELDS } from '@/lib/validators';
import { performSecurityChecks, createErrorResponse } from '@/lib/security/core/security-check';
import { sanitizeString, sanitizeId } from '@/lib/security/core/sanitizer';
import { logCrudOperation } from '@/lib/security/core/audit-logger';

export async function GET(request: NextRequest) {
  const securityCheck = await performSecurityChecks(request);
  if (!securityCheck.passed) return securityCheck.response!;

  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

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
          pipelineStages: { orderBy: { movedAt: 'desc' }, take: 1 },
          icpProfile: { select: { id: true, name: true } },
        },
      }),
      db.targetCompany.count({ where: { workspaceId: authResult.workspaceId } }),
    ]);

    return NextResponse.json({ companies, total, page, limit });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return createErrorResponse('Échec du chargement des entreprises', 500);
  }
}

export async function POST(request: NextRequest) {
  const securityCheck = await performSecurityChecks(request, { requireCsrf: true, rateLimit: { maxRequests: 20, windowMs: 60000 } });
  if (!securityCheck.passed) return securityCheck.response!;

  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const parsed = createCompanySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 }
      );
    }

    const { siren, name } = parsed.data;
    const workspaceId = authResult.workspaceId;

    const existing = await db.targetCompany.findFirst({ where: { siren, workspaceId } });
    if (existing) {
      return NextResponse.json(
        { error: 'Cette entreprise existe déjà dans votre workspace' },
        { status: 409 }
      );
    }

    const company = await db.targetCompany.create({
      data: {
        workspaceId,
        siren: sanitizeString(siren, { maxLength: 9 }),
        name: sanitizeString(name, { maxLength: 500 }),
        legalName: sanitizeString(parsed.data.legalName || name, { maxLength: 500 }),
        sector: sanitizeString(parsed.data.sector || '', { maxLength: 100 }),
        nafCode: sanitizeString(parsed.data.nafCode || '', { maxLength: 20 }),
        revenue: parsed.data.revenue != null ? Number(parsed.data.revenue) : null,
        employeeCount: parsed.data.employeeCount != null ? Number(parsed.data.employeeCount) : null,
        city: sanitizeString(parsed.data.city || '', { maxLength: 200 }),
        postalCode: sanitizeString(parsed.data.postalCode || '', { maxLength: 20 }),
        region: sanitizeString(parsed.data.region || '', { maxLength: 200 }),
        address: sanitizeString(parsed.data.address || '', { maxLength: 500 }),
        latitude: parsed.data.latitude != null ? Number(parsed.data.latitude) : null,
        longitude: parsed.data.longitude != null ? Number(parsed.data.longitude) : null,
        icpScore: parsed.data.icpScore != null ? Number(parsed.data.icpScore) : null,
        source: sanitizeString(parsed.data.source || 'manual', { maxLength: 50 }),
        status: 'identifiees',
        notes: sanitizeString(parsed.data.notes || '', { maxLength: 50000 }),
        pipelineStages: {
          create: { stage: 'identifiees', movedAt: new Date() },
        },
      },
      include: {
        signals: true,
        contacts: true,
        pipelineStages: true,
        icpProfile: { select: { id: true, name: true } },
      },
    });

    logCrudOperation('create', authResult.id, authResult.workspaceId, securityCheck.ip, 'company', company.id, true);

    const reqUrl = new URL(request.url);
    const enrichBaseUrl = `${reqUrl.protocol}//${reqUrl.host}`;
    fetch(`${enrichBaseUrl}/api/companies/enrich?id=${company.id}`, {
      headers: request.headers.get('authorization') ? { 'Authorization': request.headers.get('authorization')! } : {},
      signal: AbortSignal.timeout(30000),
    }).catch(() => {
      console.warn('Background enrichment failed for company:', company.siren);
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error('Error creating company:', error);
    return createErrorResponse('Échec de la création de l\'entreprise', 500);
  }
}

export async function DELETE(request: NextRequest) {
  const securityCheck = await performSecurityChecks(request, { requireCsrf: true, rateLimit: { maxRequests: 30, windowMs: 60000 } });
  if (!securityCheck.passed) return securityCheck.response!;

  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const validId = sanitizeId(id || '');

    if (!validId) {
      return NextResponse.json({ error: 'Company ID invalide' }, { status: 400 });
    }

    const company = await db.targetCompany.findFirst({ where: { id: validId, workspaceId: authResult.workspaceId } });
    if (!company) {
      return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 });
    }

    await db.$transaction(async (tx) => {
      await tx.pipelineStage.deleteMany({ where: { companyId: validId } });
      await tx.companySignal.deleteMany({ where: { companyId: validId } });
      await tx.contact.deleteMany({ where: { companyId: validId } });
      await tx.targetCompany.delete({ where: { id: validId } });
    });

    logCrudOperation('delete', authResult.id, authResult.workspaceId, securityCheck.ip, 'company', validId, true);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting company:', error);
    return createErrorResponse('Échec de la suppression de l\'entreprise', 500);
  }
}

export async function PATCH(request: NextRequest) {
  const securityCheck = await performSecurityChecks(request, { requireCsrf: true, rateLimit: { maxRequests: 30, windowMs: 60000 } });
  if (!securityCheck.passed) return securityCheck.response!;

  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const parsed = updateCompanySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 }
      );
    }

    const { id } = parsed.data;
    const validId = sanitizeId(id);

    if (!validId) {
      return NextResponse.json({ error: 'Company ID invalide' }, { status: 400 });
    }

  const updateData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (key !== 'id' && isAllowedUpdateField(key) && value !== undefined) {
      if (typeof value === 'string') {
        updateData[key] = sanitizeString(value, { maxLength: key === 'notes' ? 50000 : 200 });
      } else {
        updateData[key] = value;
      }
    }
  }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Aucun champ valide à mettre à jour' }, { status: 400 });
    }

    const existing = await db.targetCompany.findFirst({ where: { id: validId, workspaceId: authResult.workspaceId } });
    if (!existing) {
      return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 });
    }

    const company = await db.targetCompany.update({
      where: { id: validId },
      data: updateData,
    });

    logCrudOperation('update', authResult.id, authResult.workspaceId, securityCheck.ip, 'company', validId, true);

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    return createErrorResponse('Échec de la mise à jour', 500);
  }
}
