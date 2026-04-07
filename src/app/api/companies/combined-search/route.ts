import { NextRequest, NextResponse } from 'next/server';
import { searchApiGouv } from '@/lib/api-gouv';
import { searchInfoGreffe } from '@/lib/infogreffe';
import { parseInfoGreffeFinancial } from '@/lib/infogreffe';
import { requireAuth } from '@/lib/api-guard';
import { isRateLimited, getClientIp, rateLimitedResponse, safeErrorResponse } from '@/lib/security';
import { parseSearchFilters, hasSearchParams } from '@/lib/services/company.service';
import type { CombinedSearchResult, InfoGreffeRecord } from '@/lib/types';

// GET /api/companies/combined-search - recherche parallèle
export async function GET(request: NextRequest) {
  // Rate limiting: 20 req/min per IP
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 20, 60 * 1000)) {
    return rateLimitedResponse();
  }

  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const filters = parseSearchFilters(new URL(request.url).searchParams);

    if (!hasSearchParams(filters)) {
      return NextResponse.json({ error: 'Au moins un paramètre de recherche est requis' }, { status: 400 });
    }

    const callApiGouv = filters.source === 'all' || filters.source === 'api-gouv';
    const callInfoGreffe = filters.source === 'all' || filters.source === 'infogreffe';

    // Build promises with named references for safe access
    let apiGouvPromise: Promise<any> | null = null;
    let infoGreffePromise: Promise<any> | null = null;
    if (callApiGouv) apiGouvPromise = searchApiGouv(filters);
    if (callInfoGreffe) infoGreffePromise = searchInfoGreffe(filters);

    const promises = [apiGouvPromise, infoGreffePromise].filter(Boolean) as Promise<any>[];
    const settledResults = await Promise.allSettled(promises);

    const apiGouvData = (callApiGouv && apiGouvPromise && settledResults[0]?.status === 'fulfilled')
      ? (settledResults[0] as PromiseFulfilledResult<any>).value
      : [];

    const infoGreffeData = (callInfoGreffe && infoGreffePromise && settledResults[(callApiGouv ? 1 : 0)]?.status === 'fulfilled')
      ? (settledResults[(callApiGouv ? 1 : 0)] as PromiseFulfilledResult<any>).value
      : [];

    const gouvMapped: CombinedSearchResult[] = apiGouvData.map((r: any) => ({
      siren: r.siren,
      name: r.nom_raison_sociale || r.nom_complet || '',
      sector: r.section_activites_principales || '',
      nafCode: r.naf || '',
      nafLabel: r.libelle_naf || '',
      location: `${r.libelle_commune || ''} ${r.code_postal || ''}`.trim(),
      postalCode: r.code_postal || '',
      city: r.libelle_commune || '',
      department: r.departement || undefined,
      region: r.region || undefined,
      address: r.geo_adresse || undefined,
      latitude: r.coordonnees?.lat ? parseFloat(r.coordonnees.lat) : undefined,
      longitude: r.coordonnees?.lon ? parseFloat(r.coordonnees.lon) : undefined,
      employeeCount: undefined,
      categorieEntreprise: r.categorie_entreprise || undefined,
      natureJuridique: r.nature_juridique || undefined,
      revenue: r.ca ?? undefined,
      directors: r.dirigeants?.map((d: any) => ({
        nom: d.nom,
        prenom: d.prenom,
        fonction: d.fonction,
      })),
      source: 'api-gouv',
    }));

    const infoGreffeMap = new Map<string, InfoGreffeRecord>();
    for (const record of infoGreffeData) {
      if (record.siren) {
        infoGreffeMap.set(record.siren, record);
      }
    }

    const merged = new Map<string, CombinedSearchResult>();

    for (const result of gouvMapped) {
      const financialRecord = infoGreffeMap.get(result.siren);
      if (financialRecord) {
        const financial = parseInfoGreffeFinancial(financialRecord);
        result.caHistory = financial?.caHistory;
        if (result.revenue == null && financial?.latestCa) {
          result.revenue = financial.latestCa;
        }
        if (!result.nafLabel && financialRecord.libelle_ape) {
          result.nafLabel = financialRecord.libelle_ape;
        }
        result.dateImmatriculation = financialRecord.date_immatriculation || undefined;
        result.statut = financialRecord.statut || undefined;
        result.greffe = financialRecord.greffe || undefined;
        result.dateClotureExercice = financial?.latestDateCloture || undefined;
        result.trancheCA = financial?.trancheCA || undefined;
        if (financialRecord.adresse) {
          result.adresse = financialRecord.adresse;
        }
      }
      merged.set(result.siren, result);
    }

    for (const [siren, record] of infoGreffeMap) {
      if (!merged.has(siren)) {
        const financial = parseInfoGreffeFinancial(record);
        merged.set(siren, {
          siren: record.siren,
          name: record.denomination || '',
          sector: '',
          nafCode: record.code_ape || '',
          nafLabel: record.libelle_ape || '',
          location: `${record.ville || ''}`.trim(),
          postalCode: record.code_postal || '',
          city: record.ville || '',
          department: record.departement || undefined,
          region: record.region || undefined,
          address: record.adresse || undefined,
          revenue: financial?.latestCa ?? undefined,
          caHistory: financial?.caHistory,
          natureJuridique: record.forme_juridique || undefined,
          source: 'infogreffe',
          dateImmatriculation: record.date_immatriculation || undefined,
          statut: record.statut || undefined,
          greffe: record.greffe || undefined,
          dateClotureExercice: financial?.latestDateCloture || undefined,
          trancheCA: financial?.trancheCA || undefined,
          adresse: record.adresse || undefined,
        });
      }
    }

    let results = Array.from(merged.values());
    const sortBy = filters.sortBy || 'name';

    results.sort((a, b) => {
      if (sortBy === 'name' || !sortBy) {
        const aHasFinancial = a.caHistory && a.caHistory.length > 0;
        const bHasFinancial = b.caHistory && b.caHistory.length > 0;
        if (aHasFinancial && !bHasFinancial) return -1;
        if (!aHasFinancial && bHasFinancial) return 1;
        return a.name.localeCompare(b.name, 'fr');
      }

      switch (sortBy) {
        case 'ca_desc':
          return ((b.revenue ?? 0) - (a.revenue ?? 0));
        case 'ca_asc':
          return ((a.revenue ?? 0) - (b.revenue ?? 0));
        case 'date_desc': {
          const dateA = a.dateImmatriculation || '';
          const dateB = b.dateImmatriculation || '';
          return dateB.localeCompare(dateA);
        }
        case 'date_asc': {
          const dateA = a.dateImmatriculation || '';
          const dateB = b.dateImmatriculation || '';
          return dateA.localeCompare(dateB);
        }
        case 'effectif_desc':
          return ((b.employeeCount ?? 0) - (a.employeeCount ?? 0));
        default:
          return a.name.localeCompare(b.name, 'fr');
      }
    });

    return NextResponse.json({
      results,
      total: results.length,
      apiGouvCount: apiGouvData.length,
      infogreffeCount: infoGreffeData.length,
      page: filters.page || 1,
      limit: filters.limit || 20,
    });
  } catch (error) {
    console.error('Combined search error:', error);
    return safeErrorResponse('Échec de la recherche', 500);
  }
}
