'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  X, Building2, Briefcase, Users, TrendingUp, Calendar,
  Edit3, Save, Star, Target, ChevronDown, ChevronUp,
  Loader2, Globe, BarChart3, User, Mail, AlertCircle, Shield,
  Landmark, Activity, Clock, FileText, Database, RefreshCw,
  CheckCircle2, ArrowUpRight, Tag, Check, Trash2
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate, getScoreColor, getScoreLabel, getStageLabel, getStageColor, getStatutBadgeClass, getStatutLabel, getRegionName, formatSource } from '@/lib/utils';
import type { CompanyWithRelations } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { apiFetch } from '@/lib/api-client';

import type { CombinedSearchResult } from '@/lib/types';

interface CompanyProfileDialogProps {
  companyId?: string;
  siren?: string;
  searchResult?: CombinedSearchResult | null;
  onClose: () => void;
  onRefresh?: () => void;
}

interface EnrichedApiGouv {
  nomComplet?: string;
  sigle?: string;
  sectionActivites?: string;
  nombreEtablissements?: number;
  nombreEtablissementsOuvert?: number;
  dirigeants?: Array<{ nom: string; prenom: string; fonction?: string; date_naissance?: string }>;
  ca?: number | null;
  resultatNet?: number | null;
  coordonnees?: { lat: string; lon: string };
  geoAdresse?: string;
  matchingEtablissements?: Array<{ siret: string; enseigne?: string; geo_adresse?: string; code_postal?: string; libelle_commune?: string }>;
}

interface EnrichedInfoGreffe {
  denomination?: string;
  formeJuridique?: string;
  codeApe?: string;
  libelleApe?: string;
  adresse?: string;
  ville?: string;
  departement?: string;
  region?: string;
  statut?: string;
  dateImmatriculation?: string;
  dateRadiation?: string;
  codeGreffe?: number;
  greffe?: string;
  nic?: string;
}

interface EnrichedFinancial {
  caHistory?: Array<{ year: string; ca: number | null; resultat: number | null; effectif: number | null; dateCloture?: string }>;
  latestCa?: number | null;
  latestResultat?: number | null;
  latestEffectif?: number | null;
  latestDateCloture?: string;
  trancheCA?: string;
}

interface EnrichedData {
  apiGouv: EnrichedApiGouv | null;
  infogreffe: EnrichedInfoGreffe | null;
  financial: EnrichedFinancial | null;
  lastEnrichedAt?: string;
}

export default function CompanyProfileDialog({ companyId, siren, searchResult, onClose, onRefresh }: CompanyProfileDialogProps) {
  const [company, setCompany] = useState<CompanyWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [showSignals, setShowSignals] = useState(true);
  const [showEstablishments, setShowEstablishments] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'legal' | 'network'>('overview');

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [companyId, siren]);

  const loadData = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      if (companyId) {
        // Use dedicated single-company endpoint
        const compRes = await apiFetch(`/api/companies/${companyId}`, { signal });
        if (compRes.ok) {
          const compText = await compRes.text();
          try {
            const foundCompany = JSON.parse(compText);
            setCompany(foundCompany);
            setNotesValue(foundCompany.notes || '');
          } catch { /* parse error, searchResult may still be used */ }
        }
      } else if (siren) {
        // Fallback: search by siren via query param
        const compRes = await apiFetch(`/api/companies?siren=${encodeURIComponent(siren)}`, { signal });
        if (compRes.ok) {
          const compText = await compRes.text();
          try {
const allData = JSON.parse(compText);
      const list = Array.isArray(allData.companies) ? allData.companies : (Array.isArray(allData) ? allData : []);
      const foundCompany = list.find((c: { siren: string }) => c.siren === siren);
            if (foundCompany) {
              setCompany(foundCompany);
              setNotesValue(foundCompany.notes || '');
            }
          } catch { /* parse error */ }
        }
      }
      // Si pas dans la DB, on utilise les données de recherche (searchResult)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Erreur chargement profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrich = async () => {
    if (!company) return;
    setEnriching(true);
    try {
      const res = await apiFetch(`/api/companies/enrich?id=${company.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.company) {
          setCompany(data.company);
        }
        onRefresh?.();
      }
    } catch (error) {
      console.error('Erreur enrichissement:', error);
    } finally {
      setEnriching(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!company) return;
    setSavingNotes(true);
    try {
      await apiFetch('/api/companies', {
        method: 'PATCH',
        body: JSON.stringify({ id: company.id, notes: notesValue }),
      });
      setCompany({ ...company, notes: notesValue });
      setEditingNotes(false);
      onRefresh?.();
    } catch (error) {
      console.error('Erreur sauvegarde notes:', error);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDelete = async () => {
    if (!company || !confirm('Supprimer cette entreprise ?')) return;
    try {
      await apiFetch(`/api/companies?id=${company.id}`, { method: 'DELETE' });
      onRefresh?.();
      onClose();
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  // Parser les données enrichies stockées
  const enrichedData = useMemo((): EnrichedData | null => {
    if (!company?.enrichedData || company.enrichedData === '{}') return null;
    try {
      return JSON.parse(company.enrichedData);
    } catch {
      return null;
    }
  }, [company?.enrichedData]);

  // Extraction des données d'affichage : DB ou searchResult (avant tout return conditionnel)
  const sr = searchResult;
  const name = company?.name || sr?.name || '';
  const sirenDisplay = company?.siren || sr?.siren || '';
  const sector = company?.nafLabel || sr?.nafLabel || company?.sector || sr?.sector || '';
  const nafCode = company?.nafCode || sr?.nafCode || '';
  const city = company?.city || sr?.city || '';
  const postalCode = company?.postalCode || sr?.postalCode || '';
  const region = company?.region || sr?.region || '';
  const address = company?.adresseComplete || sr?.adresse || company?.address || sr?.address || '';
  const revenue = company?.revenue ?? sr?.revenue ?? null;
  const employeeCount = company?.employeeCount ?? sr?.employeeCount ?? null;
  const icpScore = company?.icpScore ?? null;
  const status = company?.status || '';
  const natureJuridique = company?.natureJuridique || sr?.natureJuridique || '';
  const categorieEntreprise = company?.categorieEntreprise || sr?.categorieEntreprise || '';
  const source = company?.source || sr?.source || 'search';
  const signals = company?.signals || [];
  const contacts = company?.contacts || [];
  const statutEntreprise = company?.statutEntreprise || sr?.statut || '';
  const dateImmatriculation = company?.dateImmatriculation || sr?.dateImmatriculation || '';
  const greffe = company?.greffe || sr?.greffe || '';
  const trancheCA = company?.trancheCA || sr?.trancheCA || '';
  const dateClotureExercice = company?.dateClotureExercice || sr?.dateClotureExercice || '';
  const isEnriched = company?.isEnriched || false;
  
const directors = useMemo(() => {
  let list = enrichedData?.apiGouv?.dirigeants || sr?.directors || [];
  return [...list].sort((a: { qualite?: string; fonction?: string; type_dirigeant?: string }, b: { qualite?: string; fonction?: string; type_dirigeant?: string }) => {
    const aRole = (a.qualite || a.fonction || a.type_dirigeant || '').toLowerCase();
    const bRole = (b.qualite || b.fonction || b.type_dirigeant || '').toLowerCase();
    const aLeader = aRole.includes('président') || aRole.includes('president') || aRole.includes('directeur');
    const bLeader = bRole.includes('président') || bRole.includes('president') || bRole.includes('directeur');
    if (aLeader && !bLeader) return -1;
    if (!aLeader && bLeader) return 1;
    return 0;
  });
}, [enrichedData, sr]);

const caHistoryFromDb = enrichedData?.financial?.caHistory || [];
const caHistory = caHistoryFromDb.length > 0 ? caHistoryFromDb : (sr?.caHistory || []);
const etablissements = enrichedData?.apiGouv?.matchingEtablissements || [];
const latestResultat = enrichedData?.financial?.latestResultat ?? enrichedData?.apiGouv?.resultatNet ?? null;
const latestEffectif = enrichedData?.financial?.latestEffectif ?? null;
const dateRadiation = enrichedData?.infogreffe?.dateRadiation || '';
const nbEtablissements = enrichedData?.apiGouv?.nombreEtablissements;
const nbEtablissementsOuvert = enrichedData?.apiGouv?.nombreEtablissementsOuvert;
const lastEnrichedAt = enrichedData?.lastEnrichedAt || '';

const filteredCaHistory = caHistory.filter((h: { year: string }) => h.year);

  // Calcul CA trend — hook avant tout return conditionnel
  const caTrend = useMemo(() => {
    if (filteredCaHistory.length < 2) return null;
    const latest = filteredCaHistory[0]?.ca;
    const prev = filteredCaHistory[1]?.ca;
    if (latest == null || prev == null || prev === 0) return null;
    return ((latest - prev) / prev) * 100;
  }, [filteredCaHistory]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-card rounded-2xl p-8 shadow-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      </div>
    );
  }

  // Mode "read-only" si l'entreprise n'est pas dans la DB mais on a un searchResult
  const isSearchOnly = !company && !!searchResult;

  if (!company && !isSearchOnly) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-card rounded-2xl p-8 shadow-2xl text-center">
          <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Entreprise non trouvée</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 rounded-lg text-sm bg-accent text-foreground">Fermer</button>
        </div>
      </div>
    );
  }

  // getStatutBadgeClass and getStatutLabel are now imported from @/lib/utils

  // caTrend est déjà calculé plus haut (avant les returns conditionnels)

  const tabs = [
    { key: 'overview' as const, label: 'Vue d\'ensemble', icon: <Building2 className="w-4 h-4" /> },
    { key: 'financial' as const, label: 'Financier', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'legal' as const, label: 'Juridique', icon: <Shield className="w-4 h-4" /> },
    { key: 'network' as const, label: 'Réseau', icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* En-tête héro */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-6 shrink-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptMC0zMHY2aDZ2LTZoLTZ6bTAgMTJ2Nmg2di02aC02em0wIDEydjZoNnYtNmgtNnptLTEyIDB2Nmg2di02aC02em0wLTEydjZoNnYtNmgtNnptMC0xMnY2aDZ2LTZoLTZ6bS0xMiAwdjZoNnYtNmgtNnptMCAxMnY2aDZ2LTZoLTY6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-white truncate">{name}</h2>
              <p className="text-sm text-white/70 font-mono mt-0.5">SIREN: {sirenDisplay}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {status && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${getStageColor(status)}`}>
                    {getStageLabel(status)}
                  </span>
                )}
                {statutEntreprise && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${getStatutBadgeClass(statutEntreprise)}`}>
                    {getStatutLabel(statutEntreprise)}
                  </span>
                )}
                {icpScore != null && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${getScoreColor(icpScore)}`}>
                    ICP: {icpScore}/100 — {getScoreLabel(icpScore)}
                  </span>
                )}
                {trancheCA && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/10 text-white border border-white/20">
                    CA: {trancheCA}
                  </span>
                )}
                {isEnriched && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Profil complet
                  </span>
                )}
              </div>
            </div>
            {icpScore != null && (
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                  <circle
                    cx="32" cy="32" r="28" fill="none"
                    stroke={icpScore >= 75 ? '#10B981' : icpScore >= 50 ? '#F59E0B' : '#EF4444'}
                    strokeWidth="4"
                    strokeDasharray={`${(icpScore / 100) * 175.93} 175.93`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{icpScore}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Onglets de navigation */}
        <div className="flex items-center gap-1 px-6 pt-4 pb-0 border-b border-border shrink-0 bg-background/50">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-t-lg border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'text-indigo-400 border-indigo-400 bg-indigo-500/5'
                  : 'text-muted-foreground border-transparent hover:text-foreground hover:border-border'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenu principal */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          {/* === ONGLET VUE D'ENSEMBLE === */}
          {activeTab === 'overview' && (
            <>
              {/* Bandeau KPI */}
              <div className="grid grid-cols-4 gap-3">
                <KPICard icon={<TrendingUp className="w-4 h-4" />} label="CA" value={formatCurrency(revenue)} color="text-emerald-400" />
                <KPICard icon={<Users className="w-4 h-4" />} label="Effectifs" value={employeeCount ? formatNumber(employeeCount) : '—'} color="text-blue-400" />
                <KPICard icon={<Target className="w-4 h-4" />} label="Étape" value={status ? getStageLabel(status) : '—'} color="text-violet-400" />
                <KPICard icon={<Globe className="w-4 h-4" />} label="Source" value={formatSource(source)} color="text-amber-400" />
              </div>

              {/* Détails de l'entreprise */}
              <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-indigo-400" />
                  Informations générales
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                  {sector && <DetailRow label="Secteur" value={sector} />}
                  {nafCode && <DetailRow label="Code NAF" value={nafCode} />}
                  {categorieEntreprise && <DetailRow label="Catégorie" value={categorieEntreprise} />}
                  {natureJuridique && <DetailRow label="Nature juridique" value={natureJuridique} />}
                  {(city || postalCode) && <DetailRow label="Ville" value={`${city} ${postalCode}`.trim()} />}
                  {region && <DetailRow label="Région" value={getRegionName(region)} />}
                  {statutEntreprise && (
                    <DetailRow
                      label="Statut"
                      value={
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${getStatutBadgeClass(statutEntreprise)}`}>
                          {getStatutLabel(statutEntreprise)}
                        </span>
                      }
                    />
                  )}
                  {dateImmatriculation && (
                    <DetailRow label="Immatriculation" value={formatDate(dateImmatriculation)} />
                  )}
                  {dateRadiation && (
                    <DetailRow label="Radiation" value={formatDate(dateRadiation)} />
                  )}
                  {greffe && <DetailRow label="Greffe" value={greffe} />}
                  {trancheCA && (
                    <DetailRow
                      label="Tranche CA"
                      value={
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {trancheCA}
                        </span>
                      }
                    />
                  )}
                  {dateClotureExercice && (
                    <DetailRow label="Clôture exercice" value={formatDate(dateClotureExercice)} />
                  )}
                  {nbEtablissements != null && (
                    <DetailRow label="Établissements" value={`${nbEtablissementsOuvert || 0} ouverts / ${nbEtablissements} total`} />
                  )}
                  {address && (
                    <div className="col-span-2">
                      <DetailRow label="Adresse complète" value={address} />
                    </div>
                  )}
                </div>
              </div>

              {/* Indicateur enrichissement — seulement si dans la DB */}
              {!isSearchOnly && (
              <div className="rounded-xl border border-border bg-background/50 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Database className="w-4 h-4" />
                  {isEnriched ? (
                    <>
                      <span className="text-emerald-400 font-medium">Données enrichies</span>
                      {lastEnrichedAt && (
                        <span className="text-muted-foreground">— mise à jour {formatDate(lastEnrichedAt)}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-amber-400 font-medium">Données de base — enrichissement recommandé</span>
                  )}
                </div>
                <button
                  onClick={handleEnrich}
                  disabled={enriching}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 disabled:opacity-50 transition-colors"
                >
                  {enriching ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  {isEnriched ? 'Mettre à jour' : 'Enrichir le profil'}
                </button>
              </div>
              )}

              {isSearchOnly && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
                <p className="text-xs text-amber-400">Cette entreprise n&apos;est pas encore dans votre pipeline.</p>
                <p className="text-[10px] text-muted-foreground mt-1">Ajoutez-la depuis la recherche pour enrichir son profil.</p>
              </div>
              )}

              {/* Notes — seulement si dans la DB */}
              {!isSearchOnly && (
              <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-indigo-400" />
                    Notes
                  </h3>
                  {!editingNotes && (
                    <button
                      onClick={() => setEditingNotes(true)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Modifier
                    </button>
                  )}
                </div>
                {editingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-card border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
                      placeholder="Ajouter des notes sur cette entreprise..."
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveNotes}
                        disabled={savingNotes}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors flex items-center gap-1"
                      >
                        {savingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Sauvegarder
                      </button>
                      <button
                        onClick={() => { setEditingNotes(false); setNotesValue(company?.notes || ''); }}
                        className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {notesValue || 'Aucune note'}
                  </p>
                )}
              </div>
              )}
            </>
          )}

          {/* === ONGLET FINANCIER === */}
          {activeTab === 'financial' && (
            <>
              {filteredCaHistory.length > 0 ? (
                <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                    Historique du Chiffre d&apos;Affaires
                    {caTrend != null && (
                      <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${caTrend >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {caTrend >= 0 ? '+' : ''}{caTrend.toFixed(1)}%
                      </span>
                    )}
                  </h3>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={filteredCaHistory} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                        <XAxis
                          dataKey="year"
                          tick={{ fill: '#9CA3AF', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: '#9CA3AF', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            borderRadius: '8px',
                            color: '#E2E8F0',
                            fontSize: '12px',
                          }}
                          formatter={(value: number) => [formatCurrency(value), 'CA']}
                        />
                        <Bar dataKey="ca" radius={[4, 4, 0, 0]} barSize={40}>
                          {filteredCaHistory.map((_: { year: string }, index: number) => (
                            <Cell key={index} fill={['#6366F1', '#8B5CF6', '#A78BFA'][index % 3]} fillOpacity={0.8} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {filteredCaHistory.map((h: { year: string; ca?: number | null; resultat?: number | null; effectif?: number | null; dateCloture?: string }, i: number) => (
                      <div key={i} className="rounded-lg bg-card/50 p-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground mb-1">{h.year}</p>
                        <p className="text-xs font-bold text-foreground">{formatCurrency(h.ca)}</p>
                        {h.resultat != null && (
                          <p className={`text-[10px] mt-0.5 ${h.resultat >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            Rés: {formatCurrency(h.resultat)}
                          </p>
                        )}
                        {h.effectif != null && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Eff: {formatNumber(h.effectif)}
                          </p>
                        )}
                        {h.dateCloture && (
                          <p className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-0.5 justify-center">
                            <Clock className="w-2.5 h-2.5" />
                            Clôture: {formatDate(h.dateCloture)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-background/50 p-8 text-center">
                  <BarChart3 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Aucune donnée financière disponible</p>
                  {!isEnriched && (
                    <button
                      onClick={handleEnrich}
                      disabled={enriching}
                      className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors mx-auto"
                    >
                      {enriching ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Enrichir pour obtenir les données financières
                    </button>
                  )}
                </div>
              )}

              {/* KPI financiers */}
              <div className="grid grid-cols-3 gap-3">
                {latestResultat != null && (
                  <div className="rounded-xl border border-border bg-background/50 p-4 text-center">
                    <Activity className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-foreground">{formatCurrency(latestResultat)}</p>
                    <p className="text-[10px] text-muted-foreground">Résultat net</p>
                  </div>
                )}
                {latestEffectif != null && (
                  <div className="rounded-xl border border-border bg-background/50 p-4 text-center">
                    <Users className="w-5 h-5 text-violet-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-foreground">{formatNumber(latestEffectif)}</p>
                    <p className="text-[10px] text-muted-foreground">Effectifs</p>
                  </div>
                )}
                {trancheCA && (
                  <div className="rounded-xl border border-border bg-background/50 p-4 text-center">
                    <Tag className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-foreground">{trancheCA}</p>
                    <p className="text-[10px] text-muted-foreground">Tranche de CA</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* === ONGLET JURIDIQUE === */}
          {activeTab === 'legal' && (
            <>
              <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  Informations juridiques
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {natureJuridique && <DetailRow label="Forme juridique" value={natureJuridique} />}
                  {categorieEntreprise && <DetailRow label="Catégorie" value={categorieEntreprise} />}
                  {nafCode && <DetailRow label="Code APE/NAF" value={nafCode} />}
                  {sector && <DetailRow label="Libellé NAF" value={sector} />}
                  {statutEntreprise && (
                    <DetailRow
                      label="Statut entreprise"
                      value={
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${getStatutBadgeClass(statutEntreprise)}`}>
                          {getStatutLabel(statutEntreprise)}
                        </span>
                      }
                    />
                  )}
                  {dateImmatriculation && (
                    <DetailRow label="Date d&apos;immatriculation" value={formatDate(dateImmatriculation)} />
                  )}
                  {dateRadiation && (
                    <DetailRow label="Date de radiation" value={formatDate(dateRadiation)} />
                  )}
                  {greffe && <DetailRow label="Greffe" value={greffe} />}
                  {dateClotureExercice && (
                    <DetailRow label="Date de clôture" value={formatDate(dateClotureExercice)} />
                  )}
                </div>
              </div>

              {/* Dirigeants */}
              {directors.length > 0 && (
                <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    Dirigeants ({directors.length})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {directors.map((d: { nom?: string; prenom?: string; prenoms?: string[]; fonction?: string; qualite?: string; type_dirigeant?: string; date_naissance?: string }, i: number) => {
                      const prenom = d.prenoms || d.prenom;
                      const role = d.qualite || d.fonction || d.type_dirigeant;
                      return (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-card/50">
                        <div className="w-9 h-9 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-xs font-bold border border-indigo-500/20">
                          {(prenom?.[0] || '')}{(d.nom?.[0] || '')}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{prenom} {d.nom}</p>
                          {role && <p className="text-xs text-muted-foreground">{role}</p>}
                        </div>
                        {d.date_naissance && (
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(d.date_naissance)}
                            </p>
                          </div>
                        )}
                      </div>
                    )})}
                  </div>
                </div>
              )}

              {/* Établissements */}
              {etablissements.length > 0 && (
                <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                  <button
                    onClick={() => setShowEstablishments(!showEstablishments)}
                    className="w-full flex items-center justify-between text-sm font-semibold text-foreground"
                  >
                    <span className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-violet-400" />
                      Établissements ({etablissements.length})
                    </span>
                    {showEstablishments ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showEstablishments && (
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                      {etablissements.map((e: { siret: string; enseigne?: string; geo_adresse?: string; code_postal?: string; libelle_commune?: string }, i: number) => (
                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-card/50">
                          <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 text-[10px] font-mono">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            {e.enseigne && <p className="text-sm font-medium text-foreground">{e.enseigne}</p>}
                            <p className="text-xs text-muted-foreground font-mono">{e.siret}</p>
                            {(e.libelle_commune || e.code_postal) && (
                              <p className="text-[10px] text-muted-foreground">{e.libelle_commune} {e.code_postal}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* === ONGLET RÉSEAU === */}
          {activeTab === 'network' && (
            <>
              {/* Contacts */}
              {contacts.length > 0 ? (
                <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
                    Contacts ({contacts.length})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {contacts.map((c: { id: string; firstName: string; lastName: string; email: string; role: string; seniority?: string; emailVerified?: boolean }) => (
                      <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-card/50">
                        <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 text-xs font-bold border border-blue-500/20">
                          {(c.firstName?.[0] || '')}{(c.lastName?.[0] || '')}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">{c.firstName} {c.lastName}</p>
                          <p className="text-xs text-muted-foreground">{c.role} · {c.seniority}</p>
                          {c.email && (
                            <p className="text-xs text-indigo-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" />
                              {c.email}
                              {c.emailVerified && <Check className="w-3 h-3 text-emerald-400" />}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-background/50 p-8 text-center">
                  <User className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Aucun contact enregistré</p>
                  <p className="text-xs text-muted-foreground mt-1">Les contacts peuvent être ajoutés via le scan IA ou manuellement</p>
                </div>
              )}

              {/* Signaux */}
              {signals.length > 0 && (
                <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                  <button
                    onClick={() => setShowSignals(!showSignals)}
                    className="w-full flex items-center justify-between text-sm font-semibold text-foreground"
                  >
                    <span className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400" />
                      Signaux ({signals.length})
                    </span>
                    {showSignals ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showSignals && (
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                      {signals.map((s: { id: string; type: string; title: string; description: string; source: string; detectedAt: string; confidence: number | null }) => (
                        <div key={s.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-card/50">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            s.type === 'growth' ? 'bg-emerald-400' :
                            s.type === 'hiring' ? 'bg-blue-400' : 'bg-amber-400'
                          }`} />
                          <div>
                            <p className="text-sm font-medium text-foreground">{s.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {formatDate(s.detectedAt)} · {s.source}
                              {s.confidence != null && ` · Confiance: ${Math.round(s.confidence * 100)}%`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-indigo-400" />
                    Notes
                  </h3>
                  {!editingNotes && (
                    <button onClick={() => setEditingNotes(true)} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                      Modifier
                    </button>
                  )}
                </div>
                {editingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg text-sm bg-card border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
                      placeholder="Ajouter des notes..."
                    />
                    <div className="flex items-center gap-2">
                      <button onClick={handleSaveNotes} disabled={savingNotes} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 transition-colors flex items-center gap-1">
                        {savingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Sauvegarder
                      </button>
                      <button onClick={() => { setEditingNotes(false); setNotesValue(company?.notes || ''); }} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors">
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{notesValue || 'Aucune note'}</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Actions pied de page */}
        <div className="flex items-center justify-between p-4 border-t border-border shrink-0 bg-background/30">
          <div className="flex items-center gap-2">
            <a
              href={`https://annuaire-entreprises.data.gouv.fr/entreprise/${sirenDisplay}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-indigo-500/20 transition-colors"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Annuaire Entreprises
            </a>
            {greffe && (
              <a
                href={`https://www.datainfogreffe.fr/${sirenDisplay}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 border border-violet-500/20 transition-colors"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                InfoGreffe
              </a>
            )}
          </div>
          {company && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg bg-card/50 border border-border/50 p-3 text-center">
      <div className={`${color} flex justify-center mb-1.5`}>{icon}</div>
      <p className="text-sm font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-muted-foreground shrink-0 min-w-[130px]">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}


