'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { AuthLayout, AuthLogo, AuthFooter } from '@/components/auth/auth-layout';
import { PasswordStrengthIndicator } from '@/components/auth/password-strength';
import { ButtonSpinner, LoadingSpinner } from '@/components/auth/loading-spinner';

export default function SetupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    companyName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    // Check if setup is needed
    fetch('/api/auth/setup')
      .then((res) => res.json())
      .then((data) => {
        if (!data.isFirstSetup) {
          router.push('/login');
        }
      })
      .catch(() => {})
      .finally(() => setCheckingSetup(false));
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          companyName: formData.companyName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la configuration');
        return;
      }

      // Auto sign-in after setup
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.ok) {
        router.push('/');
        router.refresh();
      } else {
        router.push('/login');
      }
    } catch {
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSetup) {
    return (
      <AuthLayout>
        <LoadingSpinner text="Vérification..." />
      </AuthLayout>
    );
  }

  const inputClass = "bg-background/50 border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20 h-11";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden py-8">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-indigo-600/10" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-lg px-4">
        <AuthLogo size="large" />
        <h1 className="text-3xl font-bold text-foreground text-center">Bienvenue sur DealScope</h1>
        <p className="text-muted-foreground mt-2 max-w-sm mx-auto text-center">
          Configurez votre espace de travail M&A en créant le premier compte administrateur.
        </p>

        <div className="glass-card rounded-2xl p-8 mt-8">
          <div className="mb-6 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <p className="text-sm text-violet-300">
              <strong>Première configuration</strong> — Ce compte aura le rôle d&apos;administrateur avec accès complet à la plateforme.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-sm text-muted-foreground">Nom de l&apos;entreprise</Label>
              <Input id="companyName" placeholder="Ex: Cabinet Dupont & Associés" value={formData.companyName} onChange={handleChange} required disabled={loading} className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm text-muted-foreground">Prénom</Label>
                <Input id="firstName" placeholder="Jean" value={formData.firstName} onChange={handleChange} required disabled={loading} className={inputClass} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm text-muted-foreground">Nom</Label>
                <Input id="lastName" placeholder="Dupont" value={formData.lastName} onChange={handleChange} required disabled={loading} className={inputClass} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-muted-foreground">Adresse email</Label>
              <Input id="email" type="email" placeholder="vous@entreprise.com" value={formData.email} onChange={handleChange} required disabled={loading} className={inputClass} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-muted-foreground">Mot de passe administrateur</Label>
              <Input id="password" type="password" placeholder="Min. 8 caractères, 1 majuscule, 1 chiffre" value={formData.password} onChange={handleChange} required disabled={loading} className={inputClass} />
              <PasswordStrengthIndicator password={formData.password} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm text-muted-foreground">Confirmer le mot de passe</Label>
              <Input id="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required disabled={loading} className={inputClass} />
            </div>

            <Button type="submit" disabled={loading} className={cn('w-full h-11 font-medium', 'bg-gradient-to-r from-violet-600 to-indigo-600', 'hover:from-violet-500 hover:to-indigo-500', 'text-white shadow-lg shadow-violet-500/25', 'disabled:opacity-50 disabled:cursor-not-allowed')}>
              {loading ? <span className="flex items-center gap-2"><ButtonSpinner /> Configuration en cours...</span> : "Créer l'espace de travail"}
            </Button>
          </form>
        </div>

        <AuthFooter />
      </div>
    </div>
  );
}
