import { create } from 'zustand';
import type { CompanyWithRelations, ICPProfileData, SearchFilters, CombinedSearchResult } from '@/lib/types';

interface DealScopeState {
  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Companies
  companies: CompanyWithRelations[];
  setCompanies: (companies: CompanyWithRelations[]) => void;
  searchResults: CombinedSearchResult[];
  setSearchResults: (results: CombinedSearchResult[]) => void;
  isSearching: boolean;
  setIsSearching: (searching: boolean) => void;

  // Filtres de recherche
  searchFilters: SearchFilters;
  setSearchFilters: (filters: SearchFilters) => void;
  resetSearchFilters: () => void;

  // Profils ICP
  icpProfiles: ICPProfileData[];
  setIcpProfiles: (profiles: ICPProfileData[]) => void;

  // Dialogue profil entreprise
  selectedCompanyId: string | null;
  openCompanyProfile: (companyId: string) => void;
  closeCompanyProfile: () => void;

  // Scan IA
  isScanning: boolean;
  setIsScanning: (scanning: boolean) => void;
  scanProgress: { total: number; processed: number };
  setScanProgress: (progress: { total: number; processed: number }) => void;
}

const defaultFilters: SearchFilters = {
  query: '',
  excludeAssociations: false,
  excludeAutoEntrepreneurs: false,
  sortBy: 'name',
  source: 'all',
  page: 1,
  limit: 20,
};

export const useDealScopeStore = create<DealScopeState>((set) => ({
  // Navigation
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // Companies
  companies: [],
  setCompanies: (companies) => set({ companies }),
  searchResults: [],
  setSearchResults: (results) => set({ searchResults: results }),
  isSearching: false,
  setIsSearching: (searching) => set({ isSearching: searching }),

  // Filtres de recherche
  searchFilters: defaultFilters,
  setSearchFilters: (filters) => set({ searchFilters: filters }),
  resetSearchFilters: () => set({ searchFilters: defaultFilters }),

  // Profils ICP
  icpProfiles: [],
  setIcpProfiles: (profiles) => set({ icpProfiles: profiles }),

  // Dialogue profil entreprise
  selectedCompanyId: null,
  openCompanyProfile: (companyId) => set({ selectedCompanyId: companyId }),
  closeCompanyProfile: () => set({ selectedCompanyId: null }),

  // Scan IA
  isScanning: false,
  setIsScanning: (scanning) => set({ isScanning: scanning }),
  scanProgress: { total: 0, processed: 0 },
  setScanProgress: (progress) => set({ scanProgress: progress }),
}));
