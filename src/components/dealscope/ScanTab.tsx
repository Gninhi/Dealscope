'use client';

import { useState, useEffect, useCallback } from 'react';
import {
Radar, Search, Loader2, Zap, CheckCircle, AlertCircle,
FileText, Sparkles, Cpu
} from 'lucide-react';
import { useDealScopeStore } from '@/store/use-deal-scope-store';
import { apiFetch } from '@/lib/api-client';
import { ModelSelector } from '@/components/ui/model-selector';
import { AVAILABLE_MODELS, DEFAULT_MODEL } from '@/lib/llm/types';

interface ScanResult {
  success: boolean;
  scanId: string;
  companiesCreated: number;
  totalFound: number;
  error?: string;
}

export default function ScanTab() {
  const { icpProfiles, setIcpProfiles, setActiveTab } = useDealScopeStore();
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('');
  const [selectedIcp, setSelectedIcp] = useState('');
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/icp-profiles')
      .then(res => res.text())
      .then(text => { try { const data = JSON.parse(text); if (Array.isArray(data)) setIcpProfiles(data); } catch (error) { console.error('[ScanTab] Failed to parse ICP profiles:', error); } })
      .catch(() => {});
  }, [setIcpProfiles]);

  const handleScan = async () => {
    if (!query && !sector) {
      setError('Veuillez entrer une requête ou sélectionner un secteur');
      return;
    }

    setIsScanning(true);
    setError('');
    setResult(null);

    try {
      const res = await apiFetch('/api/scan', {
        method: 'POST',
        body: JSON.stringify({
          query,
          sector,
          icpProfileId: selectedIcp || undefined,
          model: selectedModel,
          limit: 15,
        }),
      });

      if (!res.ok) throw new Error('Scan failed');
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError('Erreur lors du scan. Veuillez réessayer.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Scan IA</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Scanner automatiquement les entreprises via API Gouv, InfoGreffe et scoring IA
        </p>
      </div>

      {/* Scan card */}
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Scan intelligent</h3>
            <p className="text-xs text-muted-foreground">Recherche multi-sources avec scoring IA</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Query */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Requête</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ex: logiciels SaaS, intelligence artificielle, e-commerce..."
                className="w-full pl-10 pr-4 py-3 rounded-lg text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
              />
            </div>
          </div>

          {/* Sector */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Secteur NAF (optionnel)</label>
            <input
              type="text"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              placeholder="ex: J (Information), C (Industrie)..."
              className="w-full px-4 py-3 rounded-lg text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
            />
          </div>

          {/* ICP Profile */}
{icpProfiles.length > 0 && (
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Profil ICP (optionnel)</label>
            <select
              value={selectedIcp}
              onChange={(e) => setSelectedIcp(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-sm bg-background border border-border text-foreground focus:outline-none focus:border-indigo-500/50 transition-colors appearance-none"
            >
              <option value="">Aucun profil</option>
{icpProfiles.map((p: { id: string; name: string }) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
            </select>
          </div>
        )}

        {/* Model Selector */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            Modèle IA
          </label>
          <ModelSelector
            models={AVAILABLE_MODELS}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            className="w-full"
          />
        </div>
      </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Action */}
        <button
          onClick={handleScan}
          disabled={isScanning || (!query && !sector)}
          className="w-full py-3 rounded-lg text-sm font-medium bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Scan en cours...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Lancer le scan
            </>
          )}
        </button>

        {/* Result */}
        {result && (
          <div className={`rounded-lg p-4 ${result.success ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-destructive/10 border border-destructive/20'}`}>
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-destructive" />
              )}
              <h4 className="text-sm font-semibold text-foreground">
                {result.success ? 'Scan terminé' : 'Erreur'}
              </h4>
            </div>
            {result.success && (
              <div className="space-y-1 text-sm">
                <p className="text-foreground">
                  <span className="font-semibold">{result.totalFound}</span> entreprises trouvées
                </p>
                <p className="text-foreground">
                  <span className="font-semibold">{result.companiesCreated}</span> nouvelles entreprises ajoutées au pipeline
                </p>
              </div>
            )}
            {result.success && (
              <button
                onClick={() => setActiveTab('pipeline')}
                className="mt-3 text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                Voir dans le pipeline →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="rounded-xl border border-border bg-card/30 p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          Comment ça marche
        </h3>
        <div className="space-y-3 text-xs text-muted-foreground">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
            <p>La recherche s&apos;effectue en parallèle sur <strong className="text-foreground">API Gouv</strong> (données officielles + dirigeants) et <strong className="text-foreground">InfoGreffe</strong> (données financières).</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
            <p>Les résultats sont dédupliqués par SIREN et enrichis avec les données financières InfoGreffe.</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
            <p>Chaque entreprise est scorée par <strong className="text-foreground">l&apos;IA</strong> (0-100) selon sa pertinence comme cible M&A.</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">4</div>
            <p>Les entreprises sont ajoutées au pipeline avec le statut &quot;Identifiées&quot;.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
