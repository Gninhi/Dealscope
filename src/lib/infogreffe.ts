import type { InfoGreffeRecord, SearchFilters } from './types';

const INFOGREFFE_BASE = 'https://opendata.datainfogreffe.fr/api/explore/v2.1/catalog/datasets/chiffres-cles-2024/records';

/**
 * Convertit une tranche CA en conditions SQL pour l'API InfoGreffe.
 * L'API expose les champs ca_1, ca_2, ca_3 directement.
 */
function trancheCAToCondition(tranche: string): string {
  switch (tranche) {
    case '<100K':
      return 'ca_1 < 100000';
    case '100K-500K':
      return 'ca_1 >= 100000 AND ca_1 < 500000';
    case '500K-1M':
      return 'ca_1 >= 500000 AND ca_1 < 1000000';
    case '1M-5M':
      return 'ca_1 >= 1000000 AND ca_1 < 5000000';
    case '5M-10M':
      return 'ca_1 >= 5000000 AND ca_1 < 10000000';
    case '10M-50M':
      return 'ca_1 >= 10000000 AND ca_1 < 50000000';
    case '>50M':
      return 'ca_1 >= 50000000';
    default:
      return '';
  }
}

/**
 * Convertit le statut filtre en valeur attendue par l'API InfoGreffe.
 * L'API utilise les valeurs : "Active", "Cessée", "Radiée"
 */
function mapStatutFilter(statut: string): string {
  switch (statut) {
    case 'active': return 'Active';
    case 'cessee': return 'Cessée';
    case 'radiee': return 'Radiée';
    default: return '';
  }
}

/**
 * Recherche d'entreprises via l'API InfoGreffe OpenData avec tous les filtres supportés.
 */
function escapeSqlInput(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''")
    .replace(/;/g, '')
    .trim();
}

export async function searchInfoGreffe(filters: SearchFilters): Promise<InfoGreffeRecord[]> {
  const params: Record<string, string> = {
    limit: filters.limit ? String(filters.limit) : '20',
    offset: String(((filters.page || 1) - 1) * (filters.limit || 20)),
    timezone: 'Europe/Paris',
  };

  // Construction de la clause WHERE
  const conditions: string[] = [];

  // Recherche textuelle
  if (filters.query) {
    conditions.push(`denomination ILIKE "%${escapeSqlInput(filters.query)}%"`);
  }

  // Filtres de localisation
  if (filters.codePostal) {
    conditions.push(`code_postal LIKE "${filters.codePostal}%"`);
  }
  if (filters.departement) {
    conditions.push(`departement="${filters.departement}"`);
  }
  if (filters.region) {
    conditions.push(`region="${filters.region}"`);
  }
  if (filters.commune) {
    conditions.push(`ville ILIKE "%${escapeSqlInput(filters.commune)}%"`);
  }

  // Filtres secteur / juridique
  if (filters.codeNaf) {
    conditions.push(`code_ape LIKE "${filters.codeNaf}%"`);
  }
  if (filters.natureJuridique) {
    conditions.push(`forme_juridique ILIKE "%${escapeSqlInput(filters.natureJuridique)}%"`);
  }

  // NOUVEAU: Filtre par statut
  if (filters.statutEntreprise) {
    const statutValue = mapStatutFilter(filters.statutEntreprise);
    if (statutValue) {
      conditions.push(`statut="${statutValue}"`);
    }
  }

  // NOUVEAU: Filtre par tranche de CA
  if (filters.trancheCA) {
    const trancheCondition = trancheCAToCondition(filters.trancheCA);
    if (trancheCondition) {
      conditions.push(trancheCondition);
    }
  }

  // NOUVEAU: Filtre par date d'immatriculation
  if (filters.dateImmatBefore) {
    conditions.push(`date_immatriculation < "${filters.dateImmatBefore}"`);
  }
  if (filters.dateImmatAfter) {
    conditions.push(`date_immatriculation > "${filters.dateImmatAfter}"`);
  }

  // NOUVEAU: Filtre par CA min/max
  if (filters.caMin != null) {
    conditions.push(`ca_1 >= ${filters.caMin}`);
  }
  if (filters.caMax != null) {
    conditions.push(`ca_1 <= ${filters.caMax}`);
  }

  if (conditions.length > 0) {
    params.where = conditions.join(' AND ');
  }

  // NOUVEAU: Tri
  if (filters.sortBy) {
    switch (filters.sortBy) {
      case 'name':
        params.order_by = 'denomination';
        break;
      case 'ca_desc':
        params.order_by = 'ca_1 DESC';
        break;
      case 'ca_asc':
        params.order_by = 'ca_1 ASC';
        break;
      case 'date_desc':
        params.order_by = 'date_immatriculation DESC';
        break;
      case 'date_asc':
        params.order_by = 'date_immatriculation ASC';
        break;
      case 'effectif_desc':
        params.order_by = 'effectif_1 DESC';
        break;
    }
  }

  const url = new URL(INFOGREFFE_BASE);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error('InfoGreffe search error:', response.status);
      return [];
    }

    const text = await response.text();
    if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
      console.error('API returned HTML instead of JSON');
      return [];
    }
    const data = JSON.parse(text);
    return data.results || [];
  } catch (error) {
    console.error('InfoGreffe search error:', error);
    return [];
  }
}

/**
 * Récupération d'une entreprise InfoGreffe par SIREN.
 */
export async function getInfoGreffeBySiren(siren: string): Promise<InfoGreffeRecord | null> {
  try {
    const response = await fetch(
      `${INFOGREFFE_BASE}?where=siren%3D"${siren}"&limit=1`,
      {
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      console.error('InfoGreffe SIREN lookup error:', response.status);
      return null;
    }

    const text2 = await response.text();
    if (text2.startsWith('<!DOCTYPE') || text2.startsWith('<html')) {
      console.error('API returned HTML instead of JSON');
      return null;
    }
    const data = JSON.parse(text2);
    if (data.results && data.results.length > 0) {
      return data.results[0];
    }
    return null;
  } catch (error) {
    console.error('InfoGreffe SIREN lookup error:', error);
    return null;
  }
}

/**
 * Parse les données financières InfoGreffe en historique structuré.
 * Inclut désormais les dates de clôture d'exercice.
 */
export function parseInfoGreffeFinancial(record: InfoGreffeRecord) {
  if (!record) return null;

  return {
    caHistory: [
      {
        year: record.millesime_1 || '',
        ca: record.ca_1 ?? null,
        resultat: record.resultat_1 ?? null,
        effectif: record.effectif_1 ?? null,
        dateCloture: record.date_de_cloture_exercice_1 || undefined,
      },
      {
        year: record.millesime_2 || '',
        ca: record.ca_2 ?? null,
        resultat: record.resultat_2 ?? null,
        effectif: record.effectif_2 ?? null,
        dateCloture: record.date_de_cloture_exercice_2 || undefined,
      },
      {
        year: record.millesime_3 || '',
        ca: record.ca_3 ?? null,
        resultat: record.resultat_3 ?? null,
        effectif: record.effectif_3 ?? null,
        dateCloture: record.date_de_cloture_exercice_3 || undefined,
      },
    ].filter(h => h.year),
    latestCa: record.ca_1 ?? null,
    latestResultat: record.resultat_1 ?? null,
    latestEffectif: record.effectif_1 ?? null,
    latestDateCloture: record.date_de_cloture_exercice_1 || undefined,
    trancheCA: record.tranche_ca_millesime_1 || undefined,
  };
}
