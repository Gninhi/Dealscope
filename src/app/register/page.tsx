'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Faible', color: 'bg-red-500' };
  if (score <= 3) return { score, label: 'Moyen', color: 'bg-amber-500' };
  if (score <= 4) return { score, label: 'Bon', color: 'bg-emerald-500' };
  return { score, label: 'Excellent', color: 'bg-emerald-400' };
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordStrength = useMemo(
    () => getPasswordStrength(formData.password),
    [formData.password],
  );

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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors de l\'inscription');
        return;
      }

      // Auto sign-in after registration
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden py-8">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-indigo-600/10" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 mb-4 shadow-lg shadow-violet-500/25">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">DealScope</h1>
          <p className="text-muted-foreground mt-1">Créer votre compte</p>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm text-muted-foreground">
                  Prénom
                </Label>
                <Input
                  id="firstName"
                  placeholder="Jean"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="bg-background/50 border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm text-muted-foreground">
                  Nom
                </Label>
                <Input
                  id="lastName"
                  placeholder="Dupont"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="bg-background/50 border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20 h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-muted-foreground">
                Adresse email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@entreprise.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="bg-background/50 border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20 h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-muted-foreground">
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 caractères, 1 majuscule, 1 chiffre"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                className="bg-background/50 border-white/10 focus:border-violet-500/50 focus:ring-violet-500/20 h-11"
              />
              {formData.password && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          'h-1 flex-1 rounded-full transition-colors',
                          i <= passwordStrength.score
                            ? passwordStrength.color
                            : 'bg-white/10'
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Force : <span className={passwordStrength.color.replace('bg-', 'text-')}>{passwordStrength.label}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm text-muted-foreground">
                Confirmer le mot de passe
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
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
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Création en cours...
                </span>
              ) : (
                'Créer mon compte'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Déjà un compte ?{' '}
              <a
                href="/login"
                className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                Se connecter
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          DealScope — © 2025 Tous droits réservés
        </p>
      </div>
    </div>
  );
}
