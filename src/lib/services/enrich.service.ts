// ─── Enrich Service ──────────────────────────────────────────────
// Pure business logic for enriching company data from API Gouv + InfoGreffe.
// No NextRequest/NextResponse dependencies.

import { db } from '@/lib/db';
import { getInfoGreffeBySiren, parseInfoGreffeFinancial } from '@/lib/api';
import type { InfoGreffeRecord } from '@/lib/types';
import { isValidCuid } from '@/validators';

// ── Batch enrich cooldown ──────────────────────────────────────
export const MAX_BATCH_SIZE = 10;
export const BATCH_COOLDOWN_MS = 60_000; // 60 seconds
let lastBatchEnrichTime = 0;

// ── Core enrich logic ────────────────────────────────────────────
export async function enrichCompany(id: string): Promise<{ success: boolean; error?: string }> {
  // Validate CUID format to prevent injection
  if (!isValidCuid(id)) {
    return { success: false, error: 'ID invalide' };
  }

  const company = await db.targetCompany.findUnique({ where: { id } });
  if (!company) {
    return { success: false, error: 'Entreprise non trouvée' };
  }

  // Appels API parallèles : API Gouv + InfoGreffe
  const [apiGouvRes, infoGreffeRes] = await Promise.allSettled([
    // API Gouv : recherche par SIREN exact
    fetch(`https://recherche-entreprises.api.gouv.fr/search?q=siren:${company.siren}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    }).then(r => r.ok ? r.json() : null),
    // InfoGreffe : lookup par SIREN
    getInfoGreffeBySiren(company.siren),
  ]);

  // Parser API Gouv
  let gouvResult: any = null;
  if (apiGouvRes.status === 'fulfilled' && apiGouvRes.value) {
    const data = apiGouvRes.value;
    if (data.results?.[0]) {
      gouvResult = data.results[0];
    }
  }

  // Parser InfoGreffe
  let infogreffeRecord: InfoGreffeRecord | null = null;
  if (infoGreffeRes.status === 'fulfilled') {
    infogreffeRecord = infoGreffeRes.value;
  }

  // Extraire données financières InfoGreffe
  const financial = infogreffeRecord ? parseInfoGreffeFinancial(infogreffeRecord) : null;

  // Construire le JSON blob des données enrichies
  const enrichedJson: Record<string, unknown> = {
    // Données API Gouv
    apiGouv: gouvResult ? {
      nomComplet: gouvResult.nom_complet,
      sigle: gouvResult.sigle,
      sectionActivites: gouvResult.section_activites_principales,
      nombreEtablissements: gouvResult.nombre_etablissements,
      nombreEtablissementsOuvert: gouvResult.nombre_etablissements_ouvert,
      dirigeants: gouvResult.dirigeants,
      ca: gouvResult.ca,
      resultatNet: gouvResult.resultat_net,
      coordonnees: gouvResult.coordonnees,
      geoAdresse: gouvResult.geo_adresse,
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
    if (gouvResult.nom_raison_sociale) updateData.name = gouvResult.nom_raison_sociale;
    if (gouvResult.nom_complet) updateData.legalName = gouvResult.nom_complet;
    if (gouvResult.section_activites_principales) updateData.sector = gouvResult.section_activites_principales;
    if (gouvResult.naf) updateData.nafCode = gouvResult.naf;
    if (gouvResult.libelle_naf) updateData.nafLabel = gouvResult.libelle_naf;
    if (gouvResult.libelle_commune) updateData.city = gouvResult.libelle_commune;
    if (gouvResult.code_postal) updateData.postalCode = gouvResult.code_postal;
    if (gouvResult.region) updateData.region = gouvResult.region;
    if (gouvResult.geo_adresse) updateData.address = gouvResult.geo_adresse;
    if (gouvResult.nature_juridique) updateData.natureJuridique = gouvResult.nature_juridique;
    if (gouvResult.categorie_entreprise) updateData.categorieEntreprise = gouvResult.categorie_entreprise;
    if (gouvResult.ca != null) updateData.revenue = gouvResult.ca;
    if (gouvResult.nombre_etablissements_ouvert != null) updateData.employeeCount = gouvResult.nombre_etablissements_ouvert;
    if (gouvResult.coordonnees?.lat) updateData.latitude = parseFloat(gouvResult.coordonnees.lat);
    if (gouvResult.coordonnees?.lon) updateData.longitude = parseFloat(gouvResult.coordonnees.lon);
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

export async function batchEnrich(forceAll: boolean): Promise<BatchEnrichResult> {
  // Check cooldown
  const cooldown = checkBatchCooldown();
  if (!cooldown.allowed) {
    throw new Error(`Veuillez attendre ${cooldown.remainingSeconds} secondes avant un nouvel enrichissement batch`);
  }

  // Récupérer les entreprises à enrichir
  const allCompanies = await db.targetCompany.findMany({
    where: forceAll ? {} : { isEnriched: false },
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
      const result = await enrichCompany(comp.id);
      if (result.success) {
        results.enriched++;
      } else {
        results.failed++;
      }
      // Petit délai pour ne pas spammer les APIs
      await new Promise(r => setTimeout(r, 500));
    } catch {
      results.failed++;
    }
  }

  return results;
}
