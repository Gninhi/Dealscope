'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Trash2, Loader2, CheckCircle, AlertCircle,
  Database, Sparkles, Building2
} from 'lucide-react';
import { useDealScopeStore } from '@/store/use-deal-scope-store';
import { apiFetch } from '@/lib/api-client';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface ICPProfile {
  id: string;
  name: string;
  criteria: string;
  weights: string;
  isActive: boolean;
  createdAt: string;
  _count?: { targetCompanies: number };
}

export default function SettingsTab() {
  const { icpProfiles, setIcpProfiles } = useDealScopeStore();
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCriteria, setNewCriteria] = useState('');
  const [newWeights, setNewWeights] = useState('');
  const [creating, setCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<any>(null);
  const [workspaceInfo, setWorkspaceInfo] = useState<any>(null);

  const fetchProfiles = async () => {
    try {
      const res = await apiFetch('/api/icp-profiles');
      if (!res.ok) return;
      const text = await res.text();
      try { const data = JSON.parse(text); if (Array.isArray(data)) setIcpProfiles(data); } catch (error) { console.error('[SettingsTab] Failed to parse ICP profiles:', error); }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
    // Fetch workspace info
    apiFetch('/api/companies')
      .then(res => { if (!res.ok) return ''; return res.text(); })
      .then(text => { if (!text) return; try { const data = JSON.parse(text); setWorkspaceInfo({ companyCount: Array.isArray(data) ? data.length : 0 }); } catch (error) { console.error('[SettingsTab] Failed to parse workspace info:', error); } })
      .catch(() => {});
  }, [setIcpProfiles]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await apiFetch('/api/icp-profiles', {
        method: 'POST',
        body: JSON.stringify({
          name: newName,
          criteria: newCriteria || '{}',
          weights: newWeights || '{}',
        }),
      });
      if (res.ok) {
        await fetchProfiles();
        setNewName('');
        setNewCriteria('');
        setNewWeights('');
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
    } finally {
      setCreating(false);
    }
  };

  const [confirmState, setConfirmState] = useState<{open: boolean; title: string; description: string; onConfirm: () => void}>({open: false, title: '', description: '', onConfirm: () => {}});

  const handleDelete = async (id: string) => {
    setConfirmState({
      open: true,
      title: 'Supprimer le profil ICP',
      description: 'Supprimer ce profil ICP ?',
      onConfirm: async () => {
        setConfirmState(prev => ({...prev, open: false}));
        try {
          await apiFetch(`/api/icp-profiles?id=${id}`, { method: 'DELETE' });
          await fetchProfiles();
        } catch (error) {
          console.error('Error deleting profile:', error);
        }
      },
    });
    return;
  };

  const handleToggleActive = async (profile: ICPProfile) => {
    try {
      await apiFetch('/api/icp-profiles', {
        method: 'PUT',
        body: JSON.stringify({ id: profile.id, isActive: !profile.isActive }),
      });
      await fetchProfiles();
    } catch (error) {
      console.error('Error toggling profile:', error);
    }
  };

  const handleSeed = async () => {
    setConfirmState({
      open: true,
      title: 'Réinitialiser les données',
      description: 'Cela va réinitialiser toutes les données et créer des données de démonstration. Continuer ?',
      onConfirm: async () => {
        setConfirmState(prev => ({...prev, open: false}));
        setSeeding(true);
        setSeedResult(null);
        try {
          const res = await apiFetch('/api/seed', { method: 'POST' });
          const data = await res.json();
          setSeedResult(data);
          await fetchProfiles();
        } catch (error) {
          console.error('Seed error:', error);
        } finally {
          setSeeding(false);
        }
      },
    });
    return;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Paramètres</h2>
        <p className="text-muted-foreground text-sm mt-1">Configuration de votre espace de travail</p>
      </div>

      {/* Workspace info */}
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Espace de travail</h3>
            <p className="text-xs text-muted-foreground">DealScope Demo — Plan Premium</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-background/50 p-3">
            <p className="text-xs text-muted-foreground">Entreprises</p>
            <p className="text-lg font-bold text-foreground">{workspaceInfo?.companyCount || 0}</p>
          </div>
          <div className="rounded-lg bg-background/50 p-3">
            <p className="text-xs text-muted-foreground">Profils ICP</p>
            <p className="text-lg font-bold text-foreground">{icpProfiles.length}</p>
          </div>
        </div>
      </div>

      {/* ICP Profiles */}
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">Profils ICP</h3>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouveau profil
          </button>
        </div>

        {/* Create form */}
        {showCreateForm && (
          <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4 mb-4 space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nom du profil"
              className="w-full px-3 py-2 rounded-lg text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
            <textarea
              value={newCriteria}
              onChange={(e) => setNewCriteria(e.target.value)}
              placeholder='Critères JSON (optionnel): {"sectors": ["J"], "revenueMin": 1000000}'
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none font-mono"
            />
            <textarea
              value={newWeights}
              onChange={(e) => setNewWeights(e.target.value)}
              placeholder='Pondérations JSON (optionnel): {"sector": 30, "revenue": 25}'
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm bg-background border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none font-mono"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600 disabled:opacity-50 transition-all"
              >
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Créer'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* Profiles list */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
          </div>
        ) : icpProfiles.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Aucun profil ICP configuré</p>
        ) : (
          <div className="space-y-2">
            {icpProfiles.map((profile: ICPProfile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-accent/20 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full ${profile.isActive ? 'bg-emerald-400' : 'bg-muted-foreground/30'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{profile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {profile._count?.targetCompanies || 0} entreprise{((profile._count?.targetCompanies || 0) > 1) ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleActive(profile)}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                      profile.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-accent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {profile.isActive ? 'Actif' : 'Inactif'}
                  </button>
                  <button
                    onClick={() => handleDelete(profile.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Management */}
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <Database className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Données de démonstration</h3>
            <p className="text-xs text-muted-foreground">Réinitialiser avec des données fictives</p>
          </div>
        </div>

        <button
          onClick={handleSeed}
          disabled={seeding}
          className="w-full py-3 rounded-lg text-sm font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
        >
          {seeding ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Chargement...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Charger les données de démo</>
          )}
        </button>

        {seedResult && (
          <div className={`mt-3 rounded-lg p-3 ${seedResult.success ? 'bg-emerald-500/10' : 'bg-destructive/10'}`}>
            {seedResult.success ? (
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span>{seedResult.companies} entreprises, {seedResult.icpProfiles} profils ICP créés</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span>Erreur lors du chargement</span>
              </div>
            )}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState(prev => ({...prev, open}))}
        title={confirmState.title}
        description={confirmState.description}
        onConfirm={confirmState.onConfirm}
        variant="destructive"
      />
    </div>
  );
}
