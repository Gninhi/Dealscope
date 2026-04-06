'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useDealScopeStore } from '@/store/use-deal-scope-store';
import Sidebar from '@/components/dealscope/Sidebar';
import DashboardTab from '@/components/dealscope/DashboardTab';
import SearchTab from '@/components/dealscope/SearchTab';
import PipelineTab from '@/components/dealscope/PipelineTab';
import ScanTab from '@/components/dealscope/ScanTab';
import ChatTab from '@/components/dealscope/ChatTab';
import NewsTab from '@/components/dealscope/NewsTab';
import SettingsTab from '@/components/dealscope/SettingsTab';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/* ── Login Form (embedded) ─────────────────────────── */
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError('Email ou mot de passe incorrect');
      }
      // On success, NextAuth + useSession will refresh automatically
    } catch {
      setError('Une erreur est survenue lors de la connexion');
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-indigo-600/10" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 mb-4 shadow-lg shadow-violet-500/25">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">DealScope</h1>
          <p className="text-muted-foreground mt-1">Plateforme M&A — Connexion</p>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-muted-foreground">Adresse email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@entreprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="bg-background/50 border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-muted-foreground">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="•••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="bg-background/50 border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20 h-11"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full h-11 font-medium',
                'bg-gradient-to-r from-violet-600 to-indigo-600',
                'hover:from-violet-500 hover:to-indigo-500',
                'text-white shadow-lg shadow-violet-500/25',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Connexion en cours...
                </span>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          DealScope — © 2025 Tous droits réservés
        </p>
      </div>
    </div>
  );
}

/* ── Main App (authenticated) ─────────────────────── */
function AppContent() {
  const { activeTab, sidebarOpen, setCompanies } = useDealScopeStore();

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/companies', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        try {
          const data = JSON.parse(text);
          if (Array.isArray(data)) setCompanies(data);
        } catch { /* ignore */ }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [setCompanies]);

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'recherche':
        return <SearchTab />;
      case 'pipeline':
        return <PipelineTab />;
      case 'scan':
        return <ScanTab />;
      case 'chat':
        return <ChatTab />;
      case 'actualites':
        return <NewsTab />;
      case 'parametres':
        return <SettingsTab />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main
        className={cn(
          'flex-1 transition-all duration-300',
          sidebarOpen ? 'ml-60' : 'ml-[72px]',
        )}
      >
        <div className="p-6 max-w-[1600px]">{renderTab()}</div>
      </main>
    </div>
  );
}

/* ── Root: auth gate ────────────────────────────────── */
export default function Home() {
  const { data: session, status } = useSession();

  // Loading session FIRST
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Then check unauthenticated
  if (status === 'unauthenticated') {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    );
  }

  // Authenticated → show app
  return <AppContent />;
}
