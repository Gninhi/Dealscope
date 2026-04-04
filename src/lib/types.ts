// Pipeline stages definition
export const PIPELINE_STAGES = [
  { key: 'identifiees', label: 'Identifiées', color: '#6B7280', icon: 'Search' },
  { key: 'a_contacter', label: 'A contacter', color: '#3B82F6', icon: 'Phone' },
  { key: 'contactees', label: 'Contactées', color: '#F59E0B', icon: 'Mail' },
  { key: 'qualifiees', label: 'Qualifiées', color: '#10B981', icon: 'CheckCircle' },
  { key: 'opportunite', label: 'Opportunité', color: '#8B5CF6', icon: 'Star' },
  { key: 'deal', label: 'Deal', color: '#EC4899', icon: 'Trophy' },
  { key: 'annule', label: 'Annulé', color: '#EF4444', icon: 'XCircle' },
] as const;

export type PipelineStageKey = (typeof PIPELINE_STAGES)[number]['key'];

// French regions
export const REGIONS = [
  'Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Bretagne',
  'Centre-Val de Loire', 'Corse', 'Grand Est', 'Hauts-de-France',
  'Île-de-France', 'Normandie', 'Nouvelle-Aquitaine', 'Occitanie',
  'Pays de la Loire', "Provence-Alpes-Côte d'Azur",
  'Guadeloupe', 'Guyane', 'Martinique', 'La Réunion', 'Mayotte',
] as const;

// NAF Sections
export const NAF_SECTIONS = [
  { code: 'A', label: 'Agriculture, sylviculture et pêche' },
  { code: 'B', label: 'Industries extractives' },
  { code: 'C', label: 'Industrie manufacturière' },
  { code: 'D', label: 'Production et distribution électricité, gaz, vapeur, air conditionné' },
  { code: 'E', label: 'Production, distribution eau, assainissement, gestion déchets' },
  { code: 'F', label: 'Construction' },
  { code: 'G', label: 'Commerce, réparation automobiles et motocycles' },
  { code: 'H', label: 'Transports et entreposage' },
  { code: 'I', label: 'Hébergement et restauration' },
  { code: 'J', label: 'Information et communication' },
  { code: 'K', label: 'Activités financières et assurance' },
  { code: 'L', label: 'Activités immobilières' },
  { code: 'M', label: 'Activités spécialisées, scientifiques et techniques' },
  { code: 'N', label: 'Activités de services administratifs et de soutien' },
  { code: 'O', label: 'Administration publique' },
  { code: 'P', label: 'Enseignement' },
  { code: 'Q', label: 'Santé humaine et action sociale' },
  { code: 'R', label: 'Arts, spectacles et activités récréatives' },
  { code: 'S', label: 'Autres activités de services' },
  { code: 'T', label: 'Activités des ménages en tant qu\'employeurs' },
  { code: 'U', label: 'Activités extra-territoriales' },
] as const;

// Enterprise categories
export const CATEGORIES_ENTREPRISE = [
  { value: 'TPE', label: 'TPE (0-19 salariés)' },
  { value: 'PME', label: 'PME (20-249 salariés)' },
  { value: 'ETI', label: 'ETI (250-4999 salariés)' },
  { value: 'GE', label: 'GE (5000+ salariés)' },
] as const;

// Legal forms
export const FORMES_JURIDIQUES = [
  'SAS', 'SA', 'SARL', 'SNC', 'EURL', 'SASU', 'Auto-entrepreneur',
  'Association', 'Société civile', 'Coopérative', 'GIE', 'SEP',
  'SOCIÉTÉ ANONYME', 'SOCIÉTÉ PAR ACTIONS SIMPLIFIÉE',
  'SOCIÉTÉ À RESPONSABILITÉ LIMITÉE',
  'ENTREPRISE INDIVIDUELLE',
] as const;

// Company status
export const COMPANY_STATUSES = [
  { value: 'identifiees', label: 'Identifiées' },
  { value: 'a_contacter', label: 'A contacter' },
  { value: 'contactees', label: 'Contactées' },
  { value: 'qualifiees', label: 'Qualifiées' },
  { value: 'opportunite', label: 'Opportunité' },
  { value: 'deal', label: 'Deal' },
  { value: 'annule', label: 'Annulé' },
] as const;

// Tranches de CA pour filtre avancé
export const TRANCHES_CA = [
  { value: '<100K', label: '< 100 k€' },
  { value: '100K-500K', label: '100 k€ - 500 k€' },
  { value: '500K-1M', label: '500 k€ - 1 M€' },
  { value: '1M-5M', label: '1 M€ - 5 M€' },
  { value: '5M-10M', label: '5 M€ - 10 M€' },
  { value: '10M-50M', label: '10 M€ - 50 M€' },
  { value: '>50M', label: '> 50 M€' },
] as const;

// Statuts d'entreprise InfoGreffe
export const STATUTS_ENTREPRISE = [
  { value: 'active', label: 'Active' },
  { value: 'cessee', label: 'Cessée' },
  { value: 'radiee', label: 'Radiée' },
] as const;

// Options de tri
export const SORT_OPTIONS = [
  { value: 'name', label: 'Nom (A-Z)' },
  { value: 'ca_desc', label: 'CA décroissant' },
  { value: 'ca_asc', label: 'CA croissant' },
  { value: 'date_desc', label: 'Date immatriculation récente' },
  { value: 'date_asc', label: 'Date immatriculation ancienne' },
  { value: 'effectif_desc', label: 'Effectifs décroissant' },
] as const;

// TypeScript interfaces
export interface CompanySearchResult {
  siren: string;
  nom_raison_sociale: string;
  sigle?: string;
  nom_complet?: string;
  nombre_etablissements_ouvert?: number;
  nombre_etablissements?: number;
  section_activites_principales?: string;
  categorie_entreprise?: string;
  nature_juridique?: string;
  naf?: string;
  libelle_naf?: string;
  code_postal?: string;
  libelle_commune?: string;
  departement?: string;
  region?: string;
  geo_adresse?: string;
  coordonnees?: { lat: string; lon: string };
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
  // Données financières API Gouv
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
  // Données financières InfoGreffe
  caHistory?: Array<{ year: string; ca: number | null; resultat: number | null; effectif: number | null; dateCloture?: string }>;
  source: string;
  // Nouveaux champs enrichis
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
  // Champs enrichis
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

export interface DashboardStats {
  totalCompanies: number;
  pipelineByStage: Record<string, number>;
  recentCompanies: CompanyWithRelations[];
  topSectors: { sector: string; count: number }[];
  avgIcpScore: number;
  companiesBySource: { source: string; count: number }[];
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
  // Nouveaux filtres
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
