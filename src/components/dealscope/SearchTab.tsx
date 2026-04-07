'use client';

import { useState, useCallback } from 'react';
import {
  Search, SlidersHorizontal, X, MapPin, Building2, Users, Filter,
  ChevronDown, ChevronUp, ExternalLink, Plus, Loader2, Building,
  Briefcase, TrendingUp, ChevronLeft, ChevronRight,
  DollarSign, CalendarDays, ArrowUpDown, Landmark, Check
} from 'lucide-react';
import { useDealScopeStore } from '@/store/use-deal-scope-store';
import { formatCurrency, formatNumber, formatDate, getStageLabel, getStageColor, getStatutBadgeClass, getStatutLabel } from '@/lib/utils';
import {
  REGIONS, NAF_SECTIONS, CATEGORIES_ENTREPRISE, FORMES_JURIDIQUES,
  TRANCHES_CA, STATUTS_ENTREPRISE, SORT_OPTIONS
} from '@/constants';
import type { CombinedSearchResult } from '@/lib/types';
import CompanyProfileDialog from './CompanyProfileDialog';

export default function SearchTab() {
  const {
    searchFilters, setSearchFilters, resetSearchFilters,
    searchResults, setSearchResults,
    isSearching, setIsSearching,
    companies,
  } = useDealScopeStore();

  const [showFilters, setShowFilters] = useState(false);
  const [activeFilterPills, setActiveFilterPills] = useState<string[]>([]);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [profileSiren, setProfileSiren] = useState<string | null>(null);
  const [profileSearchResult, setProfileSearchResult] = useState<CombinedSearchResult | null>(null);
  const [expandedDirectors, setExpandedDirectors] = useState<Set<string>>(new Set());
  const [addingToPipeline, setAddingToPipeline] = useState<Set<string>>(new Set());

  const handleSearch = useCallback(async (page?: number) => {
    if (!searchFilters.query && !searchFilters.departement && !searchFilters.region &&
        !searchFilters.codePostal && !searchFilters.commune && !searchFilters.sectionNaf &&
        !searchFilters.categorieEntreprise && !searchFilters.statutEntreprise &&
        !searchFilters.trancheCA && !searchFilters.dateImmatBefore && !searchFilters.dateImmatAfter) return;

    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      if (searchFilters.query) params.set('q', searchFilters.query);
      if (searchFilters.departement) params.set('departement', searchFilters.departement);
      if (searchFilters.codePostal) params.set('codePostal', searchFilters.codePostal);
      if (searchFilters.commune) params.set('commune', searchFilters.commune);
      if (searchFilters.region) params.set('region', searchFilters.region);
      if (searchFilters.sectionNaf) params.set('sectionNaf', searchFilters.sectionNaf);
      if (searchFilters.codeNaf) params.set('codeNaf', searchFilters.codeNaf);
      if (searchFilters.natureJuridique) params.set('natureJuridique', searchFilters.natureJuridique);
      if (searchFilters.categorieEntreprise) params.set('categorieEntreprise', searchFilters.categorieEntreprise);
      if (searchFilters.effectifMin) params.set('effectifMin', String(searchFilters.effectifMin));
      if (searchFilters.effectifMax) params.set('effectifMax', String(searchFilters.effectifMax));
      if (searchFilters.excludeAssociations) params.set('excludeAssociations', 'true');
      if (searchFilters.excludeAutoEntrepreneurs) params.set('excludeAutoEntrepreneurs', 'true');
      // Nouveaux paramètres
      if (searchFilters.trancheCA) params.set('trancheCA', searchFilters.trancheCA);
      if (searchFilters.statutEntreprise) params.set('statutEntreprise', searchFilters.statutEntreprise);
      if (searchFilters.dateImmatBefore) params.set('dateImmatBefore', searchFilters.dateImmatBefore);
      if (searchFilters.dateImmatAfter) params.set('dateImmatAfter', searchFilters.dateImmatAfter);
      if (searchFilters.caMin != null) params.set('caMin', String(searchFilters.caMin));
      if (searchFilters.caMax != null) params.set('caMax', String(searchFilters.caMax));
      if (searchFilters.sortBy && searchFilters.sortBy !== 'name') params.set('sortBy', searchFilters.sortBy);
      if (searchFilters.source && searchFilters.source !== 'all') params.set('source', searchFilters.source);

      const currentPage = page || searchFilters.page || 1;
      params.set('page', String(currentPage));
      params.set('limit', String(searchFilters.limit || 20));

      const res = await fetch(`/api/companies/combined-search?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSearchResults(data.results || []);

      // Mise à jour des pills de filtres actifs
      const pills: string[] = [];
      if (searchFilters.departement) pills.push(`Dép: ${searchFilters.departement}`);
      if (searchFilters.codePostal) pills.push(`CP: ${searchFilters.codePostal}`);
      if (searchFilters.commune) pills.push(`Commune: ${searchFilters.commune}`);
      if (searchFilters.region) pills.push(`Région: ${searchFilters.region}`);
      if (searchFilters.sectionNaf) pills.push(`NAF: ${searchFilters.sectionNaf}`);
      if (searchFilters.categorieEntreprise) pills.push(`Cat: ${searchFilters.categorieEntreprise}`);
      if (searchFilters.trancheCA) {
        const trancheLabel = TRANCHES_CA.find(t => t.value === searchFilters.trancheCA)?.label;
        if (trancheLabel) pills.push(`CA: ${trancheLabel}`);
      }
      if (searchFilters.statutEntreprise) {
        const statutLabel = STATUTS_ENTREPRISE.find(s => s.value === searchFilters.statutEntreprise)?.label;
        if (statutLabel) pills.push(`Statut: ${statutLabel}`);
      }
      if (searchFilters.dateImmatAfter) pills.push(`Après: ${formatDate(searchFilters.dateImmatAfter)}`);
      if (searchFilters.dateImmatBefore) pills.push(`Avant: ${formatDate(searchFilters.dateImmatBefore)}`);
      if (searchFilters.caMin != null) pills.push(`CA min: ${formatCurrency(searchFilters.caMin)}`);
      if (searchFilters.caMax != null) pills.push(`CA max: ${formatCurrency(searchFilters.caMax)}`);
      if (searchFilters.source && searchFilters.source !== 'all') {
        const sourceLabel = searchFilters.source === 'api-gouv' ? 'API Gouv' : 'InfoGreffe';
        pills.push(`Source: ${sourceLabel}`);
      }
      if (searchFilters.sortBy && searchFilters.sortBy !== 'name') {
        const sortLabel = SORT_OPTIONS.find(s => s.value === searchFilters.sortBy)?.label;
        if (sortLabel) pills.push(`Tri: ${sortLabel}`);
      }
      if (searchFilters.excludeAssociations) pills.push('Sans associations');
      if (searchFilters.excludeAutoEntrepreneurs) pills.push('Sans auto-entrepreneurs');
      setActiveFilterPills(pills);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchFilters, setIsSearching, setSearchResults]);

  const handleReset = useCallback(() => {
    resetSearchFilters();
    setSearchResults([]);
    setActiveFilterPills([]);
  }, [resetSearchFilters, setSearchResults]);

  const handlePageChange = (newPage: number) => {
    setSearchFilters({ ...searchFilters, page: newPage });
    handleSearch(newPage);
  };

  const handleAddToPipeline = async (result: CombinedSearchResult) => {
    setAddingToPipeline(prev => new Set(prev).add(result.siren));
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siren: result.siren,
          name: result.name,
          sector: result.sector,
          nafCode: result.nafCode,
          nafLabel: result.nafLabel,
          city: result.city,
          postalCode: result.postalCode,
          region: result.region,
          address: result.adresse || result.address,
          natureJuridique: result.natureJuridique,
          categorieEntreprise: result.categorieEntreprise,
          revenue: result.revenue,
          employeeCount: result.employeeCount,
          latitude: result.latitude,
          longitude: result.longitude,
          source: 'search',
          // Données enrichies de la recherche
          dateImmatriculation: result.dateImmatriculation || '',
          statutEntreprise: result.statut || '',
          greffe: result.greffe || '',
          trancheCA: result.trancheCA || '',
          dateClotureExercice: result.dateClotureExercice || '',
          adresseComplete: result.adresse || result.address || '',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const newCompanies = [...companies, data];
        useDealScopeStore.getState().setCompanies(newCompanies);
      }
    } catch (error) {
      console.error('Error adding to pipeline:', error);
    } finally {
      setAddingToPipeline(prev => {
        const next = new Set(prev);
        next.delete(result.siren);
        return next;
      });
    }
  };

  const handleViewProfile = (siren: string) => {
    const result = searchResults.find((r: CombinedSearchResult) => r.siren === siren);
    setProfileSiren(siren);
    setProfileSearchResult(result || null);
    setShowProfileDialog(true);
  };

  const isAlreadyInPipeline = (siren: string) => {
    return companies.some(c => c.siren === siren);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Recherche</h2>
        <p className="text-muted-foreground text-sm">Rechercher des entreprises cibles via API Gouv & InfoGreffe</p>
      </div>

      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
        {/* Barre de saisie */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Rechercher une entreprise, un SIREN, un secteur..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            value={searchFilters.query}
            onChange={(e) => setSearchFilters({ ...searchFilters, query: e.target.value })}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showFilters
                ? 'bg-indigo-500/15 text-indigo-400'
                : 'bg-accent text-muted-foreground hover:text-foreground'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filtres avancés
            {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Filtres avancés */}
        {showFilters && (
          <div className="p-4 border-b border-border bg-background/30 space-y-5">
            {/* Ligne 1 : Localisation / Secteur / Taille */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Localisation */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5" />
                  Localisation
                </div>
                <FilterInput
                  label="Département"
                  value={searchFilters.departement || ''}
                  onChange={(v) => setSearchFilters({ ...searchFilters, departement: v })}
                  placeholder="ex: 75, 69, 13..."
                />
                <FilterInput
                  label="Code Postal"
                  value={searchFilters.codePostal || ''}
                  onChange={(v) => setSearchFilters({ ...searchFilters, codePostal: v })}
                  placeholder="ex: 75001..."
                />
                <FilterInput
                  label="Commune"
                  value={searchFilters.commune || ''}
                  onChange={(v) => setSearchFilters({ ...searchFilters, commune: v })}
                  placeholder="ex: Paris, Lyon..."
                />
                <FilterSelect
                  label="Région"
                  value={searchFilters.region || ''}
                  onChange={(v) => setSearchFilters({ ...searchFilters, region: v })}
                  options={REGIONS.map(r => ({ value: r, label: r }))}
                  placeholder="Sélectionner..."
                />
              </div>

              {/* Secteur */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  <Building2 className="w-3.5 h-3.5" />
                  Secteur
                </div>
                <FilterSelect
                  label="Section NAF"
                  value={searchFilters.sectionNaf || ''}
                  onChange={(v) => setSearchFilters({ ...searchFilters, sectionNaf: v })}
                  options={NAF_SECTIONS.map(s => ({ value: s.code, label: `${s.code} - ${s.label}` }))}
                  placeholder="Sélectionner..."
                />
                <FilterInput
                  label="Code NAF"
                  value={searchFilters.codeNaf || ''}
                  onChange={(v) => setSearchFilters({ ...searchFilters, codeNaf: v })}
                  placeholder="ex: 6201Z..."
                />
                <FilterSelect
                  label="Nature Juridique"
                  value={searchFilters.natureJuridique || ''}
                  onChange={(v) => setSearchFilters({ ...searchFilters, natureJuridique: v })}
                  options={FORMES_JURIDIQUES.map(f => ({ value: f, label: f }))}
                  placeholder="Sélectionner..."
                />
              </div>

              {/* Taille */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  <Users className="w-3.5 h-3.5" />
                  Taille
                </div>
                <FilterSelect
                  label="Catégorie"
                  value={searchFilters.categorieEntreprise || ''}
                  onChange={(v) => setSearchFilters({ ...searchFilters, categorieEntreprise: v })}
                  options={CATEGORIES_ENTREPRISE.map(c => ({ value: c.value, label: c.label }))}
                  placeholder="Sélectionner..."
                />
                <div className="grid grid-cols-2 gap-2">
                  <FilterInput
                    label="Effectif min"
                    value={searchFilters.effectifMin?.toString() || ''}
                    onChange={(v) => setSearchFilters({ ...searchFilters, effectifMin: v ? Number(v) : undefined })}
                    placeholder="Min"
                    type="number"
                  />
                  <FilterInput
                    label="Effectif max"
                    value={searchFilters.effectifMax?.toString() || ''}
                    onChange={(v) => setSearchFilters({ ...searchFilters, effectifMax: v ? Number(v) : undefined })}
                    placeholder="Max"
                    type="number"
                  />
                </div>
              </div>
            </div>

            {/* Ligne 2 : Financier / Entreprise / Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Financier */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  <DollarSign className="w-3.5 h-3.5" />
                  Financier
                </div>
                <FilterSelect
                  label="Tranche CA"
                  value={searchFilters.trancheCA || ''}
                  onChange={(v) => setSearchFilters({ ...searchFilters, trancheCA: v })}
                  options={TRANCHES_CA.map(t => ({ value: t.value, label: t.label }))}
                  placeholder="Sélectionner..."
                />
                <div className="grid grid-cols-2 gap-2">
                  <FilterInput
                    label="CA min (€)"
                    value={searchFilters.caMin?.toString() || ''}
                    onChange={(v) => setSearchFilters({ ...searchFilters, caMin: v ? Number(v) : undefined })}
                    placeholder="ex: 1000000"
                    type="number"
                  />
                  <FilterInput
                    label="CA max (€)"
                    value={searchFilters.caMax?.toString() || ''}
                    onChange={(v) => setSearchFilters({ ...searchFilters, caMax: v ? Number(v) : undefined })}
                    placeholder="ex: 5000000"
                    type="number"
                  />
                </div>
              </div>

              {/* Entreprise */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-violet-400 uppercase tracking-wider">
                  <Landmark className="w-3.5 h-3.5" />
                  Entreprise
                </div>
                <FilterSelect
                  label="Statut"
                  value={searchFilters.statutEntreprise || ''}
                  onChange={(v) => setSearchFilters({ ...searchFilters, statutEntreprise: v })}
                  options={STATUTS_ENTREPRISE.map(s => ({ value: s.value, label: s.label }))}
                  placeholder="Tous les statuts..."
                />
                <FilterInput
                  label="Immatriculée après"
                  value={searchFilters.dateImmatAfter || ''}
                  onChange={(v) => setSearchFilters({ ...searchFilters, dateImmatAfter: v })}
                  placeholder="YYYY-MM-DD"
                  type="date"
                />
                <FilterInput
                  label="Immatriculée avant"
                  value={searchFilters.dateImmatBefore || ''}
                  onChange={(v) => setSearchFilters({ ...searchFilters, dateImmatBefore: v })}
                  placeholder="YYYY-MM-DD"
                  type="date"
                />
              </div>

              {/* Options */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Options
                </div>
                <FilterSelect
                  label="Source"
                  value={searchFilters.source || 'all'}
                  onChange={(v) => setSearchFilters({ ...searchFilters, source: v })}
                  options={[
                    { value: 'all', label: 'Toutes les sources' },
                    { value: 'api-gouv', label: 'API Gouv uniquement' },
                    { value: 'infogreffe', label: 'InfoGreffe uniquement' },
                  ]}
                  placeholder="Toutes les sources"
                />
                <FilterSelect
                  label="Tri"
                  value={searchFilters.sortBy || 'name'}
                  onChange={(v) => setSearchFilters({ ...searchFilters, sortBy: v })}
                  options={SORT_OPTIONS.map(s => ({ value: s.value, label: s.label }))}
                  placeholder="Nom (A-Z)"
                />
                <div className="pt-1 space-y-2">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={searchFilters.excludeAssociations}
                      onChange={(e) => setSearchFilters({ ...searchFilters, excludeAssociations: e.target.checked })}
                      className="rounded border-border accent-indigo-500"
                    />
                    Exclure Associations
                  </label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={searchFilters.excludeAutoEntrepreneurs}
                      onChange={(e) => setSearchFilters({ ...searchFilters, excludeAutoEntrepreneurs: e.target.checked })}
                      className="rounded border-border accent-indigo-500"
                    />
                    Exclure Auto-entrepreneurs
                  </label>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                Réinitialiser
              </button>
              <button
                onClick={() => handleSearch(1)}
                disabled={isSearching}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20"
              >
                {isSearching ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Recherche...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Appliquer
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Pills de filtres actifs */}
        {activeFilterPills.length > 0 && (
          <div className="flex items-center gap-2 p-3 flex-wrap border-b border-border bg-background/20">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            {activeFilterPills.map((pill, i) => (
              <span
                key={i}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
              >
                {pill}
                <button onClick={handleReset} className="hover:text-indigo-300">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Résultats */}
      {(searchResults.length > 0 || isSearching) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {searchResults.length} résultat{searchResults.length !== 1 ? 's' : ''} trouvé{searchResults.length !== 1 ? 's' : ''}
            </p>
            {/* Pagination */}
            {(searchFilters.page || 1) > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange((searchFilters.page || 1) - 1)}
                  className="p-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Page {(searchFilters.page || 1)}
                </span>
                <button
                  onClick={() => handlePageChange((searchFilters.page || 1) + 1)}
                  disabled={searchResults.length < (searchFilters.limit || 20)}
                  className="p-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {searchResults.map((result: CombinedSearchResult) => {
              const inPipeline = isAlreadyInPipeline(result.siren);
              const isAdding = addingToPipeline.has(result.siren);
              const hasDirectors = result.directors && result.directors.length > 0;
              const isExpanded = expandedDirectors.has(result.siren);
              const hasFinancials = result.caHistory && result.caHistory.length > 0;

              return (
                <div
                  key={result.siren}
                  className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-5 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 group"
                >
                  {/* En-tête */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3
                          className="text-sm font-semibold text-foreground truncate cursor-pointer hover:text-indigo-400 transition-colors"
                          onClick={() => handleViewProfile(result.siren)}
                        >
                          {result.name}
                        </h3>
                        {/* Badge de statut InfoGreffe */}
                        {result.statut && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatutBadgeClass(result.statut)}`}>
                            {getStatutLabel(result.statut)}
                          </span>
                        )}
                        {/* Badge tranche CA */}
                        {result.trancheCA && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {result.trancheCA}
                          </span>
                        )}
                        {inPipeline && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStageColor(
                            companies.find(c => c.siren === result.siren)?.status || 'identifiees'
                          )}`}>
                            {getStageLabel(companies.find(c => c.siren === result.siren)?.status || 'identifiees')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{result.siren}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        result.source === 'infogreffe'
                          ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {result.source === 'infogreffe' ? 'InfoGreffe' : 'API Gouv'}
                      </span>
                    </div>
                  </div>

                  {/* Détails */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-3">
                    {result.nafLabel && (
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Secteur:</span>
                        <span className="text-foreground font-medium truncate">{result.nafLabel}</span>
                      </div>
                    )}
                    {result.nafCode && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">NAF:</span>
                        <span className="text-foreground font-mono">{result.nafCode}</span>
                      </div>
                    )}
                    {result.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-foreground truncate">{result.location}</span>
                      </div>
                    )}
                    {result.greffe && (
                      <div className="flex items-center gap-1.5">
                        <Landmark className="w-3 h-3 text-muted-foreground" />
                        <span className="text-foreground truncate">{result.greffe}</span>
                      </div>
                    )}
                    {result.dateImmatriculation && (
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="w-3 h-3 text-muted-foreground" />
                        <span className="text-foreground">Immat.: {formatDate(result.dateImmatriculation)}</span>
                      </div>
                    )}
                    {result.categorieEntreprise && (
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3 h-3 text-muted-foreground" />
                        <span className="text-foreground">{result.categorieEntreprise}</span>
                      </div>
                    )}
                    {result.adresse && (
                      <div className="flex items-center gap-1.5 col-span-2">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-foreground truncate">{result.adresse}</span>
                      </div>
                    )}
                  </div>

                  {/* Données financières */}
                  {(result.revenue || result.employeeCount) && (
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      {result.revenue != null && (
                        <div className="rounded-lg bg-background/50 p-2.5">
                          <p className="text-[10px] text-muted-foreground mb-0.5">CA</p>
                          <p className="text-sm font-bold text-foreground">{formatCurrency(result.revenue)}</p>
                          {result.dateClotureExercice && (
                            <p className="text-[9px] text-muted-foreground">Clôture: {formatDate(result.dateClotureExercice)}</p>
                          )}
                        </div>
                      )}
                      {result.employeeCount != null && (
                        <div className="rounded-lg bg-background/50 p-2.5">
                          <p className="text-[10px] text-muted-foreground mb-0.5">Effectifs</p>
                          <p className="text-sm font-bold text-foreground">{formatNumber(result.employeeCount)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mini historique CA InfoGreffe */}
                  {hasFinancials && result.caHistory && (
                    <div className="rounded-lg bg-background/30 p-2.5 mb-3">
                      <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Historique CA (InfoGreffe)
                      </p>
                      <div className="flex items-end gap-3">
                        {result.caHistory.map((h: any, i: number) => (
                          <div key={i} className="flex-1 text-center">
                            <p className="text-xs font-semibold text-foreground">{h.ca != null ? formatCurrency(h.ca) : 'N/A'}</p>
                            <p className="text-[10px] text-muted-foreground">{h.year}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dirigeants */}
                  {hasDirectors && (
                    <div className="mb-3">
                      <button
                        onClick={() => {
                          const next = new Set(expandedDirectors);
                          if (next.has(result.siren)) next.delete(result.siren);
                          else next.add(result.siren);
                          setExpandedDirectors(next);
                        }}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Users className="w-3 h-3" />
                        {result.directors!.length} dirigeant{result.directors!.length > 1 ? 's' : ''}
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                      {isExpanded && (
                        <div className="mt-2 space-y-1 pl-5 max-h-48 overflow-y-auto custom-scrollbar">
                          {result.directors!.map((d: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-[10px] font-semibold">
                                {d.prenom?.[0]}{d.nom?.[0]}
                              </div>
                              <span className="text-foreground">{d.prenom} {d.nom}</span>
                              {d.fonction && (
                                <span className="text-muted-foreground">— {d.fonction}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    {inPipeline ? (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400">
                        <Check className="w-3.5 h-3.5" />
                        Dans le pipeline
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddToPipeline(result)}
                        disabled={isAdding}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600 disabled:opacity-50 transition-all shadow-sm"
                      >
                        {isAdding ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                        Ajouter au pipeline
                      </button>
                    )}
                    <button
                      onClick={() => handleViewProfile(result.siren)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors ml-auto"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Détails
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination bas */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => handlePageChange((searchFilters.page || 1) - 1)}
              disabled={(searchFilters.page || 1) <= 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Précédent
            </button>
            <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Page {searchFilters.page || 1}
            </span>
            <button
              onClick={() => handlePageChange((searchFilters.page || 1) + 1)}
              disabled={searchResults.length < (searchFilters.limit || 20)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 disabled:opacity-30 transition-colors"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* État vide */}
      {!isSearching && searchResults.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-indigo-400/50" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Recherche d'entreprises</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Entrez un nom d'entreprise, un SIREN ou utilisez les filtres avancés pour découvrir des cibles M&A potentielles.
          </p>
        </div>
      )}

      {/* Dialogue profil entreprise */}
      {showProfileDialog && profileSiren && (
        <CompanyProfileDialog
          siren={profileSiren}
          searchResult={profileSearchResult}
          onClose={() => { setShowProfileDialog(false); setProfileSiren(null); setProfileSearchResult(null); }}
        />
      )}
    </div>
  );
}

// Sous-composants

function FilterInput({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg text-xs bg-background border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
      />
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder: string;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-xs bg-background border border-border text-foreground focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors appearance-none"
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

