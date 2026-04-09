import { NextRequest, NextResponse } from 'next/server';
import { searchApiGouv } from '@/lib/api-gouv';
import { searchInfoGreffe } from '@/lib/infogreffe';
import { parseInfoGreffeFinancial } from '@/lib/infogreffe';
import { requireAuth } from '@/lib/api-guard';
import { isRateLimited, getClientIp, rateLimitedResponse, safeErrorResponse } from '@/lib/security';
import { parseSearchFilters, hasSearchParams } from '@/lib/services/company.service';
import type { CombinedSearchResult, InfoGreffeRecord } from '@/lib/types';
import { getEffectifFromTranche, getRegionName } from '@/lib/utils';

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
    const filters = parseSearchFilters(new URL(request.url).searchParams, true);

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

    const gouvMapped: CombinedSearchResult[] = apiGouvData.map((r: any) => {
      const siege = r.siege || {};
      // Extraire le CA le plus récent depuis l'objet finances si disponible
      let latestCa: number | undefined = undefined;
      let gouvCaHistory: any[] | undefined = undefined;
      let caTrend: number | undefined = undefined;
      if (r.finances && typeof r.finances === 'object') {
        const years = Object.keys(r.finances).sort().reverse();
        if (years.length > 0) {
          gouvCaHistory = years.map(year => ({
            year,
            ca: r.finances[year]?.ca ?? null,
            resultat: r.finances[year]?.resultat_net ?? null,
            effectif: r.finances[year]?.effectif ?? null,
            dateCloture: undefined
          }));
          latestCa = gouvCaHistory[0]?.ca ?? undefined;
        }
      }

      const employeeCountFromTranche = getEffectifFromTranche(r.tranche_effectif_salarie);

      return {
        siren: r.siren,
        name: r.nom_raison_sociale || r.nom_complet || '',
        sector: r.section_activite_principale || '',
        nafCode: r.activite_principale || siege.activite_principale || '',
        nafLabel: '',
        location: `${siege.libelle_commune || ''} ${siege.code_postal || ''}`.trim(),
        postalCode: siege.code_postal || '',
        city: siege.libelle_commune || '',
        department: siege.departement || undefined,
        region: siege.region ? getRegionName(siege.region) : undefined,
        address: siege.geo_adresse || siege.adresse || undefined,
        latitude: siege.latitude ? Number(siege.latitude) : undefined,
        longitude: siege.longitude ? Number(siege.longitude) : undefined,
        employeeCount: employeeCountFromTranche ?? undefined,
        categorieEntreprise: r.categorie_entreprise || undefined,
        natureJuridique: r.nature_juridique || undefined,
        revenue: latestCa ?? r.ca ?? undefined,
        caHistory: gouvCaHistory,
        statut: r.etat_administratif === 'A' ? 'Active' : r.etat_administratif === 'C' ? 'Cessée' : undefined,
        dateImmatriculation: r.date_creation || undefined,
        directors: r.dirigeants?.map((d: any) => ({
          nom: d.nom,
          prenom: d.prenoms || d.prenom,
          fonction: d.qualite || d.type_dirigeant || d.fonction,
        })).sort((a: any, b: any) => {
           const aRoles = (a.fonction || '').toLowerCase();
           const bRoles = (b.fonction || '').toLowerCase();
           const aIsLeader = aRoles.includes('président') || aRoles.includes('president') || aRoles.includes('directeur');
           const bIsLeader = bRoles.includes('président') || bRoles.includes('president') || bRoles.includes('directeur');
           if (aIsLeader && !bIsLeader) return -1;
           if (!aIsLeader && bIsLeader) return 1;
           return 0;
        }) || [],
        source: 'api-gouv',
      };
    });

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
        if (financial) {
           result.caHistory = (financial.caHistory && financial.caHistory.length > 0) 
             ? financial.caHistory 
             : result.caHistory;
           
           if (result.revenue == null && financial.latestCa != null) {
             result.revenue = financial.latestCa;
           }
           result.dateClotureExercice = financial.latestDateCloture || undefined;
           result.trancheCA = financial.trancheCA || undefined;
        }

        if (!result.nafLabel && financialRecord.libelle_ape) {
          result.nafLabel = financialRecord.libelle_ape;
        }
        result.dateImmatriculation = financialRecord.date_immatriculation || undefined;
        result.statut = financialRecord.statut || undefined;
        result.greffe = financialRecord.greffe || undefined;
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
