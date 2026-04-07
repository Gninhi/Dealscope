'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { AuthLayout, AuthLogo, AuthFooter } from '@/components/auth/auth-layout';
import { ButtonSpinner, LoadingSpinner } from '@/components/auth/loading-spinner';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setError('Email ou mot de passe incorrect');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AuthLogo />
      <h1 className="text-2xl font-bold text-foreground text-center">DealScope</h1>
      <p className="text-muted-foreground mt-1 text-center">Plateforme M&A — Connexion</p>

      <div className="glass-card rounded-2xl p-8 mt-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm text-muted-foreground">Adresse email</Label>
            <Input id="email" type="email" placeholder="vous@entreprise.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} className="bg-background/50 border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20 h-11" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm text-muted-foreground">Mot de passe</Label>
              <button type="button" className="text-xs text-violet-400 hover:text-violet-300 transition-colors" onClick={() => alert('Fonctionnalité bientôt disponible. Contactez votre administrateur.')}>Mot de passe oublié ?</button>
            </div>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} className="bg-background/50 border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20 h-11" />
          </div>

          <Button type="submit" disabled={loading} className={cn('w-full h-11 font-medium', 'bg-gradient-to-r from-violet-600 to-indigo-600', 'hover:from-violet-500 hover:to-indigo-500', 'text-white shadow-lg shadow-violet-500/25', 'disabled:opacity-50 disabled:cursor-not-allowed')}>
            {loading ? <span className="flex items-center gap-2"><ButtonSpinner /> Connexion en cours...</span> : 'Se connecter'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Pas encore de compte ?{' '}
            <a href="/register" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">Créer un compte</a>
          </p>
        </div>
      </div>

      <AuthFooter />
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthLayout><LoadingSpinner text="Chargement..." /></AuthLayout>}>
      <LoginForm />
    </Suspense>
  );
}
