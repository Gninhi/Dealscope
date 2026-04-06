import { NextRequest, NextResponse } from 'next/server';
import { searchApiGouv } from '@/lib/api-gouv';
import { searchInfoGreffe } from '@/lib/infogreffe';
import { db } from '@/lib/db';
import { getGemma4 } from '@/lib/gemma4';
import { requireAuth } from '@/lib/api-guard';
import { isRateLimited, validateCsrf, getClientIp, rateLimitedResponse, safeErrorResponse } from '@/lib/security';
import { scanSchema } from '@/lib/validators';
import type { SearchFilters } from '@/lib/types';

// POST /api/scan
export async function POST(request: NextRequest) {
  // Rate limiting: 10 req/min per IP
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 10, 60 * 1000)) {
    return rateLimitedResponse();
  }

  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // CSRF protection
  if (!validateCsrf(request)) {
    return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = scanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 },
      );
    }

    const { query, sector, icpProfileId, limit = 10 } = parsed.data;

    const workspaceId = authResult.workspaceId;

    const scanHistory = await db.scanHistory.create({
      data: {
        workspaceId,
        icpProfileId: icpProfileId || null,
        status: 'running',
        totalTargets: 0,
      },
    });

    const searchFilters: SearchFilters = {
      query: query || sector || '',
      sectionNaf: sector || undefined,
      departement: undefined,
      codePostal: undefined,
      commune: undefined,
      region: undefined,
      codeNaf: undefined,
      natureJuridique: undefined,
      categorieEntreprise: undefined,
      effectifMin: undefined,
      effectifMax: undefined,
      excludeAssociations: true,
      excludeAutoEntrepreneurs: true,
      trancheCA: undefined,
      statutEntreprise: undefined,
      dateImmatBefore: undefined,
      dateImmatAfter: undefined,
      caMin: undefined,
      caMax: undefined,
      sortBy: 'name',
      source: 'all',
      page: 1,
      limit: limit,
    };

    let apiGouvResults: import('@/lib/types').CompanySearchResult[] = [];
    try {
      apiGouvResults = await searchApiGouv(searchFilters);
    } catch (e) {
      console.error('API Gouv search failed during scan:', e);
    }

    let infoGreffeResults: import('@/lib/types').InfoGreffeRecord[] = [];
    try {
      infoGreffeResults = await searchInfoGreffe(searchFilters);
    } catch (e) {
      console.error('InfoGreffe search failed during scan:', e);
    }

    await db.scanHistory.update({
      where: { id: scanHistory.id },
      data: { totalTargets: apiGouvResults.length + infoGreffeResults.length },
    });

    const createdCompanies: any[] = [];
    for (const result of apiGouvResults) {
      try {
        // Check SIREN uniqueness within workspace (not global)
        const existing = await db.targetCompany.findFirst({ where: { siren: result.siren, workspaceId } });
        if (existing) continue;

        let icpScore: number | null = null;
        try {
          const gemma4 = getGemma4();
          const scoreResponse = await gemma4.chat(
            [{
              role: 'user',
              content: `Score this company as an M&A target (0-100): ${result.nom_raison_sociale}, Sector: ${result.section_activites_principales}, Category: ${result.categorie_entreprise}, Legal form: ${result.nature_juridique}. Reply with ONLY a number between 0 and 100.`,
            }],
            { temperature: 0.3 }
          );
          const scoreText = scoreResponse.content.trim();
          const parsedScore = parseInt(scoreText || '', 10);
          if (!isNaN(parsedScore) && parsedScore >= 0 && parsedScore <= 100) {
            icpScore = parsedScore;
          }
        } catch {
          icpScore = null; // Don't fake scores — better to show no score than a misleading one
        }

        const company = await db.targetCompany.create({
          data: {
            workspaceId,
            siren: result.siren,
            name: result.nom_raison_sociale || '',
            legalName: result.nom_complet || result.nom_raison_sociale || '',
            sector: result.section_activites_principales || '',
            nafCode: result.naf || '',
            city: result.libelle_commune || '',
            postalCode: result.code_postal || '',
            region: result.region || '',
            address: result.geo_adresse || '',
            natureJuridique: result.nature_juridique || '',
            categorieEntreprise: result.categorie_entreprise || '',
            latitude: result.coordonnees?.lat ? parseFloat(result.coordonnees.lat) : null,
            longitude: result.coordonnees?.lon ? parseFloat(result.coordonnees.lon) : null,
            revenue: result.ca ?? null,
            // NOTE: API Gouv does not provide actual employee counts.
            // nombre_etablissements_ouvert = number of open establishments, NOT employees.
            // Setting to null to avoid misleading data.
            employeeCount: null,
            icpScore,
            source: 'scan-api-gouv',
            status: 'identifiees',
            icpProfileId: icpProfileId || null,
            pipelineStages: {
              create: {
                stage: 'identifiees',
                movedAt: new Date(),
              },
            },
          },
        });

        createdCompanies.push(company);
      } catch (createError) {
        console.error(`Failed to create company ${result.siren}:`, createError);
      }
    }

    const infoGreffeSirens = new Set(apiGouvResults.map(r => r.siren));
    for (const result of infoGreffeResults) {
      if (!result.siren || infoGreffeSirens.has(result.siren)) continue;
      try {
        // Check SIREN uniqueness within workspace (not global)
        const existing = await db.targetCompany.findFirst({ where: { siren: result.siren, workspaceId } });
        if (existing) continue;

        await db.targetCompany.create({
          data: {
            workspaceId,
            siren: result.siren,
            name: result.denomination || '',
            sector: '',
            nafCode: result.code_ape || '',
            city: result.ville || '',
            region: result.region || '',
            natureJuridique: result.forme_juridique || '',
            revenue: result.ca_1 ?? null,
            employeeCount: result.effectif_1 ?? null,
            source: 'scan-infogreffe',
            status: 'identifiees',
            icpProfileId: icpProfileId || null,
            pipelineStages: {
              create: {
                stage: 'identifiees',
                movedAt: new Date(),
              },
            },
          },
        });
      } catch (createError) {
        console.error(`Failed to create company from InfoGreffe ${result.siren}:`, createError);
      }
    }

    await db.scanHistory.update({
      where: { id: scanHistory.id },
      data: {
        status: 'completed',
        processedTargets: createdCompanies.length,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      scanId: scanHistory.id,
      companiesCreated: createdCompanies.length,
      totalFound: apiGouvResults.length + infoGreffeResults.length,
    });
  } catch (error) {
    console.error('Scan error:', error);
    return safeErrorResponse('Scan failed', 500);
  }
}
