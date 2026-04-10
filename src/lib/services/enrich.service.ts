import { db } from '@/lib/db';
import { getInfoGreffeBySiren, parseInfoGreffeFinancial } from '@/lib/api';
import type { InfoGreffeRecord, CompanySearchResult } from '@/lib/types';
import { isValidCuid } from '@/lib/validators';
import { getEffectifFromTranche } from '@/lib/utils';
import { EXTERNAL_URLS, TIMEOUTS } from '@/constants';
import { createLogger } from '@/lib/logger';

const logger = createLogger('EnrichService');

// ── Batch enrich cooldown ──────────────────────────────────────
export const MAX_BATCH_SIZE = 10;
export const BATCH_COOLDOWN_MS = 60_000; // 60 seconds
let lastBatchEnrichTime = 0;

// ── Core enrich logic ────────────────────────────────────────────
export async function enrichCompany(id: string, workspaceId?: string): Promise<{ success: boolean; error?: string }> {
  // Validate CUID format to prevent injection
  if (!isValidCuid(id)) {
    return { success: false, error: 'ID invalide' };
  }

  // Verify workspace ownership if workspaceId is provided
  const whereClause = workspaceId
    ? { id, workspaceId }
    : { id };
  const company = await db.targetCompany.findFirst({ where: whereClause });
  if (!company) {
    return { success: false, error: 'Entreprise non trouvée' };
  }

  // Appels API parallèles : API Gouv + InfoGreffe
  const [apiGouvRes, infoGreffeRes] = await Promise.allSettled([
    fetch(`${EXTERNAL_URLS.API_GOUV_SEARCH}?q=siren:${company.siren}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(TIMEOUTS.API_GOUV_MS),
    }).then(r => r.ok ? r.json() as Promise<{ results?: CompanySearchResult[] }> : null),
    getInfoGreffeBySiren(company.siren),
  ]);

  let gouvResult: CompanySearchResult | null = null;
  if (apiGouvRes.status === 'fulfilled' && apiGouvRes.value?.results?.[0]) {
    gouvResult = apiGouvRes.value.results[0];
  }

  let infogreffeRecord: InfoGreffeRecord | null = null;
  if (infoGreffeRes.status === 'fulfilled') {
    infogreffeRecord = infoGreffeRes.value;
  } else {
    logger.warn('InfoGreffe lookup failed for SIREN', { siren: company.siren });
  }

  // Extraire données financières InfoGreffe
  const financial = infogreffeRecord ? parseInfoGreffeFinancial(infogreffeRecord) : null;

  // Construire le JSON blob des données enrichies
  const enrichedJson: Record<string, unknown> = {
    // Données API Gouv
    apiGouv: gouvResult ? {
      nomComplet: gouvResult.nom_complet,
      sigle: gouvResult.sigle,
      sectionActivites: gouvResult.section_activite_principale,
      activitePrincipale: gouvResult.activite_principale,
      nombreEtablissements: gouvResult.nombre_etablissements,
      nombreEtablissementsOuvert: gouvResult.nombre_etablissements_ouverts,
      etatAdministratif: gouvResult.etat_administratif,
      dirigeants: gouvResult.dirigeants,
      finances: gouvResult.finances,
      siege: gouvResult.siege,
      matchingEtablissements: gouvResult.matching_etablissements,
      sourceApi: 'api-gouv',
    } : null,
    // Données InfoGreffe
    infogreffe: infogreffeRecord ? {
      denomination: infogreffeRecord.denomination,
      formeJuridique: infogreffeRecord.forme_juridique,
      codeApe: infogreffeRecord.code_ape,
      libelleApe: infogreffeRecord.libelle_ape,
      adresse: infogreffeRecord.adresse,
      ville: infogreffeRecord.ville,
      departement: infogreffeRecord.departement,
      region: infogreffeRecord.region,
      codeGreffe: infogreffeRecord.code_greffe,
      greffe: infogreffeRecord.greffe,
      dateImmatriculation: infogreffeRecord.date_immatriculation,
      dateRadiation: infogreffeRecord.date_radiation,
      statut: infogreffeRecord.statut,
      nic: infogreffeRecord.nic,
      sourceApi: 'infogreffe',
    } : null,
    // Données financières
    financial: financial ? {
      caHistory: financial.caHistory,
      latestCa: financial.latestCa,
      latestResultat: financial.latestResultat,
      latestEffectif: financial.latestEffectif,
      latestDateCloture: financial.latestDateCloture,
      trancheCA: financial.trancheCA,
    } : null,
    lastEnrichedAt: new Date().toISOString(),
  };

  // Construire les données de mise à jour DB
  const updateData: Record<string, unknown> = {
    isEnriched: true,
    enrichedData: JSON.stringify(enrichedJson),
  };

  // Mettre à jour les champs structurés depuis API Gouv
  if (gouvResult) {
    const siege = gouvResult.siege;
    if (gouvResult.nom_raison_sociale) updateData.name = gouvResult.nom_raison_sociale;
    if (gouvResult.nom_complet) updateData.legalName = gouvResult.nom_complet;
    if (gouvResult.section_activite_principale) updateData.sector = gouvResult.section_activite_principale;
    if (gouvResult.activite_principale) updateData.nafCode = gouvResult.activite_principale;
    if (siege?.libelle_commune) updateData.city = siege.libelle_commune;
    if (siege?.code_postal) updateData.postalCode = siege.code_postal;
    if (siege?.region) updateData.region = siege.region;
    if (siege?.geo_adresse) updateData.address = siege.geo_adresse;
    if (gouvResult.nature_juridique) updateData.natureJuridique = gouvResult.nature_juridique;
    if (gouvResult.categorie_entreprise) updateData.categorieEntreprise = gouvResult.categorie_entreprise;
    if (gouvResult.finances && typeof gouvResult.finances === 'object') {
      const years = Object.keys(gouvResult.finances).sort().reverse();
      for (const year of years) {
        if (gouvResult.finances[year]?.ca != null) {
          updateData.revenue = gouvResult.finances[year].ca;
          break;
        }
      }
    }
    const effectifNumber = getEffectifFromTranche(gouvResult.tranche_effectif_salarie);
    if (effectifNumber != null) {
      updateData.employeeCount = effectifNumber;
    }
    if (siege?.latitude) updateData.latitude = Number(siege.latitude);
    if (siege?.longitude) updateData.longitude = Number(siege.longitude);
    if (gouvResult.etat_administratif) {
      updateData.statutEntreprise = gouvResult.etat_administratif === 'A' ? 'Active' : 'Cessée';
    }
    if (gouvResult.date_creation) updateData.dateImmatriculation = gouvResult.date_creation;
  }

  // Mettre à jour les champs enrichis depuis InfoGreffe
  if (infogreffeRecord) {
    if (infogreffeRecord.libelle_ape && !updateData.nafLabel) updateData.nafLabel = infogreffeRecord.libelle_ape;
    if (infogreffeRecord.date_immatriculation) updateData.dateImmatriculation = infogreffeRecord.date_immatriculation;
    if (infogreffeRecord.statut) updateData.statutEntreprise = infogreffeRecord.statut;
    if (infogreffeRecord.greffe) updateData.greffe = infogreffeRecord.greffe;
    if (infogreffeRecord.adresse) updateData.adresseComplete = infogreffeRecord.adresse;
    if (financial?.trancheCA) updateData.trancheCA = financial.trancheCA;
    if (financial?.latestDateCloture) updateData.dateClotureExercice = financial.latestDateCloture;
    // Mettre à jour ville/code postal si manquants
    if (!updateData.city && infogreffeRecord.ville) updateData.city = infogreffeRecord.ville;
    if (!updateData.postalCode && infogreffeRecord.code_postal) updateData.postalCode = infogreffeRecord.code_postal;
    if (!updateData.region && infogreffeRecord.region) updateData.region = infogreffeRecord.region;
    if (!updateData.address && infogreffeRecord.adresse) updateData.address = infogreffeRecord.adresse;
    // Code APE si manquant
    if (!updateData.nafCode && infogreffeRecord.code_ape) updateData.nafCode = infogreffeRecord.code_ape;
  }

  // Mettre à jour l'entreprise en DB
  await db.targetCompany.update({
    where: { id },
    data: updateData,
  });

  return { success: true };
}

// ── Check batch cooldown ─────────────────────────────────────────
export function checkBatchCooldown(): { allowed: boolean; remainingSeconds?: number } {
  const now = Date.now();
  if (now - lastBatchEnrichTime < BATCH_COOLDOWN_MS) {
    const remaining = Math.ceil((BATCH_COOLDOWN_MS - (now - lastBatchEnrichTime)) / 1000);
    return { allowed: false, remainingSeconds: remaining };
  }
  return { allowed: true };
}

// ── Mark batch enrich time ───────────────────────────────────────
export function markBatchEnrichTime(): void {
  lastBatchEnrichTime = Date.now();
}

// ── Batch enrich ─────────────────────────────────────────────────
export interface BatchEnrichResult {
  total: number;
  enriched: number;
  failed: number;
  batchLimit: number;
  message?: string;
}

export async function batchEnrich(forceAll: boolean, workspaceId?: string): Promise<BatchEnrichResult> {
  // Check cooldown
  const cooldown = checkBatchCooldown();
  if (!cooldown.allowed) {
    throw new Error(`Veuillez attendre ${cooldown.remainingSeconds} secondes avant un nouvel enrichissement batch`);
  }

  // Build filter: workspace isolation + optional forceAll
  const baseWhere: Record<string, unknown> = workspaceId ? { workspaceId } : {};
  const whereClause = forceAll ? baseWhere : { ...baseWhere, isEnriched: false };

  // Récupérer les entreprises à enrichir
  const allCompanies = await db.targetCompany.findMany({
    where: whereClause,
    select: { id: true, siren: true },
    orderBy: { createdAt: 'desc' },
  });

  // Apply batch size limit
  const companies = allCompanies.slice(0, MAX_BATCH_SIZE);

  if (companies.length === 0) {
    return { total: 0, enriched: 0, failed: 0, batchLimit: MAX_BATCH_SIZE, message: 'Aucune entreprise à enrichir' };
  }

  // Update last batch enrich time
  markBatchEnrichTime();

  const results: BatchEnrichResult = { total: allCompanies.length, enriched: 0, failed: 0, batchLimit: MAX_BATCH_SIZE };

  for (const comp of companies) {
    try {
      const result = await enrichCompany(comp.id, workspaceId);
      if (result.success) {
        results.enriched++;
      } else {
        results.failed++;
        logger.warn('Enrich failed for company', { id: comp.id, error: result.error });
      }
      await new Promise(r => setTimeout(r, 500));
    } catch (error) {
      results.failed++;
      logger.error('Enrich error for company', error, { id: comp.id });
    }
  }

  return results;
}
