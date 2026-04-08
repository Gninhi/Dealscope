'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Newspaper, ExternalLink, Loader2, Globe, Clock, RefreshCw,
  Search, BookmarkPlus, BookmarkCheck,
  Star, Eye, EyeOff, X, Layers, Trophy, Clock as ClockIcon,
  TrendingUp, Shield, Cpu, Landmark, Building2, Sparkles,
  AlertCircle, ArrowUpRight, Bell, BellPlus, BellOff,
  Trash2, ChevronDown, ChevronUp, ToggleLeft, ToggleRight,
  Plus, Zap,
} from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { apiFetch } from '@/lib/api-client';

// ── Types ────────────────────────────────────────────────────────
interface NewsItem {
  title: string;
  snippet: string;
  url: string;
  hostName: string;
  favicon: string;
  date: string;
  category: string;
  source: string; // 'high' | 'medium' | 'low'
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
  { key: 'all', label: 'Tout', icon: Layers, color: '#6366f1' },
  { key: 'deals_clos', label: 'Deals clos', icon: Trophy, color: '#10b981' },
  { key: 'en_cours', label: 'En cours', icon: ClockIcon, color: '#f59e0b' },
  { key: 'marche', label: 'Marché', icon: TrendingUp, color: '#3b82f6' },
  { key: 'reglementaire', label: 'Réglementaire', icon: Shield, color: '#ef4444' },
  { key: 'tech', label: 'Tech & Digital', icon: Cpu, color: '#8b5cf6' },
  { key: 'pe_lbo', label: 'LBO & PE', icon: Landmark, color: '#ec4899' },
  { key: 'sectoriel', label: 'Sectoriel', icon: Building2, color: '#14b8a6' },
];

const CAT_LABELS: Record<string, string> = {
  deals_clos: 'Deal clos', en_cours: 'En cours', marche: 'Marché',
  reglementaire: 'Réglementaire', tech: 'Tech & Digital',
  pe_lbo: 'LBO & PE', sectoriel: 'Sectoriel',
};

const SOURCE_BADGE: Record<string, string> = {
  high: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  medium: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  low: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
};
const SOURCE_LABEL: Record<string, string> = { high: 'Premium', medium: 'Fiable', low: 'Web' };

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

  // Persistent favorites & important (localStorage)
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [important, setImportant] = useState<Set<string>>(new Set());
  const [lsReady, setLsReady] = useState(false);

  // Alerts state
  const [alerts, setAlerts] = useState<NewsAlert[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [newAlertName, setNewAlertName] = useState('');
  const [newAlertKeywords, setNewAlertKeywords] = useState('');
  const [newAlertType, setNewAlertType] = useState('keyword');
  const [creatingAlert, setCreatingAlert] = useState(false);
  const [togglingAlert, setTogglingAlert] = useState<Set<string>>(new Set());
  const [deletingAlert, setDeletingAlert] = useState<Set<string>>(new Set());

  // ── Load persisted state from localStorage on mount ──────────
  useEffect(() => {
    setFavorites(new Set(loadFromLS<string[]>('news_favorites', [])));
    setImportant(new Set(loadFromLS<string[]>('news_important', [])));
    setLsReady(true);
  }, []);

  // Persist favorites
  const updateFavorites = useCallback((next: Set<string>) => {
    setFavorites(next);
    saveToLS('news_favorites', Array.from(next));
  }, []);

  // Persist important
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
    } catch {
      setError('Impossible de charger les actualités. Réessayez.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [activeCat]);

  // Fetch on mount and category change
  useEffect(() => { fetchNews(); }, [fetchNews]);

  // ── Search handler (debounced) ───────────────────────────────
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
    const key = item.url;
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
    return news.filter(n => n.title.toLowerCase().includes(q) || n.snippet.toLowerCase().includes(q) || n.hostName.toLowerCase().includes(q));
  }, [news, searchQuery]);

  const favCount = favorites.size;
  const importantCount = important.size;

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <Newspaper className="w-4 h-4 text-white" />
            </div>
            Actualités M&A
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Veille M&A Européenne — Sources premium & web • {totalResults} articles
            {favCount > 0 && <span className="ml-2 text-amber-400">{favCount} favori{favCount > 1 ? 's' : ''}</span>}
            {importantCount > 0 && <span className="ml-2 text-indigo-400">{importantCount} suivi{importantCount > 1 ? 's' : ''}</span>}
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
              {showCreateAlert ? 'Annuler' : 'Créer une alerte'}
            </button>
          </div>

          {/* Create alert form */}
          {showCreateAlert && (
            <div className="p-4 border-b border-amber-500/10 bg-background/30 space-y-3 animate-fade-in-up">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block uppercase tracking-wider font-medium">Nom de l&apos;alerte</label>
                  <input
                    type="text" value={newAlertName} onChange={e => setNewAlertName(e.target.value)}
                    placeholder="ex: M&A Tech France"
                    className="w-full px-3 py-2 rounded-lg text-xs bg-card border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block uppercase tracking-wider font-medium">Mots-clés (séparés par ,)</label>
                  <input
                    type="text" value={newAlertKeywords} onChange={e => setNewAlertKeywords(e.target.value)}
                    placeholder="ex: acquisition, IA, SaaS"
                    className="w-full px-3 py-2 rounded-lg text-xs bg-card border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block uppercase tracking-wider font-medium">Type</label>
                  <select
                    value={newAlertType} onChange={e => setNewAlertType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/30 transition-colors appearance-none"
                  >
                    {ALERT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={handleCreateAlert}
                  disabled={creatingAlert || !newAlertName.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 transition-all shadow-sm"
                >
                  {creatingAlert ? <Loader2 className="w-3 h-3 animate-spin" /> : <BellPlus className="w-3 h-3" />}
                  Créer
                </button>
              </div>
            </div>
          )}

          {/* Alerts list */}
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <BellOff className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">Aucune alerte configurée</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">Créez des alertes pour suivre les actualités M&A</p>
              </div>
            ) : (
              <div className="divide-y divide-amber-500/5">
                {alerts.map(alert => (
                  <div key={alert.id} className="flex items-center gap-3 px-4 py-3 hover:bg-amber-500/5 transition-colors">
                    <button
                      onClick={() => handleToggleAlert(alert)}
                      disabled={togglingAlert.has(alert.id)}
                      className="shrink-0"
                    >
                      {alert.isActive ? (
                        <ToggleRight className="w-5 h-5 text-amber-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-muted-foreground/40" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${alert.isActive ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                        {alert.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium border border-border bg-muted/50 text-muted-foreground">
                          {ALERT_TYPES.find(t => t.value === alert.type)?.label || alert.type}
                        </span>
                        {alert.keywords && alert.keywords !== '[]' && (
                          <span className="text-[10px] text-muted-foreground truncate">
                            {(() => { try { return JSON.parse(alert.keywords).join(', '); } catch { return alert.keywords; } })()}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      disabled={deletingAlert.has(alert.id)}
                      className="shrink-0 p-1.5 rounded-md text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      {deletingAlert.has(alert.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Articles', val: totalResults, color: 'text-foreground' },
          { label: 'Deals clos', val: stats.deals_clos || 0, color: 'text-emerald-400' },
          { label: 'En cours', val: stats.en_cours || 0, color: 'text-amber-400' },
          { label: 'Tech & Digital', val: stats.tech || 0, color: 'text-violet-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-3 hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-200">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{s.label}</div>
            <div className={`text-xl font-bold mt-0.5 ${s.color}`}>{s.val}</div>
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
                active ? 'bg-gradient-to-r from-indigo-500/15 to-violet-500/15 text-indigo-400 border border-indigo-500/20' : 'text-muted-foreground hover:text-foreground hover:bg-accent/50 border border-transparent'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
              {count > 0 && <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-indigo-500/20 text-indigo-300' : 'bg-muted text-muted-foreground'}`}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Filtrer les actualités..." value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="w-full rounded-lg border border-border bg-card/50 pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 backdrop-blur-sm" />
        {searchInput && <button onClick={() => { setSearchInput(''); setSearchQuery(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-accent/50"><X className="w-3.5 h-3.5 text-muted-foreground" /></button>}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-3" />
          <p className="text-sm text-muted-foreground">Recherche multi-sources en cours...</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Europe Multi-langues • 7 catégories • Sources premium</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-8 h-8 text-red-400/60 mb-3" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <button onClick={() => fetchNews(true)} className="mt-3 px-4 py-1.5 rounded-lg text-xs bg-accent/50 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">Réessayer</button>
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Newspaper className="w-10 h-10 text-muted-foreground/20 mb-3" />
          <p className="text-sm text-muted-foreground font-medium">{searchQuery ? 'Aucun résultat' : 'Aucun article'}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">{searchQuery ? 'Essayez d\'autres mots-clés' : 'Actualisez les données'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((item, idx) => {
            const key = item.url || `${item.title}-${idx}`;
            const catInfo = CATEGORIES.find(c => c.key === item.category);
            const isFav = favorites.has(key);
            const isImp = important.has(key);
            const isExpanded = expandedSummary === key;
            const sumText = summaries[key];
            const catColor = catInfo?.color || '#6366f1';
            const isPremium = item.source === 'high';

            return (
              <div key={key}
                className="rounded-xl border border-border bg-card/50 backdrop-blur-sm hover:border-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group animate-fade-in-up overflow-hidden"
                style={{ animationDelay: `${Math.min(idx * 40, 400)}ms` }}>

                {/* Left color accent bar */}
                <div className="flex">
                  <div className="w-1 shrink-0 rounded-l-xl" style={{ backgroundColor: catColor }} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Article link */}
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="block p-4">
                      <div className="flex items-start gap-3">
                        {/* Favicon */}
                        {item.favicon ? (
                          <img src={item.favicon} alt="" className="w-5 h-5 rounded mt-0.5 shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <div className="w-5 h-5 rounded bg-muted flex items-center justify-center shrink-0 mt-0.5"><Newspaper className="w-3 h-3 text-muted-foreground" /></div>
                        )}

                        <div className="flex-1 min-w-0">
                          {/* Title row with premium badge */}
                          <div className="flex items-start gap-2">
                            {isPremium && (
                              <span className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/20 mt-0.5">
                                <Zap className="w-2.5 h-2.5" />
                                Premium
                              </span>
                            )}
                            <h3 className="text-sm font-semibold text-foreground group-hover:text-indigo-400 transition-colors line-clamp-2 flex-1 leading-snug">
                              {item.title}
                            </h3>
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/0 group-hover:text-indigo-400 shrink-0 mt-0.5 transition-all" />
                          </div>

                          {/* Snippet */}
                          {item.snippet && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{item.snippet}</p>}

                          {/* AI Summary expanded */}
                          {isExpanded && sumText && (
                            <div className="mt-2.5 rounded-lg bg-gradient-to-br from-indigo-500/5 to-violet-500/5 border border-indigo-500/10 p-3 animate-fade-in-up">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <Sparkles className="w-3 h-3 text-indigo-400" />
                                <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">Résumé IA</span>
                              </div>
                              <p className="text-xs text-foreground/80 leading-relaxed">{sumText}</p>
                            </div>
                          )}

                          {/* Meta row */}
                          <div className="flex items-center flex-wrap gap-1.5 mt-2.5">
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Globe className="w-3 h-3" />{item.hostName}
                            </span>
                            {item.date && (
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />{timeAgo(item.date)}
                              </span>
                            )}
                            {catInfo && item.category !== 'all' && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium border"
                                style={{ backgroundColor: `${catColor}15`, color: catColor, borderColor: `${catColor}30` }}>
                                {CAT_LABELS[item.category] || item.category}
                              </span>
                            )}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${SOURCE_BADGE[item.source] || SOURCE_BADGE.low}`}>
                              {SOURCE_LABEL[item.source] || 'Web'}
                            </span>
                            {isImp && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-violet-400" /> Suivi
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </a>

                    {/* Actions bar */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/30 bg-background/20">
                      <div className="flex items-center gap-1">
                        {/* AI Summary button */}
                        <button onClick={() => getSummary(item)} disabled={loadingSummary[key]}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10 disabled:opacity-50 transition-all">
                          {loadingSummary[key] ? <Loader2 className="w-3 h-3 animate-spin" /> : isExpanded ? <EyeOff className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                          {isExpanded ? 'Masquer' : 'Résumé IA'}
                        </button>
                        {/* Star/Important toggle */}
                        <button onClick={() => toggleStar(key)}
                          className={`p-1 rounded-md transition-all ${isImp ? 'text-amber-400' : 'text-muted-foreground/50 hover:text-amber-400'}`}>
                          {isImp ? <Star className="w-3.5 h-3.5 fill-amber-400" /> : <Star className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Bookmark toggle */}
                        <button onClick={() => toggleFav(key)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-all ${
                            isFav
                              ? 'text-amber-400 bg-amber-500/10'
                              : 'text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10'
                          }`}>
                          {isFav ? <BookmarkCheck className="w-3 h-3" /> : <BookmarkPlus className="w-3 h-3" />}
                          {isFav ? 'Sauvegardé' : 'Favoris'}
                        </button>
                        {/* Open link */}
                        <a href={item.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10 transition-all">
                          <ArrowUpRight className="w-3 h-3" /> Ouvrir
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
