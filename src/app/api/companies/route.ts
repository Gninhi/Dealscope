import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/companies - list all companies with relations
export async function GET() {
  try {
    const companies = await db.targetCompany.findMany({
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
  try {
    const body = await request.json();
    const { siren, name, legalName, sector, nafCode, revenue, employeeCount,
      city, postalCode, region, address, natureJuridique, categorieEntreprise,
      latitude, longitude, sizeRange, icpScore, source, icpProfileId, notes } = body;

    if (!siren || !name) {
      return NextResponse.json({ error: 'SIREN and name are required' }, { status: 400 });
    }

    // Ensure workspace exists
    let workspace = await db.workspace.findFirst();
    if (!workspace) {
      workspace = await db.workspace.create({
        data: { name: 'Default Workspace', slug: 'default-workspace' },
      });
    }

    // Check SIREN uniqueness
    const existing = await db.targetCompany.findUnique({ where: { siren } });
    if (existing) {
      return NextResponse.json({ error: 'Company with this SIREN already exists', company: existing }, { status: 409 });
    }

    // Determine initial status
    const status = 'identifiees';

    const company = await db.targetCompany.create({
      data: {
        workspaceId: workspace.id,
        siren,
        name,
        legalName: legalName || name,
        sector: sector || '',
        nafCode: nafCode || '',
        revenue: revenue != null ? Number(revenue) : null,
        employeeCount: employeeCount != null ? Number(employeeCount) : null,
        city: city || '',
        postalCode: postalCode || '',
        region: region || '',
        address: address || '',
        natureJuridique: natureJuridique || '',
        categorieEntreprise: categorieEntreprise || '',
        latitude: latitude != null ? Number(latitude) : null,
        longitude: longitude != null ? Number(longitude) : null,
        sizeRange: sizeRange || '',
        icpScore: icpScore != null ? Number(icpScore) : null,
        source: source || 'manual',
        status,
        notes: notes || '',
        icpProfileId: icpProfileId || null,
        // Stocker les données initiales de la recherche
        nafLabel: body.nafLabel || '',
        dateImmatriculation: body.dateImmatriculation || '',
        statutEntreprise: body.statutEntreprise || '',
        greffe: body.greffe || '',
        trancheCA: body.trancheCA || '',
        dateClotureExercice: body.dateClotureExercice || '',
        adresseComplete: body.adresseComplete || (body.adresse || address || ''),
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

    // Enrichissement asynchrone en arrière-plan (API Gouv + InfoGreffe)
    // Utilise le host de la requête pour éviter les problèmes de port
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
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
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
