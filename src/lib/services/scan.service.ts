// ─── Scan Service ────────────────────────────────────────────────
// Pure business logic for AI-powered company scanning.
// No NextRequest/NextResponse dependencies.

import { searchApiGouv, searchInfoGreffe } from '@/lib/api';
import { db } from '@/lib/db';
import { getWorkspace } from '@/lib/workspace';
import type { SearchFilters, CompanySearchResult, InfoGreffeRecord } from '@/lib/types';
import { getGemma4 } from '@/lib/gemma4';

// ── Types ────────────────────────────────────────────────────────
export interface ScanInput {
  query?: string;
  sector?: string;
  icpProfileId?: string;
  limit?: number;
  workspaceId?: string;
}

export interface ScanResult {
  success: boolean;
  scanId: string;
  companiesCreated: number;
  totalFound: number;
}

// ── Create company from API Gouv result ──────────────────────────
async function createCompanyFromApiGouv(
  result: CompanySearchResult,
  workspaceId: string,
  icpProfileId: string | null,
): Promise<boolean> {
  try {
    // BUGFIX: Filter by workspaceId to prevent cross-workspace data leaks
    const existing = await db.targetCompany.findFirst({
      where: { workspaceId, siren: result.siren },
    });
    if (existing) return false;

    // Use singleton AI service to score (consolidated from ai.service.ts)
    const gemma4 = getGemma4();
    const icpScore = await gemma4.scoreCompanyMA(
      result.nom_raison_sociale,
      result.section_activites_principales || '',
      result.categorie_entreprise || '',
      result.nature_juridique || '',
    );

    await db.targetCompany.create({
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

    return true;
  } catch (createError) {
    console.error(`Failed to create company ${result.siren}:`, createError);
    return false;
  }
}

// ── Create company from InfoGreffe result ────────────────────────
async function createCompanyFromInfoGreffe(
  result: InfoGreffeRecord,
  workspaceId: string,
  icpProfileId: string | null,
): Promise<boolean> {
  try {
    if (!result.siren) return false;

    // BUGFIX: Filter by workspaceId to prevent cross-workspace data leaks
    const existing = await db.targetCompany.findFirst({
      where: { workspaceId, siren: result.siren },
    });
    if (existing) return false;

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

    return true;
  } catch (createError) {
    console.error(`Failed to create company from InfoGreffe ${result.siren}:`, createError);
    return false;
  }
}

// ── Main scan orchestration ──────────────────────────────────────
export async function executeScan(input: ScanInput): Promise<ScanResult> {
  if (!input.query && !input.sector) {
    throw new Error('Query or sector is required');
  }

  // Use provided workspaceId or fall back to getWorkspace()
  const workspace = input.workspaceId
    ? { id: input.workspaceId, name: '', slug: '', plan: '' }
    : await getWorkspace();
  const workspaceId = workspace.id;

  // Create scan history
  const scanHistory = await db.scanHistory.create({
    data: {
      workspaceId,
      icpProfileId: input.icpProfileId || null,
      status: 'running',
      totalTargets: 0,
    },
  });

  // Search API Gouv
  const searchFilters: SearchFilters = {
    query: input.query || input.sector || '',
    sectionNaf: input.sector || undefined,
    excludeAssociations: true,
    excludeAutoEntrepreneurs: true,
    page: 1,
    limit: input.limit || 10,
  };

  let apiGouvResults: CompanySearchResult[] = [];
  try {
    apiGouvResults = await searchApiGouv(searchFilters);
  } catch (e) {
    console.error('API Gouv search failed during scan:', e);
  }

  // Search InfoGreffe
  let infoGreffeResults: InfoGreffeRecord[] = [];
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
  let createdCount = 0;
  for (const result of apiGouvResults) {
    const created = await createCompanyFromApiGouv(result, workspaceId, input.icpProfileId || null);
    if (created) createdCount++;
  }

  // Also process InfoGreffe results for additional companies
  const infoGreffeSirens = new Set(apiGouvResults.map(r => r.siren));
  for (const result of infoGreffeResults) {
    if (!result.siren || infoGreffeSirens.has(result.siren)) continue;
    const created = await createCompanyFromInfoGreffe(result, workspaceId, input.icpProfileId || null);
    if (created) createdCount++;
  }

  // Update scan history
  await db.scanHistory.update({
    where: { id: scanHistory.id },
    data: {
      status: 'completed',
      processedTargets: createdCount,
      completedAt: new Date(),
    },
  });

  return {
    success: true,
    scanId: scanHistory.id,
    companiesCreated: createdCount,
    totalFound: apiGouvResults.length + infoGreffeResults.length,
  };
}
