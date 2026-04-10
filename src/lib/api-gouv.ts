import type { CompanySearchResult, SearchFilters } from './types';
import { EXTERNAL_URLS, TIMEOUTS } from '@/constants';
import { createLogger } from './logger';

const logger = createLogger('ApiGouv');

/**
 * Map le statut interne vers la valeur API Gouv etat_administratif.
 * API Gouv: "A" = Active, "C" = Cessée
 */
function mapStatutToEtatAdministratif(statut: string): string | null {
  switch (statut) {
    case 'active': return 'A';
    case 'cessee':
    case 'radiee': return 'C';
    default: return null;
  }
}

export async function searchApiGouv(filters: SearchFilters): Promise<CompanySearchResult[]> {
  const params: Record<string, string> = {
    per_page: filters.limit ? String(Math.min(filters.limit, 25)) : '25',
    page: String(filters.page || 1),
  };

  // Texte libre => paramètre q
  if (filters.query) {
    params.q = filters.query;
  }

  // ─── Filtres de localisation (paramètres dédiés) ──────────────
  if (filters.departement) {
    params.departement = filters.departement;
  }
  if (filters.codePostal) {
    params.code_postal = filters.codePostal;
  }
  if (filters.commune) {
    params.code_commune = filters.commune;
  }
  if (filters.region) {
    params.region = filters.region;
  }

  // ─── Filtres secteur / activité ───────────────────────────────
  if (filters.sectionNaf) {
    params.section_activite_principale = filters.sectionNaf;
  }
  if (filters.codeNaf) {
    params.activite_principale = filters.codeNaf;
  }

  // ─── Filtres juridiques ───────────────────────────────────────
  if (filters.natureJuridique) {
    params.nature_juridique = filters.natureJuridique;
  }
  if (filters.categorieEntreprise) {
    params.categorie_entreprise = filters.categorieEntreprise;
  }

  // ─── Statut (état administratif) ──────────────────────────────
  if (filters.statutEntreprise) {
    const etat = mapStatutToEtatAdministratif(filters.statutEntreprise);
    if (etat) {
      params.etat_administratif = etat;
    }
  }

  // ─── Effectifs ────────────────────────────────────────────────
  if (filters.effectifMin != null || filters.effectifMax != null) {
    // L'API utilise la nomenclature INSEE des tranches d'effectif salarié
    // On mappe la plage min/max vers la tranche la plus appropriée
    const tranche = mapEffectifToTranche(filters.effectifMin, filters.effectifMax);
    if (tranche) {
      params.tranche_effectif_salarie = tranche;
    }
  }

  // ─── Exclusions ───────────────────────────────────────────────
  if (filters.excludeAssociations) {
    params.est_association = 'false';
  }
  if (filters.excludeAutoEntrepreneurs) {
    params.est_entrepreneur_individuel = 'false';
  }

  // ─── Filtres financiers (CA min/max) ──────────────────────────
  if (filters.caMin != null) {
    params.ca_min = String(filters.caMin);
  }
  if (filters.caMax != null) {
    params.ca_max = String(filters.caMax);
  }

  // Vérifier qu'on a au moins un paramètre de recherche
  const hasFilters = Object.keys(params).some(k => !['per_page', 'page'].includes(k));
  if (!hasFilters) {
    return [];
  }

  const url = new URL(EXTERNAL_URLS.API_GOUV_SEARCH);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(TIMEOUTS.API_GOUV_MS),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      logger.error('Search failed', { status: response.status, errorText });
      return [];
    }

    const text = await response.text();
    if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
      logger.error('API returned HTML instead of JSON');
      return [];
    }
    const data = JSON.parse(text) as { results?: CompanySearchResult[] };
    return data.results || [];
  } catch (error) {
    logger.error('Search request failed', error);
    return [];
  }
}

/**
 * Convertit une plage d'effectifs en code tranche INSEE.
 * Codes INSEE : 00=0, 01=1-2, 02=3-5, 03=6-9, 11=10-19, 12=20-49,
 * 21=50-99, 22=100-199, 31=200-249, 32=250-499, 41=500-999,
 * 42=1000-1999, 51=2000-4999, 52=5000-9999, 53=10000+
 */
function mapEffectifToTranche(min?: number, max?: number): string | null {
  if (min == null && max == null) return null;

  const effectiveMin = min ?? 0;
  const effectiveMax = max ?? Infinity;

  // Find the best matching tranche range
  const tranches = [
    { code: '00', min: 0, max: 0 },
    { code: '01', min: 1, max: 2 },
    { code: '02', min: 3, max: 5 },
    { code: '03', min: 6, max: 9 },
    { code: '11', min: 10, max: 19 },
    { code: '12', min: 20, max: 49 },
    { code: '21', min: 50, max: 99 },
    { code: '22', min: 100, max: 199 },
    { code: '31', min: 200, max: 249 },
    { code: '32', min: 250, max: 499 },
    { code: '41', min: 500, max: 999 },
    { code: '42', min: 1000, max: 1999 },
    { code: '51', min: 2000, max: 4999 },
    { code: '52', min: 5000, max: 9999 },
    { code: '53', min: 10000, max: Infinity },
  ];

  // Return all tranches that overlap with the requested range
  const matching = tranches.filter(t => t.max >= effectiveMin && t.min <= effectiveMax);
  if (matching.length === 0) return null;
  // API accepts comma-separated tranche codes
  return matching.map(t => t.code).join(',');
}

