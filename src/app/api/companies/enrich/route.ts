import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-guard';
import { validateCsrf, safeErrorResponse, isValidId } from '@/lib/security';
import { searchApiGouv } from '@/lib/api-gouv';
import { getInfoGreffeBySiren, parseInfoGreffeFinancial } from '@/lib/infogreffe';
import { z } from 'zod';

const batchEnrichSchema = z.object({ forceAll: z.boolean().optional() });

// GET /api/companies/enrich?id=xxx
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !isValidId(id)) {
      return NextResponse.json({ error: 'Company ID invalide' }, { status: 400 });
    }

    const company = await db.targetCompany.findFirst({ where: { id, workspaceId: authResult.workspaceId } });
    if (!company) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 });
    }

    const [apiGouvRes, infoGreffeRes] = await Promise.allSettled([
      fetch(`https://recherche-entreprises.api.gouv.fr/search?q=siren:${company.siren}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      }).then(r => r.ok ? r.text().then(t => (t.startsWith('<!DOCTYPE') || t.startsWith('<html')) ? null : JSON.parse(t)) : null),
      getInfoGreffeBySiren(company.siren),
    ]);

    let gouvResult: any = null;
    if (apiGouvRes.status === 'fulfilled' && apiGouvRes.value) {
      const data = apiGouvRes.value;
      if (data.results?.[0]) {
        gouvResult = data.results[0];
      }
    }

    let infogreffeRecord: any = null;
    if (infoGreffeRes.status === 'fulfilled') {
      infogreffeRecord = infoGreffeRes.value;
    }

    const financial = infogreffeRecord ? parseInfoGreffeFinancial(infogreffeRecord) : null;

    const enrichedJson: Record<string, unknown> = {
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

    const updateData: Record<string, unknown> = {
      isEnriched: true,
      enrichedData: JSON.stringify(enrichedJson),
    };

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
      // NOTE: Do NOT set employeeCount from nombre_etablissements_ouvert —
      // that field is the number of open establishments, NOT employee count.
      if (gouvResult.coordonnees?.lat) updateData.latitude = parseFloat(gouvResult.coordonnees.lat);
      if (gouvResult.coordonnees?.lon) updateData.longitude = parseFloat(gouvResult.coordonnees.lon);
    }

    if (infogreffeRecord) {
      if (infogreffeRecord.libelle_ape && !updateData.nafLabel) updateData.nafLabel = infogreffeRecord.libelle_ape;
      if (infogreffeRecord.date_immatriculation) updateData.dateImmatriculation = infogreffeRecord.date_immatriculation;
      if (infogreffeRecord.statut) updateData.statutEntreprise = infogreffeRecord.statut;
      if (infogreffeRecord.greffe) updateData.greffe = infogreffeRecord.greffe;
      if (infogreffeRecord.adresse) updateData.adresseComplete = infogreffeRecord.adresse;
      if (financial?.trancheCA) updateData.trancheCA = financial.trancheCA;
      if (financial?.latestDateCloture) updateData.dateClotureExercice = financial.latestDateCloture;
      if (!updateData.city && infogreffeRecord.ville) updateData.city = infogreffeRecord.ville;
      if (!updateData.postalCode && infogreffeRecord.code_postal) updateData.postalCode = infogreffeRecord.code_postal;
      if (!updateData.region && infogreffeRecord.region) updateData.region = infogreffeRecord.region;
      if (!updateData.address && infogreffeRecord.adresse) updateData.address = infogreffeRecord.adresse;
      if (!updateData.nafCode && infogreffeRecord.code_ape) updateData.nafCode = infogreffeRecord.code_ape;
    }

    const updated = await db.targetCompany.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      company: updated,
      sources: {
        apiGouv: !!gouvResult,
        infogreffe: !!infogreffeRecord,
      },
    });
  } catch (error) {
    console.error('Enrich error:', error);
    return safeErrorResponse("Échec de l'enrichissement", 500);
  }
}

// POST /api/companies/enrich - batch enrich
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const csrfValid = validateCsrf(request);
  if (!csrfValid) {
    return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = batchEnrichSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 },
      );
    }

    const { forceAll } = parsed.data;

    // Batch enrich: limit to prevent abuse
    const MAX_BATCH = 50;
    const companies = await db.targetCompany.findMany({
      where: {
        ...(forceAll ? {} : { isEnriched: false }),
        workspaceId: authResult.workspaceId,
      },
      select: { id: true, siren: true },
      take: MAX_BATCH,
    });

    const results = { total: companies.length, enriched: 0, failed: 0 };

    for (const comp of companies) {
      try {
        const reqUrl = new URL(request.url);
        const baseUrl = `${reqUrl.protocol}//${reqUrl.host}`;
        const authHeader = request.headers.get('authorization');
        const res = await fetch(`${baseUrl}/api/companies/enrich?id=${comp.id}`, {
          headers: authHeader ? { 'Authorization': authHeader } : {},
          signal: AbortSignal.timeout(30000),
        });
        if (res.ok) {
          results.enriched++;
        } else {
          results.failed++;
        }
        await new Promise(r => setTimeout(r, 500));
      } catch {
        results.failed++;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Batch enrich error:', error);
    return safeErrorResponse("Échec de l'enrichissement batch", 500);
  }
}
