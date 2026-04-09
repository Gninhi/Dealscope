// ─── TypeScript Interfaces ─────────────────────────────────────────
// Pure type definitions. Constants live in @/constants/*.

export interface CompanySearchResult {
  siren: string;
  nom_raison_sociale: string;
  sigle?: string;
  nom_complet?: string;
  nombre_etablissements_ouverts?: number;
  nombre_etablissements?: number;
  // Champs au niveau racine (structure réelle API Gouv)
  activite_principale?: string;
  section_activite_principale?: string;
  categorie_entreprise?: string;
  nature_juridique?: string;
  etat_administratif?: string;
  tranche_effectif_salarie?: string;
  date_creation?: string;
  date_fermeture?: string;
  // Données financières (API Gouv v2)
  finances?: Record<string, { ca?: number; resultat_net?: number }> | null;
  // Siège social — la localisation est imbriquée ici
  siege?: {
    siret?: string;
    code_postal?: string;
    libelle_commune?: string;
    departement?: string;
    region?: string;
    geo_adresse?: string;
    adresse?: string;
    commune?: string;
    latitude?: number;
    longitude?: number;
    activite_principale?: string;
    tranche_effectif_salarie?: string;
  };
  dirigeants?: Array<{
    nom: string;
    prenom: string;
    fonction?: string;
    date_naissance?: string;
  }>;
  matching_etablissements?: Array<{
    siret: string;
    enseigne?: string;
    geo_adresse?: string;
    code_postal?: string;
    libelle_commune?: string;
  }>;
  // Champs legacy conservés pour compatibilité arrière
  ca?: number | null;
  resultat_net?: number | null;
}

export interface InfoGreffeRecord {
  siren: string;
  denomination: string;
  forme_juridique: string;
  code_ape: string;
  libelle_ape?: string;
  adresse?: string;
  code_postal?: string;
  ville: string;
  num_dept?: string;
  departement: string;
  region: string;
  code_greffe?: number;
  greffe?: string;
  date_immatriculation?: string;
  date_radiation?: string;
  statut?: string;
  geolocalisation?: string;
  date_de_publication?: string;
  nic?: string;
  ca_1?: number | null;
  ca_2?: number | null;
  ca_3?: number | null;
  resultat_1?: number | null;
  resultat_2?: number | null;
  resultat_3?: number | null;
  effectif_1?: number | null;
  effectif_2?: number | null;
  effectif_3?: number | null;
  millesime_1?: string | null;
  millesime_2?: string | null;
  millesime_3?: string | null;
  date_de_cloture_exercice_1?: string;
  date_de_cloture_exercice_2?: string;
  date_de_cloture_exercice_3?: string;
  duree_1?: number;
  duree_2?: number;
  duree_3?: number;
  tranche_ca_millesime_1?: string;
  tranche_ca_millesime_2?: string;
  tranche_ca_millesime_3?: string;
  id?: string;
}

export interface CombinedSearchResult {
  siren: string;
  name: string;
  sector: string;
  nafCode: string;
  nafLabel?: string;
  location: string;
  postalCode: string;
  city: string;
  department?: string;
  region?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  employeeCount?: number;
  categorieEntreprise?: string;
  natureJuridique?: string;
  revenue?: number | null;
  directors?: Array<{ nom: string; prenom: string; fonction?: string }>;
  caHistory?: Array<{ year: string; ca: number | null; resultat: number | null; effectif: number | null; dateCloture?: string }>;
  source: string;
  dateImmatriculation?: string;
  statut?: string;
  greffe?: string;
  dateClotureExercice?: string;
  trancheCA?: string;
  adresse?: string;
}

export interface CompanyWithRelations {
  id: string;
  workspaceId: string;
  icpProfileId: string | null;
  siren: string;
  name: string;
  legalName: string;
  sector: string;
  sizeRange: string;
  revenue: number | null;
  address: string;
  city: string;
  postalCode: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
  nafCode: string;
  employeeCount: number | null;
  icpScore: number | null;
  status: string;
  notes: string;
  source: string;
  natureJuridique: string;
  categorieEntreprise: string;
  nafLabel: string;
  dateImmatriculation: string;
  statutEntreprise: string;
  greffe: string;
  trancheCA: string;
  dateClotureExercice: string;
  adresseComplete: string;
  enrichedData: string;
  isEnriched: boolean;
  createdAt: string;
  updatedAt: string;
  signals: CompanySignal[];
  contacts: Contact[];
  pipelineStages: PipelineStage[];
  icpProfile?: { id: string; name: string } | null;
}

export interface CompanySignal {
  id: string;
  companyId: string;
  type: string;
  title: string;
  description: string;
  source: string;
  detectedAt: string;
  confidence: number | null;
}

export interface Contact {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  seniority: string;
  emailVerified: boolean;
}

export interface PipelineStage {
  id: string;
  companyId: string;
  stage: string;
  assignedTo: string;
  notes: string;
  movedAt: string;
}

export interface ICPProfileData {
  id: string;
  workspaceId: string;
  name: string;
  criteria: string;
  weights: string;
  isActive: boolean;
  createdAt: string;
}

export interface SearchFilters {
  query: string;
  departement?: string;
  codePostal?: string;
  commune?: string;
  region?: string;
  sectionNaf?: string;
  codeNaf?: string;
  natureJuridique?: string;
  categorieEntreprise?: string;
  effectifMin?: number;
  effectifMax?: number;
  excludeAssociations: boolean;
  excludeAutoEntrepreneurs: boolean;
  trancheCA?: string;
  statutEntreprise?: string;
  dateImmatBefore?: string;
  dateImmatAfter?: string;
  caMin?: number;
  caMax?: number;
  sortBy?: string;
  source?: string;
  page?: number;
  limit?: number;
}

export interface DashboardStats {
  totalCompanies: number;
  pipelineByStage: Record<string, number>;
  topSectors: Array<{ sector: string; count: number }>;
  companiesBySource: Array<{ source: string; count: number }>;
  avgIcpScore: number;
  recentCompanies: CompanyWithRelations[];
  totalSignals: number;
  totalContacts: number;
}
