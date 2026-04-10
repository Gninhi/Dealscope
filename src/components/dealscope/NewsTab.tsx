'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Newspaper, ExternalLink, Loader2, Globe, Clock, RefreshCw,
  Search, BookmarkPlus, BookmarkCheck,
  Star, Eye, EyeOff, X, Layers, Trophy, Clock as ClockIcon,
  TrendingUp, Shield, Cpu, Landmark, Building2, Sparkles,
  AlertCircle, ArrowUpRight, Bell, BellPlus, BellOff,
  Trash2, ChevronDown, ChevronUp, ToggleLeft, ToggleRight,
  Plus, Zap, Flame, BadgeEuro, Building, MapPin, Tag,
  TrendingDown, MinusCircle, ArrowRight, Clock3, EyeIcon
} from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { apiFetch } from '@/lib/api-client';

// ── Types ────────────────────────────────────────────────────────
interface NewsItem {
  id: string;
  title: string;
  snippet: string;
  summary?: string;
  url: string;
  hostName: string;
  favicon: string;
  date: string;
  publishedAt: string;
  category: string;
  source: 'premium' | 'verified' | 'standard';
  sourceName: string;
  sourceIcon?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  dealValue?: string;
  dealCurrency?: string;
  companies?: string[];
  sectors?: string[];
  countries?: string[];
  isBreaking?: boolean;
  isPremium?: boolean;
  readTime?: number;
  author?: string;
  tags?: string[];
}

interface NewsAlert {
  id: string;
  name: string;
  type: string;
  keywords: string;
  sector: string;
  isActive: boolean;
  createdAt: string;
}

const CATEGORIES = [
  { key: 'all', label: 'Tout', icon: Layers, color: '#6366f1', gradient: 'from-indigo-500 to-purple-600' },
  { key: 'deals_clos', label: 'Deals clos', icon: Trophy, color: '#10b981', gradient: 'from-emerald-500 to-teal-600' },
  { key: 'en_cours', label: 'En cours', icon: ClockIcon, color: '#f59e0b', gradient: 'from-amber-500 to-orange-600' },
  { key: 'marche', label: 'Marché', icon: TrendingUp, color: '#3b82f6', gradient: 'from-blue-500 to-cyan-600' },
  { key: 'tech', label: 'Tech & Digital', icon: Cpu, color: '#8b5cf6', gradient: 'from-violet-500 to-purple-600' },
  { key: 'pe_lbo', label: 'LBO & PE', icon: Landmark, color: '#ec4899', gradient: 'from-pink-500 to-rose-600' },
  { key: 'reglementaire', label: 'Réglementaire', icon: Shield, color: '#ef4444', gradient: 'from-red-500 to-orange-600' },
  { key: 'sectoriel', label: 'Sectoriel', icon: Building2, color: '#14b8a6', gradient: 'from-teal-500 to-emerald-600' },
];

const CAT_LABELS: Record<string, string> = {
  deals_clos: 'Deal clos', en_cours: 'En cours', marche: 'Marché',
  reglementaire: 'Réglementaire', tech: 'Tech & Digital',
  pe_lbo: 'LBO & PE', sectoriel: 'Sectoriel',
};

const SOURCE_BADGE: Record<string, string> = {
  premium: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
  verified: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  standard: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
};
const SOURCE_LABEL: Record<string, string> = { premium: 'Premium', verified: 'Vérifié', standard: 'Web' };

const SENTIMENT_CONFIG = {
  positive: { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Positif' },
  negative: { icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Négatif' },
  neutral: { icon: MinusCircle, color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Neutre' },
};

const ALERT_TYPES = [
  { value: 'keyword', label: 'Mot-clé' },
  { value: 'sector', label: 'Secteur' },
  { value: 'company', label: 'Entreprise' },
];

// ── LocalStorage helpers ────────────────────────────────────────
function loadFromLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(`dealscope_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}
function saveToLS<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(`dealscope_${key}`, JSON.stringify(value)); } catch { /* quota */ }
}

// ── Component ────────────────────────────────────────────────────
export default function NewsTab() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedSummary, setExpandedSummary] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [loadingSummary, setLoadingSummary] = useState<Record<string, boolean>>({});
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [sources, setSources] = useState<string[]>([]);

  // Persistent favorites & important
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [important, setImportant] = useState<Set<string>>(new Set());
  const [lsReady, setLsReady] = useState(false);

  // Alerts
  const [alerts, setAlerts] = useState<NewsAlert[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [newAlertName, setNewAlertName] = useState('');
  const [newAlertKeywords, setNewAlertKeywords] = useState('');
  const [newAlertType, setNewAlertType] = useState('keyword');
  const [creatingAlert, setCreatingAlert] = useState(false);
  const [togglingAlert, setTogglingAlert] = useState<Set<string>>(new Set());
  const [deletingAlert, setDeletingAlert] = useState<Set<string>>(new Set());

  // ── Load persisted state ─────────────────────────────────────
  useEffect(() => {
    setFavorites(new Set(loadFromLS<string[]>('news_favorites', [])));
    setImportant(new Set(loadFromLS<string[]>('news_important', [])));
    setLsReady(true);
  }, []);

  const updateFavorites = useCallback((next: Set<string>) => {
    setFavorites(next);
    saveToLS('news_favorites', Array.from(next));
  }, []);

  const updateImportant = useCallback((next: Set<string>) => {
    setImportant(next);
    saveToLS('news_important', Array.from(next));
  }, []);

  // ── Fetch news ───────────────────────────────────────────────
  const fetchNews = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      params.set('category', activeCat);
      if (refresh) params.set('refresh', 'true');

      const res = await apiFetch(`/api/news?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.error) { setError(data.error); return; }

      setNews(data.results || []);
      setTotalResults(data.total || 0);
      setLastUpdated(data.lastUpdated || new Date().toISOString());
      setSources(data.sources || []);
    } catch {
      setError('Impossible de charger les actualités. Réessayez.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [activeCat]);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  // ── Search debounce ──────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Stats ───────────────────────────────────────────────────
  const stats = useMemo(() => {
    const cats: Record<string, number> = {};
    for (const n of news) cats[n.category] = (cats[n.category] || 0) + 1;
    return cats;
  }, [news]);

  // ── AI Summary ──────────────────────────────────────────────
  const getSummary = async (item: NewsItem) => {
    const key = item.id || item.url;
    if (!key) return;
    if (summaries[key]) { setExpandedSummary(expandedSummary === key ? null : key); return; }

    setLoadingSummary(p => ({ ...p, [key]: true }));
    try {
      const res = await apiFetch('/api/news/summary', {
        method: 'POST',
        body: JSON.stringify({ title: item.title, snippet: item.snippet }),
      });
      const data = await res.json();
      if (data.summary) { setSummaries(p => ({ ...p, [key]: data.summary })); setExpandedSummary(key); }
    } catch { /* silent */ }
    finally { setLoadingSummary(p => ({ ...p, [key]: false })); }
  };

  // ── Toggle helpers ──────────────────────────────────────────
  const toggleFav = (key: string) => {
    const next = new Set(favorites);
    if (next.has(key)) next.delete(key); else next.add(key);
    updateFavorites(next);
  };
  const toggleStar = (key: string) => {
    const next = new Set(important);
    if (next.has(key)) next.delete(key); else next.add(key);
    updateImportant(next);
  };

  // ── Alerts CRUD ─────────────────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await apiFetch('/api/news/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(Array.isArray(data) ? data : []);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const handleCreateAlert = async () => {
    if (!newAlertName.trim()) return;
    setCreatingAlert(true);
    try {
      const res = await apiFetch('/api/news/alerts', {
        method: 'POST',
        body: JSON.stringify({
          name: newAlertName.trim(),
          type: newAlertType,
          keywords: newAlertKeywords.split(',').map(k => k.trim()).filter(Boolean),
        }),
      });
      if (res.ok) {
        setNewAlertName('');
        setNewAlertKeywords('');
        setShowCreateAlert(false);
        await fetchAlerts();
      }
    } catch { /* silent */ }
    finally { setCreatingAlert(false); }
  };

  const handleToggleAlert = async (alert: NewsAlert) => {
    setTogglingAlert(p => new Set(p).add(alert.id));
    try {
      await apiFetch('/api/news/alerts', {
        method: 'PATCH',
        body: JSON.stringify({ id: alert.id, isActive: !alert.isActive }),
      });
      setAlerts(p => p.map(a => a.id === alert.id ? { ...a, isActive: !a.isActive } : a));
    } catch { /* silent */ }
    finally { setTogglingAlert(p => { const n = new Set(p); n.delete(alert.id); return n; }); }
  };

  const handleDeleteAlert = async (id: string) => {
    setDeletingAlert(p => new Set(p).add(id));
    try {
      await apiFetch(`/api/news/alerts?id=${id}`, { method: 'DELETE' });
      setAlerts(p => p.filter(a => a.id !== id));
    } catch { /* silent */ }
    finally { setDeletingAlert(p => { const n = new Set(p); n.delete(id); return n; }); }
  };

  // ── Filtered results ────────────────────────────────────────
  const displayed = useMemo(() => {
    if (!searchQuery) return news;
    const q = searchQuery.toLowerCase();
    return news.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.snippet.toLowerCase().includes(q) ||
      n.hostName.toLowerCase().includes(q) ||
      n.companies?.some(c => c.toLowerCase().includes(q)) ||
      n.sectors?.some(s => s.toLowerCase().includes(q))
    );
  }, [news, searchQuery]);

  const favCount = favorites.size;
  const importantCount = important.size;

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
              <Newspaper className="w-5 h-5 text-white" />
            </div>
            Actualités M&A Premium
          </h2>
          <p className="text-muted-foreground text-sm mt-1.5 flex items-center gap-2 flex-wrap">
            <span>Veille M&A Européenne en temps réel</span>
            <span className="text-muted-foreground/40">•</span>
            <span className="text-foreground font-medium">{totalResults} articles</span>
            {lastUpdated && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock3 className="w-3 h-3" />
                  MAJ {timeAgo(lastUpdated)}
                </span>
              </>
            )}
            {favCount > 0 && <span className="text-amber-400 font-medium">{favCount} favori{favCount > 1 ? 's' : ''}</span>}
            {importantCount > 0 && <span className="text-violet-400 font-medium">{importantCount} suivi{importantCount > 1 ? 's' : ''}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showAlerts
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 border border-transparent'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Alertes
            {alerts.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${showAlerts ? 'bg-amber-500/20 text-amber-300' : 'bg-muted'}`}>
                {alerts.filter(a => a.isActive).length}
              </span>
            )}
          </button>
          <button
            onClick={() => fetchNews(true)} disabled={loading || isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Alerts Section */}
      {showAlerts && (
        <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 overflow-hidden animate-fade-in-up">
          <div className="flex items-center justify-between p-4 border-b border-amber-500/10">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-foreground">Mes alertes</h3>
              <span className="text-xs text-muted-foreground">({alerts.length})</span>
            </div>
            <button
              onClick={() => setShowCreateAlert(!showCreateAlert)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors"
            >
              {showCreateAlert ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              {showCreateAlert ? 'Annuler' : 'Créer'}
            </button>
          </div>

          {showCreateAlert && (
            <div className="p-4 border-b border-amber-500/10 bg-background/30 space-y-3 animate-fade-in-up">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block uppercase tracking-wider font-medium">Nom</label>
                  <input
                    type="text" value={newAlertName} onChange={e => setNewAlertName(e.target.value)}
                    placeholder="ex: M&A Tech France"
                    className="w-full px-3 py-2 rounded-lg text-xs bg-card border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block uppercase tracking-wider font-medium">Mots-clés</label>
                  <input
                    type="text" value={newAlertKeywords} onChange={e => setNewAlertKeywords(e.target.value)}
                    placeholder="ex: acquisition, IA"
                    className="w-full px-3 py-2 rounded-lg text-xs bg-card border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block uppercase tracking-wider font-medium">Type</label>
                  <select
                    value={newAlertType} onChange={e => setNewAlertType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30 appearance-none"
                  >
                    {ALERT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleCreateAlert}
                  disabled={creatingAlert || !newAlertName.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 transition-all"
                >
                  {creatingAlert ? <Loader2 className="w-3 h-3 animate-spin" /> : <BellPlus className="w-3 h-3" />}
                  Créer
                </button>
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <BellOff className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">Aucune alerte configurée</p>
              </div>
            ) : (
              <div className="divide-y divide-amber-500/5">
                {alerts.map(alert => (
                  <div key={alert.id} className="flex items-center gap-3 px-4 py-3 hover:bg-amber-500/5 transition-colors">
                    <button onClick={() => handleToggleAlert(alert)} disabled={togglingAlert.has(alert.id)} className="shrink-0">
                      {alert.isActive ? <ToggleRight className="w-5 h-5 text-amber-400" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground/40" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${alert.isActive ? 'text-foreground' : 'text-muted-foreground/50'}`}>{alert.name}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium border border-border bg-muted/50 text-muted-foreground">
                        {ALERT_TYPES.find(t => t.value === alert.type)?.label || alert.type}
                      </span>
                    </div>
                    <button onClick={() => handleDeleteAlert(alert.id)} disabled={deletingAlert.has(alert.id)} className="shrink-0 p-1.5 rounded-md text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-all">
                      {deletingAlert.has(alert.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Premium */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', val: totalResults, color: 'text-foreground', icon: Layers },
          { label: 'Deals clos', val: stats.deals_clos || 0, color: 'text-emerald-400', icon: Trophy },
          { label: 'En cours', val: stats.en_cours || 0, color: 'text-amber-400', icon: ClockIcon },
          { label: 'Premium', val: news.filter(n => n.source === 'premium').length, color: 'text-indigo-400', icon: Zap },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm p-3.5 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200">
            <div className="flex items-center gap-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{s.label}</div>
            </div>
            <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon;
          const active = activeCat === cat.key;
          const count = cat.key === 'all' ? totalResults : (stats[cat.key] || 0);
          return (
            <button key={cat.key} onClick={() => setActiveCat(cat.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                active
                  ? `bg-gradient-to-r ${cat.gradient} text-white shadow-md`
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 border border-transparent hover:border-border'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
              {count > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Rechercher par titre, entreprise, secteur..." value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="w-full rounded-xl border border-border bg-card/50 pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 backdrop-blur-sm" />
        {searchInput && (
          <button onClick={() => { setSearchInput(''); setSearchQuery(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-accent/50">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="relative">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
            <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-indigo-500/20 animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground mt-4">Agrégation multi-sources...</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Europe • Premium • Temps réel</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-10 h-10 text-red-400/60 mb-3" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <button onClick={() => fetchNews(true)} className="mt-4 px-4 py-2 rounded-lg text-xs bg-accent/50 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            Réessayer
          </button>
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Newspaper className="w-12 h-12 text-muted-foreground/20 mb-3" />
          <p className="text-sm text-muted-foreground font-medium">{searchQuery ? 'Aucun résultat' : 'Aucun article'}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">{searchQuery ? 'Modifiez vos critères de recherche' : 'Actualisez les données'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map((item, idx) => {
            const key = item.id || `news-${idx}-${item.url?.slice(0, 20) || ''}`;
            const catInfo = CATEGORIES.find(c => c.key === item.category);
            const isFav = favorites.has(key);
            const isImp = important.has(key);
            const isExpanded = expandedSummary === key;
            const sumText = summaries[key];
            const catColor = catInfo?.color || '#6366f1';
            const isPremium = item.source === 'premium';
            const sentiment = item.sentiment ? SENTIMENT_CONFIG[item.sentiment] : null;
            const SentimentIcon = sentiment?.icon;

            return (
              <div key={key}
                className={`rounded-2xl border backdrop-blur-sm transition-all duration-300 group animate-fade-in-up overflow-hidden ${
                  item.isBreaking
                    ? 'border-red-500/30 bg-gradient-to-r from-red-500/5 to-orange-500/5 shadow-lg shadow-red-500/10'
                    : isPremium
                    ? 'border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5'
                    : 'border-border bg-card/50 hover:border-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/5'
                }`}
                style={{ animationDelay: `${Math.min(idx * 50, 500)}ms` }}
              >
                {/* Breaking Banner */}
                {item.isBreaking && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border-b border-red-500/10">
                    <Flame className="w-4 h-4 text-red-400 animate-pulse" />
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Breaking News</span>
                    {item.dealValue && (
                      <span className="ml-auto text-xs font-semibold text-red-300">
                        {item.dealValue} {item.dealCurrency}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex">
                  {/* Left color accent */}
                  <div className="w-1.5 shrink-0 rounded-l-2xl" style={{ backgroundColor: catColor }} />

                  <div className="flex-1 min-w-0 p-4">
                    {/* Header row */}
                    <div className="flex items-start gap-3 mb-3">
                      {/* Source favicon */}
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        {item.sourceIcon || item.favicon ? (
                          <img src={item.sourceIcon || item.favicon} alt="" className="w-8 h-8 rounded-lg shadow-sm" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
                            <Newspaper className="w-4 h-4 text-indigo-400" />
                          </div>
                        )}
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold border ${SOURCE_BADGE[item.source] || SOURCE_BADGE.standard}`}>
                          {SOURCE_LABEL[item.source] || 'Web'}
                        </span>
                      </div>

                      {/* Title & meta */}
                      <div className="flex-1 min-w-0">
                        {/* Premium badge */}
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          {isPremium && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/20">
                              <Zap className="w-3 h-3" /> Premium
                            </span>
                          )}
                          {sentiment && SentimentIcon && (
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${sentiment.bg} ${sentiment.color}`}>
                              <SentimentIcon className="w-3 h-3" /> {sentiment.label}
                            </span>
                          )}
                          {item.readTime && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <EyeIcon className="w-3 h-3" /> {item.readTime} min
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="block group">
                          <h3 className="text-base font-semibold text-foreground group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">
                            {item.title}
                          </h3>
                        </a>
                      </div>
                    </div>

                    {/* Snippet */}
                    {item.snippet && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-3 leading-relaxed pl-11">
                        {item.snippet}
                      </p>
                    )}

                    {/* Deal info */}
                    {(item.dealValue || item.companies?.length || item.sectors?.length) && (
                      <div className="flex flex-wrap gap-2 mb-3 pl-11">
                        {item.dealValue && (
                          <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <BadgeEuro className="w-3.5 h-3.5" />
                            {item.dealValue} {item.dealCurrency}
                          </span>
                        )}
                        {item.companies?.slice(0, 3).map((company, i) => (
                          <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            <Building className="w-3 h-3" />
                            {company}
                          </span>
                        ))}
                        {item.sectors?.slice(0, 2).map((sector, i) => (
                          <span key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                            <Tag className="w-3 h-3" />
                            {sector}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* AI Summary expanded */}
                    {isExpanded && sumText && (
                      <div className="mb-3 ml-11 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 p-4 animate-fade-in-up">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Résumé IA</span>
                        </div>
                        <p className="text-sm text-foreground/90 leading-relaxed">{sumText}</p>
                      </div>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center justify-between pl-11">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Globe className="w-3 h-3" />{item.sourceName || item.hostName}
                        </span>
                        {item.date && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />{timeAgo(item.date)}
                          </span>
                        )}
                        {catInfo && item.category !== 'all' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium border"
                            style={{ backgroundColor: `${catColor}15`, color: catColor, borderColor: `${catColor}30` }}>
                            {CAT_LABELS[item.category] || item.category}
                          </span>
                        )}
                        {isImp && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-violet-400" /> Suivi
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions bar */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 bg-gradient-to-r from-background/50 to-background/30">
                  <div className="flex items-center gap-1">
                    <button onClick={() => getSummary(item)} disabled={loadingSummary[key]}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10 disabled:opacity-50 transition-all">
                      {loadingSummary[key] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isExpanded ? <EyeOff className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                      {isExpanded ? 'Masquer' : 'Résumé IA'}
                    </button>
                    <button onClick={() => toggleStar(key)}
                      className={`p-1.5 rounded-lg transition-all ${isImp ? 'text-amber-400 bg-amber-500/10' : 'text-muted-foreground/50 hover:text-amber-400 hover:bg-amber-500/10'}`}>
                      <Star className={`w-4 h-4 ${isImp ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleFav(key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isFav ? 'text-amber-400 bg-amber-500/10' : 'text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10'
                      }`}>
                      {isFav ? <BookmarkCheck className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                      {isFav ? 'Sauvegardé' : 'Favoris'}
                    </button>
                    <a href={item.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10 transition-all">
                      <ArrowUpRight className="w-3.5 h-3.5" /> Ouvrir
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sources footer */}
      {sources.length > 0 && !loading && (
        <div className="flex items-center justify-center gap-2 pt-4 text-xs text-muted-foreground/60">
          <span>Sources:</span>
          {sources.map((s, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full bg-muted/30">
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
