import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { searchApiGouv } from '@/lib/api-gouv';
import { getInfoGreffeBySiren, parseInfoGreffeFinancial } from '@/lib/infogreffe';
import type { InfoGreffeRecord, CombinedSearchResult } from '@/lib/types';

// GET /api/companies/enrich?id=xxx - enrichir une entreprise depuis API Gouv + InfoGreffe
// Stocke TOUTES les données enrichies en DB (pas de fetch live)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Company ID requis' }, { status: 400 });
    }

    // Récupérer l'entreprise depuis la DB
    const company = await db.targetCompany.findUnique({ where: { id } });
    if (!company) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 });
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
    return NextResponse.json({ error: "Échec de l'enrichissement", details: String(error) }, { status: 500 });
  }
}

// POST /api/companies/enrich/batch - enrichir toutes les entreprises non enrichies
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { forceAll } = body;

    // Récupérer les entreprises à enrichir
    const companies = await db.targetCompany.findMany({
      where: forceAll ? {} : { isEnriched: false },
      select: { id: true, siren: true },
    });

    const results = { total: companies.length, enriched: 0, failed: 0 };

    for (const comp of companies) {
      try {
        const reqUrl = new URL(request.url);
        const baseUrl = `${reqUrl.protocol}//${reqUrl.host}`;
        const res = await fetch(`${baseUrl}/api/companies/enrich?id=${comp.id}`);
        if (res.ok) {
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

    return NextResponse.json(results);
  } catch (error) {
    console.error('Batch enrich error:', error);
    return NextResponse.json({ error: 'Échec de l\'enrichissement batch', details: String(error) }, { status: 500 });
  }
}
