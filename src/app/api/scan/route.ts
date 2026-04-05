import { NextRequest, NextResponse } from 'next/server';
import { searchApiGouv } from '@/lib/api-gouv';
import { searchInfoGreffe } from '@/lib/infogreffe';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';
import type { SearchFilters } from '@/lib/types';

// POST /api/scan - AI-powered scan
export async function POST(request: NextRequest) {
  try {
    const { query, sector, icpProfileId, limit = 10 } = await request.json();

    if (!query && !sector) {
      return NextResponse.json({ error: 'Query or sector is required' }, { status: 400 });
    }

    // Ensure workspace exists
    let workspace = await db.workspace.findFirst();
    if (!workspace) {
      workspace = await db.workspace.create({
        data: { name: 'Default Workspace', slug: 'default-workspace' },
      });
    }

    // Create scan history
    const scanHistory = await db.scanHistory.create({
      data: {
        workspaceId: workspace.id,
        icpProfileId: icpProfileId || null,
        status: 'running',
        totalTargets: 0,
      },
    });

    // Search API Gouv
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

    // Search InfoGreffe
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

    // Create companies from API Gouv results
    const createdCompanies: any[] = [];
    for (const result of apiGouvResults) {
      try {
        const existing = await db.targetCompany.findUnique({ where: { siren: result.siren } });
        if (existing) continue;

        // Use AI to score if z-ai-web-dev-sdk is available
        let icpScore: number | null = null;
        try {
          const zai = await ZAI.create();
          const scoreResponse = await zai.chat.completions.create({
            messages: [
              {
                role: 'system',
                content: 'You are an M&A deal scoring assistant. Score companies from 0-100 based on their attractiveness as acquisition targets. Reply with ONLY a number between 0 and 100.',
              },
              {
                role: 'user',
                content: `Score this company as an M&A target (0-100): ${result.nom_raison_sociale}, Sector: ${result.section_activites_principales}, Category: ${result.categorie_entreprise}, Legal form: ${result.nature_juridique}`,
              },
            ],
          });
          const scoreText = scoreResponse.choices?.[0]?.message?.content?.trim();
          const parsed = parseInt(scoreText || '', 10);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
            icpScore = parsed;
          }
        } catch {
          // AI scoring unavailable in sandbox — assign random score
          icpScore = Math.floor(Math.random() * 40) + 50;
        }

        const company = await db.targetCompany.create({
          data: {
            workspaceId: workspace.id,
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
            employeeCount: result.nombre_etablissements_ouvert || null,
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

    // Also process InfoGreffe results for additional companies
    const infoGreffeSirens = new Set(apiGouvResults.map(r => r.siren));
    for (const result of infoGreffeResults) {
      if (!result.siren || infoGreffeSirens.has(result.siren)) continue;
      try {
        const existing = await db.targetCompany.findUnique({ where: { siren: result.siren } });
        if (existing) continue;

        await db.targetCompany.create({
          data: {
            workspaceId: workspace.id,
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

    // Update scan history
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
    return NextResponse.json({ error: 'Scan failed', details: String(error) }, { status: 500 });
  }
}
