import { searchApiGouv, searchInfoGreffe } from '@/lib/api';
import { db } from '@/lib/db';
import { getWorkspace } from '@/lib/workspace';
import type { SearchFilters, CompanySearchResult, InfoGreffeRecord } from '@/lib/types';
import { getLLMProviderFactory } from '@/lib/llm';
import { sanitizeString } from '@/lib/security/core/sanitizer';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ScanService');

export interface ScanInput {
  query?: string;
  sector?: string;
  icpProfileId?: string;
  model?: string;
  limit?: number;
  workspaceId?: string;
}

export interface ScanResult {
  success: boolean;
  scanId: string;
  companiesCreated: number;
  totalFound: number;
}

async function createCompanyFromApiGouv(
  result: CompanySearchResult,
  workspaceId: string,
  icpProfileId: string | null,
  model?: string
): Promise<boolean> {
  try {
    const existing = await db.targetCompany.findFirst({
      where: { workspaceId, siren: result.siren },
    });
    if (existing) return false;

    const siege = result.siege;
    const llmFactory = getLLMProviderFactory();
    const icpScore = await llmFactory.chat(
      [
        {
          role: 'user',
          content: `Score this company for M&A targeting (0-100). Return ONLY a number.

Company: ${result.nom_raison_sociale || ''}
Sector: ${result.section_activite_principale || ''}
Size: ${result.categorie_entreprise || ''}
Legal Form: ${result.nature_juridique || ''}`
        }
      ],
      {
        model: model || llmFactory.getDefaultModel(),
        temperature: 0.3,
        maxTokens: 10
      }
    );

    const score = Math.min(100, Math.max(0, parseInt(icpScore.content.trim()) || 0));

    await db.targetCompany.create({
      data: {
        workspaceId,
        siren: sanitizeString(result.siren, { maxLength: 9 }),
        name: sanitizeString(result.nom_raison_sociale || '', { maxLength: 500 }),
        legalName: sanitizeString(result.nom_complet || result.nom_raison_sociale || '', { maxLength: 500 }),
        sector: sanitizeString(result.section_activite_principale || '', { maxLength: 100 }),
        nafCode: sanitizeString(result.activite_principale || siege?.activite_principale || '', { maxLength: 20 }),
        city: sanitizeString(siege?.libelle_commune || '', { maxLength: 200 }),
        postalCode: sanitizeString(siege?.code_postal || '', { maxLength: 20 }),
        region: sanitizeString(siege?.region || '', { maxLength: 200 }),
        address: sanitizeString(siege?.geo_adresse || siege?.adresse || '', { maxLength: 500 }),
        natureJuridique: sanitizeString(result.nature_juridique || '', { maxLength: 100 }),
        categorieEntreprise: sanitizeString(result.categorie_entreprise || '', { maxLength: 50 }),
latitude: siege?.latitude ? Number(siege.latitude) : null,
      longitude: siege?.longitude ? Number(siege.longitude) : null,
      revenue: result.ca ?? null,
      employeeCount: result.nombre_etablissements_ouverts || null,
      icpScore: score,
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
    logger.error('Failed to create company from API Gouv', createError, { siren: result.siren });
    return false;
  }
}

async function createCompanyFromInfoGreffe(
  result: InfoGreffeRecord,
  workspaceId: string,
  icpProfileId: string | null
): Promise<boolean> {
  try {
    if (!result.siren) return false;

    const existing = await db.targetCompany.findFirst({
      where: { workspaceId, siren: result.siren },
    });
    if (existing) return false;

    await db.targetCompany.create({
      data: {
        workspaceId,
        siren: sanitizeString(result.siren, { maxLength: 9 }),
        name: sanitizeString(result.denomination || '', { maxLength: 500 }),
        sector: '',
        nafCode: sanitizeString(result.code_ape || '', { maxLength: 20 }),
        city: sanitizeString(result.ville || '', { maxLength: 200 }),
        region: sanitizeString(result.region || '', { maxLength: 200 }),
        natureJuridique: sanitizeString(result.forme_juridique || '', { maxLength: 100 }),
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
    logger.error('Failed to create company from InfoGreffe', createError, { siren: result.siren });
    return false;
  }
}

export async function executeScan(input: ScanInput): Promise<ScanResult> {
  if (!input.query && !input.sector) {
    throw new Error('Query or sector is required');
  }

  const workspace = input.workspaceId
    ? { id: input.workspaceId, name: '', slug: '', plan: '' }
    : await getWorkspace();
  const workspaceId = workspace.id;

  const scanHistory = await db.scanHistory.create({
    data: {
      workspaceId,
      icpProfileId: input.icpProfileId || null,
      status: 'running',
      totalTargets: 0,
    },
  });

  const searchFilters: SearchFilters = {
    query: sanitizeString(input.query || input.sector || '', { maxLength: 500 }),
    sectionNaf: input.sector ? sanitizeString(input.sector, { maxLength: 100 }) : undefined,
    excludeAssociations: true,
    excludeAutoEntrepreneurs: true,
    page: 1,
    limit: input.limit || 10,
  };

  let apiGouvResults: CompanySearchResult[] = [];
  try {
    apiGouvResults = await searchApiGouv(searchFilters);
  } catch (e) {
    logger.error('API Gouv search failed during scan', e);
  }

  let infoGreffeResults: InfoGreffeRecord[] = [];
  try {
    infoGreffeResults = await searchInfoGreffe(searchFilters);
  } catch (e) {
    logger.error('InfoGreffe search failed during scan', e);
  }

  await db.scanHistory.update({
    where: { id: scanHistory.id },
    data: { totalTargets: apiGouvResults.length + infoGreffeResults.length },
  });

  let createdCount = 0;
  for (const result of apiGouvResults) {
    const created = await createCompanyFromApiGouv(result, workspaceId, input.icpProfileId || null, input.model);
    if (created) createdCount++;
  }

  const infoGreffeSirens = new Set(apiGouvResults.map(r => r.siren));
  for (const result of infoGreffeResults) {
    if (!result.siren || infoGreffeSirens.has(result.siren)) continue;
    const created = await createCompanyFromInfoGreffe(result, workspaceId, input.icpProfileId || null);
    if (created) createdCount++;
  }

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
